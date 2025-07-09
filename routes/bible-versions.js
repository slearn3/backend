
const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get all Bible versions that have actual verse data
router.get('/', async (req, res) => {
  try {
    const { language_code } = req.query;
    
    let query = `
      SELECT DISTINCT bv.*, COUNT(verses.id) as verse_count
      FROM bible_versions bv
      LEFT JOIN bible_verses verses ON bv.id = verses.version_id
      WHERE bv.is_active = TRUE
    `;
    let params = [];
    
    if (language_code) {
      query += ' AND bv.language_code = ?';
      params.push(language_code);
    }
    
    query += ` 
      GROUP BY bv.id, bv.version_code, bv.version_name, bv.language_code, bv.description, bv.is_active
      HAVING verse_count > 0
      ORDER BY bv.language_code, bv.version_name
    `;
    
    const [rows] = await pool.execute(query, params);
    console.log('Fetched Bible versions with verse data:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching Bible versions:', error);
    res.status(500).json({ error: 'Failed to fetch Bible versions' });
  }
});

// Get chapters available for a specific book and version
router.get('/:versionCode/books/:book/chapters', async (req, res) => {
  try {
    const { versionCode, book } = req.params;
    
    console.log('Fetching chapters for version:', versionCode, 'book:', book);
    
    const [rows] = await pool.execute(`
      SELECT DISTINCT bv.chapter 
      FROM bible_verses bv
      JOIN bible_versions ver ON bv.version_id = ver.id
      WHERE bv.book = ? AND ver.version_code = ?
      ORDER BY bv.chapter
    `, [book, versionCode]);
    
    const chapters = rows.map(row => row.chapter);
    console.log('Found chapters:', chapters.length, 'for', book, 'in', versionCode);
    res.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters by version and book:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// Get verses by version
router.get('/:versionCode/verses', async (req, res) => {
  try {
    const { versionCode } = req.params;
    const { book, chapter } = req.query;

    if (!book || !chapter) {
      return res.status(400).json({ error: 'Book and chapter are required' });
    }

    console.log('Fetching verses for version:', versionCode, 'book:', book, 'chapter:', chapter);

    const [rows] = await pool.execute(`
      SELECT bv.*, ver.version_name, ver.language_code, ver.version_code
      FROM bible_verses bv
      JOIN bible_versions ver ON bv.version_id = ver.id
      WHERE bv.book = ? AND bv.chapter = ? AND ver.version_code = ?
      ORDER BY bv.verse_number
    `, [book, chapter, versionCode]);

    console.log('Found verses:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching verses by version:', error);
    res.status(500).json({ error: 'Failed to fetch verses' });
  }
});

// Get multiple versions for parallel reading
router.get('/parallel/:book/:chapter', async (req, res) => {
  try {
    const { book, chapter } = req.params;
    const { versions } = req.query; // comma-separated version codes

    if (!versions) {
      return res.status(400).json({ error: 'Version codes are required' });
    }

    const versionCodes = versions.split(',');
    const placeholders = versionCodes.map(() => '?').join(',');

    const [rows] = await pool.execute(`
      SELECT 
        bv.verse_number,
        bv.text,
        ver.version_code,
        ver.version_name,
        ver.language_code
      FROM bible_verses bv
      JOIN bible_versions ver ON bv.version_id = ver.id
      WHERE bv.book = ? AND bv.chapter = ? AND ver.version_code IN (${placeholders})
      ORDER BY bv.verse_number, ver.version_code
    `, [book, chapter, ...versionCodes]);

    // Group by verse number
    const groupedVerses = {};
    rows.forEach(verse => {
      if (!groupedVerses[verse.verse_number]) {
        groupedVerses[verse.verse_number] = {};
      }
      groupedVerses[verse.verse_number][verse.version_code] = {
        text: verse.text,
        version_name: verse.version_name,
        language_code: verse.language_code
      };
    });

    res.json(groupedVerses);
  } catch (error) {
    console.error('Error fetching parallel verses:', error);
    res.status(500).json({ error: 'Failed to fetch parallel verses' });
  }
});

// Get books available for a version
router.get('/:versionCode/books', async (req, res) => {
  try {
    const { versionCode } = req.params;
    
    const [rows] = await pool.execute(`
      SELECT DISTINCT bv.book 
      FROM bible_verses bv
      JOIN bible_versions ver ON bv.version_id = ver.id
      WHERE ver.version_code = ?
      ORDER BY bv.book
    `, [versionCode]);
    
    const books = rows.map(row => row.book);
    res.json(books);
  } catch (error) {
    console.error('Error fetching books by version:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

module.exports = router;
