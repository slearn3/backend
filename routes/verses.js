
const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get verses by book and chapter
router.get('/', async (req, res) => {
  try {
    const { book, chapter, version = 'KJV' } = req.query;

    if (!book || !chapter) {
      return res.status(400).json({ error: 'Book and chapter are required' });
    }

    console.log('Fetching verses for:', { book, chapter, version });

    // Updated query to work with version-specific verses
    const [rows] = await pool.execute(`
      SELECT bv.*, ver.version_name, ver.language_code 
      FROM bible_verses bv
      LEFT JOIN bible_versions ver ON bv.version_id = ver.id
      WHERE bv.book = ? AND bv.chapter = ? 
      AND (ver.version_code = ? OR bv.version_id = 1)
      ORDER BY bv.verse_number
    `, [book, chapter, version]);

    console.log('Found verses:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching verses:', error);
    res.status(500).json({ error: 'Failed to fetch verses' });
  }
});

// Get verse of the day
router.get('/verse-of-day', async (req, res) => {
  try {
    const { version = 'KJV' } = req.query;
    
    console.log('Fetching verse of the day for version:', version);
    
    // Get a random verse from the database
    const [rows] = await pool.execute(`
      SELECT bv.*, ver.version_name, ver.language_code 
      FROM bible_verses bv
      LEFT JOIN bible_versions ver ON bv.version_id = ver.id
      WHERE ver.version_code = ? OR bv.version_id = 1
      ORDER BY RAND() 
      LIMIT 1
    `, [version]);
    
    if (rows.length > 0) {
      console.log('Verse of day:', rows[0]);
      res.json(rows[0]);
    } else {
      // Fallback to any verse if specific version not found
      const [fallbackRows] = await pool.execute(`
        SELECT * FROM bible_verses 
        ORDER BY RAND() 
        LIMIT 1
      `);
      
      if (fallbackRows.length > 0) {
        console.log('Fallback verse of day:', fallbackRows[0]);
        res.json(fallbackRows[0]);
      } else {
        res.status(404).json({ error: 'No verses found' });
      }
    }
  } catch (error) {
    console.error('Error fetching verse of day:', error);
    res.status(500).json({ error: 'Failed to fetch verse of day' });
  }
});

// Search verses globally - Fixed to properly filter by version
router.get('/search', async (req, res) => {
  try {
    const { q, version = 'KJV' } = req.query;
    
    if (!q || q.trim() === '') {
      return res.json([]);
    }
    
    const searchTerm = `%${q.toLowerCase()}%`;
    console.log('Searching for:', searchTerm, 'in version:', version);
    
    // Updated search query to properly filter by version with fallback
    const [rows] = await pool.execute(`
      SELECT bv.*, ver.version_name, ver.language_code, ver.version_code
      FROM bible_verses bv
      INNER JOIN bible_versions ver ON bv.version_id = ver.id
      WHERE (
        LOWER(bv.text) LIKE ? OR
        LOWER(bv.book) LIKE ? OR
        CAST(bv.chapter AS CHAR) LIKE ? OR
        CAST(bv.verse_number AS CHAR) LIKE ?
      )
      AND ver.version_code = ?
      ORDER BY bv.book, bv.chapter, bv.verse_number
      LIMIT 100
    `, [searchTerm, searchTerm, searchTerm, searchTerm, version]);
    
    console.log('Search results found:', rows.length, 'for version:', version);
    
    // If no results found for the specific version, try fallback search
    if (rows.length === 0) {
      console.log('No results for version', version, 'trying fallback search');
      const [fallbackRows] = await pool.execute(`
        SELECT bv.*, ver.version_name, ver.language_code, ver.version_code
        FROM bible_verses bv
        LEFT JOIN bible_versions ver ON bv.version_id = ver.id
        WHERE (
          LOWER(bv.text) LIKE ? OR
          LOWER(bv.book) LIKE ? OR
          CAST(bv.chapter AS CHAR) LIKE ? OR
          CAST(bv.verse_number AS CHAR) LIKE ?
        )
        ORDER BY bv.book, bv.chapter, bv.verse_number
        LIMIT 100
      `, [searchTerm, searchTerm, searchTerm, searchTerm]);
      
      console.log('Fallback search results:', fallbackRows.length);
      res.json(fallbackRows);
    } else {
      res.json(rows);
    }
  } catch (error) {
    console.error('Error searching verses:', error);
    res.status(500).json({ error: 'Failed to search verses' });
  }
});

module.exports = router;
