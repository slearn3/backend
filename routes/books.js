
const express = require('express');
const pool = require('../config/database');

const router = express.Router();

// Get all unique books
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT DISTINCT book 
      FROM bible_verses 
      ORDER BY 
        CASE 
          WHEN book = 'Genesis' THEN 1
          WHEN book = 'Exodus' THEN 2
          WHEN book = 'Leviticus' THEN 3
          WHEN book = 'Numbers' THEN 4
          WHEN book = 'Deuteronomy' THEN 5
          WHEN book = 'Joshua' THEN 6
          WHEN book = 'Judges' THEN 7
          WHEN book = 'Ruth' THEN 8
          WHEN book = '1 Samuel' THEN 9
          WHEN book = '2 Samuel' THEN 10
          WHEN book = '1 Kings' THEN 11
          WHEN book = '2 Kings' THEN 12
          WHEN book = '1 Chronicles' THEN 13
          WHEN book = '2 Chronicles' THEN 14
          WHEN book = 'Ezra' THEN 15
          WHEN book = 'Nehemiah' THEN 16
          WHEN book = 'Esther' THEN 17
          WHEN book = 'Job' THEN 18
          WHEN book = 'Psalms' THEN 19
          WHEN book = 'Proverbs' THEN 20
          WHEN book = 'Ecclesiastes' THEN 21
          WHEN book = 'Song of Solomon' THEN 22
          WHEN book = 'Isaiah' THEN 23
          WHEN book = 'Jeremiah' THEN 24
          WHEN book = 'Lamentations' THEN 25
          WHEN book = 'Ezekiel' THEN 26
          WHEN book = 'Daniel' THEN 27
          WHEN book = 'Hosea' THEN 28
          WHEN book = 'Joel' THEN 29
          WHEN book = 'Amos' THEN 30
          WHEN book = 'Obadiah' THEN 31
          WHEN book = 'Jonah' THEN 32
          WHEN book = 'Micah' THEN 33
          WHEN book = 'Nahum' THEN 34
          WHEN book = 'Habakkuk' THEN 35
          WHEN book = 'Zephaniah' THEN 36
          WHEN book = 'Haggai' THEN 37
          WHEN book = 'Zechariah' THEN 38
          WHEN book = 'Malachi' THEN 39
          WHEN book = 'Matthew' THEN 40
          WHEN book = 'Mark' THEN 41
          WHEN book = 'Luke' THEN 42
          WHEN book = 'John' THEN 43
          WHEN book = 'Acts' THEN 44
          WHEN book = 'Romans' THEN 45
          WHEN book = '1 Corinthians' THEN 46
          WHEN book = '2 Corinthians' THEN 47
          WHEN book = 'Galatians' THEN 48
          WHEN book = 'Ephesians' THEN 49
          WHEN book = 'Philippians' THEN 50
          WHEN book = 'Colossians' THEN 51
          WHEN book = '1 Thessalonians' THEN 52
          WHEN book = '2 Thessalonians' THEN 53
          WHEN book = '1 Timothy' THEN 54
          WHEN book = '2 Timothy' THEN 55
          WHEN book = 'Titus' THEN 56
          WHEN book = 'Philemon' THEN 57
          WHEN book = 'Hebrews' THEN 58
          WHEN book = 'James' THEN 59
          WHEN book = '1 Peter' THEN 60
          WHEN book = '2 Peter' THEN 61
          WHEN book = '1 John' THEN 62
          WHEN book = '2 John' THEN 63
          WHEN book = '3 John' THEN 64
          WHEN book = 'Jude' THEN 65
          WHEN book = 'Revelation' THEN 66
          ELSE 999
        END
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get chapters for a specific book
router.get('/chapters', async (req, res) => {
  try {
    const { book } = req.query;
    
    if (!book) {
      return res.status(400).json({ error: 'Book parameter is required' });
    }

    const [rows] = await pool.execute(
      'SELECT DISTINCT chapter FROM bible_verses WHERE book = ? ORDER BY chapter',
      [book]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

module.exports = router;
