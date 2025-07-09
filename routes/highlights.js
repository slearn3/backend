const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user highlights
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching highlights for user:', req.user.id);
    
    // First check if highlights table exists
    const [tables] = await pool.execute("SHOW TABLES LIKE 'highlights'");
    if (tables.length === 0) {
      console.log('Highlights table does not exist - returning empty array');
      return res.json([]);
    }
    
    // Query highlights with proper join to bible_verses table
    const [highlights] = await pool.execute(
      `SELECT 
         h.id,
         h.user_id,
         h.verse_id,
         h.color_hex,
         h.highlighted_text,
         h.start_offset,
         h.end_offset,
         h.note,
         h.created_at,
         h.updated_at,
         bv.book,
         bv.chapter,
         bv.verse_number,
         bv.text,
         bv.version_id,
         bvr.version_name,
         bvr.version_code
       FROM highlights h
       LEFT JOIN bible_verses bv ON h.verse_id = bv.id
       LEFT JOIN bible_versions bvr ON bv.version_id = bvr.id
       WHERE h.user_id = ? 
       ORDER BY h.created_at DESC`,
      [req.user.id]
    );
    
    console.log('Found highlights:', highlights.length);
    if (highlights.length > 0) {
      highlights.forEach((highlight, index) => {
        if (index < 3) {
          console.log(`Highlight ${index + 1} note data:`, {
            id: highlight.id,
            note: highlight.note,
            noteType: typeof highlight.note,
            hasNote: !!highlight.note
          });
        }
      });
    }
    res.json(highlights);
  } catch (error) {
    console.error('Error fetching highlights:', error);
    res.status(500).json({ error: 'Failed to fetch highlights', details: error.message });
  }
});

// Create highlight
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { verse_id, color_hex, highlighted_text, start_offset, end_offset, note } = req.body;
    
    console.log('=== CREATING HIGHLIGHT - DETAILED DEBUG ===');
    console.log('Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('Extracted note value:', {
      note: note,
      noteType: typeof note,
      noteLength: note ? note.length : 0,
      hasNote: !!note,
      isEmptyString: note === '',
      isNull: note === null,
      isUndefined: note === undefined
    });
    
    // Verify the verse exists
    const [verses] = await pool.execute(
      'SELECT id, book, chapter, verse_number FROM bible_verses WHERE id = ?',
      [verse_id]
    );
    
    if (verses.length === 0) {
      console.error('Verse not found for ID:', verse_id);
      return res.status(400).json({ error: 'Verse not found' });
    }
    
    console.log('Verse found:', verses[0]);
    
    // Handle note value properly - convert empty string to null, keep actual content
    let noteToSave = null;
    if (note !== undefined && note !== null) {
      const trimmedNote = String(note).trim();
      noteToSave = trimmedNote.length > 0 ? trimmedNote : null;
    }
    
    console.log('Note processing:', {
      originalNote: note,
      processedNote: noteToSave,
      willSaveAsNull: noteToSave === null
    });
    
    // Insert the highlight with explicit note handling
    const insertQuery = `INSERT INTO highlights (user_id, verse_id, color_hex, highlighted_text, start_offset, end_offset, note, created_at) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
    
    const insertParams = [
      req.user.id, 
      verse_id, 
      color_hex, 
      highlighted_text, 
      start_offset || 0, 
      end_offset || 0, 
      noteToSave
    ];
    
    console.log('SQL Query:', insertQuery);
    console.log('SQL Parameters:', insertParams.map((param, index) => ({
      index,
      value: param,
      type: typeof param,
      isNull: param === null
    })));
    
    const [result] = await pool.execute(insertQuery, insertParams);
    
    console.log('Insert result:', {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    });
    
    // Verify the insertion by fetching the created highlight
    const [createdHighlight] = await pool.execute(
      'SELECT id, note, highlighted_text, user_id, verse_id FROM highlights WHERE id = ?',
      [result.insertId]
    );
    
    console.log('=== VERIFICATION - CREATED HIGHLIGHT ===');
    console.log('Database record:', {
      id: createdHighlight[0].id,
      note: createdHighlight[0].note,
      noteType: typeof createdHighlight[0].note,
      hasNote: !!createdHighlight[0].note,
      highlighted_text: createdHighlight[0].highlighted_text,
      user_id: createdHighlight[0].user_id,
      verse_id: createdHighlight[0].verse_id
    });
    
    res.json({ 
      id: result.insertId,
      message: 'Highlight created successfully',
      note: createdHighlight[0].note,
      debug: {
        noteReceived: !!note,
        noteProcessed: noteToSave,
        savedNote: createdHighlight[0].note,
        savedSuccessfully: true
      }
    });
  } catch (error) {
    console.error('=== ERROR CREATING HIGHLIGHT ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to create highlight', details: error.message });
  }
});

// Update highlight
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const highlightId = req.params.id;
    const { color_hex, highlighted_text, note } = req.body;
    
    console.log('=== UPDATING HIGHLIGHT ===');
    console.log('Highlight ID:', highlightId);
    console.log('Update data:', { color_hex, highlighted_text, note });
    console.log('Note details:', {
      note: note,
      noteType: typeof note,
      hasNote: !!note
    });
    
    // Build dynamic query based on what fields are provided
    let updateFields = [];
    let updateValues = [];
    
    if (color_hex !== undefined) {
      updateFields.push('color_hex = ?');
      updateValues.push(color_hex);
    }
    
    if (highlighted_text !== undefined) {
      updateFields.push('highlighted_text = ?');
      updateValues.push(highlighted_text);
    }
    
    if (note !== undefined) {
      updateFields.push('note = ?');
      // Handle note the same way as in create
      const noteToSave = note !== null && note !== undefined ? 
        (String(note).trim().length > 0 ? String(note).trim() : null) : null;
      updateValues.push(noteToSave);
      console.log('Note will be updated to:', noteToSave);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateFields.push('updated_at = NOW()');
    updateValues.push(highlightId, req.user.id);
    
    const query = `UPDATE highlights SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
    
    console.log('Update query:', query);
    console.log('Update values:', updateValues);
    
    const [result] = await pool.execute(query, updateValues);
    
    console.log('Update result:', result);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Highlight not found or not owned by user' });
    }
    
    // Verify the update
    const [updatedHighlight] = await pool.execute(
      'SELECT id, note, highlighted_text FROM highlights WHERE id = ? AND user_id = ?',
      [highlightId, req.user.id]
    );
    
    console.log('Verification - Updated highlight:', updatedHighlight[0]);
    
    res.json({ 
      message: 'Highlight updated successfully',
      debug: {
        affectedRows: result.affectedRows,
        updatedHighlight: updatedHighlight[0]
      }
    });
  } catch (error) {
    console.error('=== ERROR UPDATING HIGHLIGHT ===');
    console.error('Error details:', error);
    res.status(500).json({ error: 'Failed to update highlight', details: error.message });
  }
});

// Delete highlight
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM highlights WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Highlight not found or not owned by user' });
    }
    
    res.json({ message: 'Highlight deleted successfully' });
  } catch (error) {
    console.error('Error deleting highlight:', error);
    res.status(500).json({ error: 'Failed to delete highlight', details: error.message });
  }
});

module.exports = router;
