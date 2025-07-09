
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all notes for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [notes] = await pool.execute(`
      SELECT 
        id,
        title,
        content,
        verse_reference,
        tags,
        created_at,
        updated_at
      FROM user_notes
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `, [userId]);

    // Parse tags from JSON string
    const notesWithTags = notes.map(note => ({
      ...note,
      tags: note.tags ? JSON.parse(note.tags) : []
    }));

    res.json(notesWithTags);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create a new note
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content, verse_reference, tags } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : null;

    const [result] = await pool.execute(
      'INSERT INTO user_notes (user_id, title, content, verse_reference, tags) VALUES (?, ?, ?, ?, ?)',
      [userId, title, content, verse_reference || null, tagsJson]
    );

    const [newNote] = await pool.execute(`
      SELECT 
        id,
        title,
        content,
        verse_reference,
        tags,
        created_at,
        updated_at
      FROM user_notes
      WHERE id = ?
    `, [result.insertId]);

    const noteWithTags = {
      ...newNote[0],
      tags: newNote[0].tags ? JSON.parse(newNote[0].tags) : []
    };

    res.status(201).json(noteWithTags);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update a note
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, verse_reference, tags } = req.body;
    const userId = req.user.id;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : null;

    // Check if note belongs to user
    const [existing] = await pool.execute(
      'SELECT id FROM user_notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await pool.execute(
      'UPDATE user_notes SET title = ?, content = ?, verse_reference = ?, tags = ? WHERE id = ? AND user_id = ?',
      [title, content, verse_reference || null, tagsJson, id, userId]
    );

    const [updatedNote] = await pool.execute(`
      SELECT 
        id,
        title,
        content,
        verse_reference,
        tags,
        created_at,
        updated_at
      FROM user_notes
      WHERE id = ?
    `, [id]);

    const noteWithTags = {
      ...updatedNote[0],
      tags: updatedNote[0].tags ? JSON.parse(updatedNote[0].tags) : []
    };

    res.json(noteWithTags);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete a note
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if note belongs to user
    const [existing] = await pool.execute(
      'SELECT id FROM user_notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    await pool.execute(
      'DELETE FROM user_notes WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;
