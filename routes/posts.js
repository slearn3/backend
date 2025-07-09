
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, u.name as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      ORDER BY p.created_at DESC
    `);
    console.log('Fetched posts:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get latest post
router.get('/latest', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.*, u.name as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      ORDER BY p.created_at DESC 
      LIMIT 1
    `);
    console.log('Latest post query result:', rows);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'No posts found' });
    }
  } catch (error) {
    console.error('Error fetching latest post:', error);
    res.status(500).json({ error: 'Failed to fetch latest post' });
  }
});

// Get single post by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT p.*, u.name as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      WHERE p.id = ?
    `, [id]);
    
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create new post
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const author_id = req.user.id;

    console.log('Creating post:', { title, content, author_id });

    const [result] = await pool.execute(
      'INSERT INTO posts (title, content, author_id) VALUES (?, ?, ?)',
      [title, content, author_id]
    );

    const [postRows] = await pool.execute(`
      SELECT p.*, u.name as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      WHERE p.id = ?
    `, [result.insertId]);

    console.log('Created post:', postRows[0]);
    res.status(201).json(postRows[0]);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const author_id = req.user.id;

    // Check if user owns the post or is admin
    const [existingPost] = await pool.execute(
      'SELECT * FROM posts WHERE id = ?', [id]
    );

    if (existingPost.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost[0].author_id !== author_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    await pool.execute(
      'UPDATE posts SET title = ?, content = ? WHERE id = ?',
      [title, content, id]
    );

    const [updatedPost] = await pool.execute(`
      SELECT p.*, u.name as author_name 
      FROM posts p 
      LEFT JOIN users u ON p.author_id = u.id 
      WHERE p.id = ?
    `, [id]);

    res.json(updatedPost[0]);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const author_id = req.user.id;

    // Check if user owns the post or is admin
    const [existingPost] = await pool.execute(
      'SELECT * FROM posts WHERE id = ?', [id]
    );

    if (existingPost.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost[0].author_id !== author_id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await pool.execute('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

module.exports = router;
