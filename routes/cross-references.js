
const express = require('express');
const pool = require('../config/database');
const { mapBookName, getAllBookVariations } = require('../scripts/utils/bookNameMapper');

const router = express.Router();

// Get cross-references for a specific verse
router.get('/:book/:chapter/:verse', async (req, res) => {
  try {
    const { book, chapter, verse } = req.params;
    
    console.log(`Fetching cross-references for ${book} ${chapter}:${verse}`);
    
    // Get all possible book name variations (both short and full forms)
    const bookVariations = getAllBookVariations(book);
    const placeholders = bookVariations.map(() => '?').join(',');
    
    console.log(`📚 Searching for book variations: ${bookVariations.join(', ')}`);
    
    // Get cross-references where this verse is the source
    const [crossRefs] = await pool.execute(`
      SELECT 
        cr.to_book,
        cr.to_chapter,
        cr.to_verse,
        cr.relation_text,
        bv.text as verse_text,
        bv.version_id
      FROM cross_references cr
      LEFT JOIN bible_verses bv ON (
        cr.to_book = bv.book 
        AND cr.to_chapter = bv.chapter 
        AND cr.to_verse = bv.verse_number
        AND bv.version_id = 1
      )
      WHERE cr.from_book IN (${placeholders}) AND cr.from_chapter = ? AND cr.from_verse = ?
      ORDER BY cr.to_book, cr.to_chapter, cr.to_verse
      LIMIT 20
    `, [...bookVariations, chapter, parseInt(verse)]);
    
    // Also get cross-references where this verse is referenced by others
    const [reverseCrossRefs] = await pool.execute(`
      SELECT 
        cr.from_book as to_book,
        cr.from_chapter as to_chapter,
        cr.from_verse as to_verse,
        cr.relation_text,
        bv.text as verse_text,
        bv.version_id
      FROM cross_references cr
      LEFT JOIN bible_verses bv ON (
        cr.from_book = bv.book 
        AND cr.from_chapter = bv.chapter 
        AND cr.from_verse = bv.verse_number
        AND bv.version_id = 1
      )
      WHERE cr.to_book IN (${placeholders}) AND cr.to_chapter = ? AND cr.to_verse = ?
      ORDER BY cr.from_book, cr.from_chapter, cr.from_verse
      LIMIT 10
    `, [...bookVariations, chapter, parseInt(verse)]);
    
    // Combine and deduplicate results
    const allRefs = [...crossRefs, ...reverseCrossRefs];
    const uniqueRefs = allRefs.filter((ref, index, self) => 
      index === self.findIndex(r => 
        r.to_book === ref.to_book && 
        r.to_chapter === ref.to_chapter && 
        r.to_verse === ref.to_verse
      )
    );
    
    console.log(`📖 Found ${uniqueRefs.length} cross-references`);
    
    res.json({
      success: true,
      crossReferences: uniqueRefs.map(ref => ({
        book: ref.to_book,
        chapter: ref.to_chapter,
        verse: ref.to_verse,
        reference: `${ref.to_book} ${ref.to_chapter}:${ref.to_verse}`,
        text: ref.verse_text || '',
        relationText: ref.relation_text,
        versionId: ref.version_id
      }))
    });
    
  } catch (error) {
    console.error('Error fetching cross-references:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cross-references'
    });
  }
});

// Get statistics about cross-references
router.get('/stats', async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_references,
        COUNT(DISTINCT CONCAT(from_book, '-', from_chapter, '-', from_verse)) as unique_source_verses,
        COUNT(DISTINCT CONCAT(to_book, '-', to_chapter, '-', to_verse)) as unique_target_verses
      FROM cross_references
    `);
    
    const [topBooks] = await pool.execute(`
      SELECT 
        from_book,
        COUNT(*) as reference_count
      FROM cross_references
      GROUP BY from_book
      ORDER BY reference_count DESC
      LIMIT 10
    `);
    
    res.json({
      success: true,
      statistics: stats[0],
      topBooks: topBooks
    });
    
  } catch (error) {
    console.error('Error fetching cross-reference statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
