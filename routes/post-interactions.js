
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get post stats (likes and comments count)
router.get('/:postId/stats', async (req, res) => {
  try {
    const { postId } = req.params;
    
    const [likesResult] = await pool.execute(
      'SELECT COUNT(*) as like_count FROM post_likes WHERE post_id = ?',
      [postId]
    );
    
    const [commentsResult] = await pool.execute(
      'SELECT COUNT(*) as comment_count FROM post_comments WHERE post_id = ?',
      [postId]
    );
    
    res.json({
      likes: likesResult[0].like_count,
      comments: commentsResult[0].comment_count
    });
  } catch (error) {
    console.error('Error fetching post stats:', error);
    res.status(500).json({ error: 'Failed to fetch post stats' });
  }
});

// Toggle like on a post
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    // Check if user already liked the post
    const [existing] = await pool.execute(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    if (existing.length > 0) {
      // Unlike the post
      await pool.execute(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      );
      res.json({ liked: false, message: 'Post unliked' });
    } else {
      // Like the post
      await pool.execute(
        'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)',
        [postId, userId]
      );
      res.json({ liked: true, message: 'Post liked' });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Get user's like status for a post
router.get('/:postId/like-status', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const [result] = await pool.execute(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    res.json({ liked: result.length > 0 });
  } catch (error) {
    console.error('Error checking like status:', error);
    res.status(500).json({ error: 'Failed to check like status' });
  }
});

// Get comments for a post
router.get('/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;

    const [comments] = await pool.execute(`
      SELECT 
        c.id,
        c.comment,
        c.created_at,
        u.name as author_name
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
    `, [postId]);

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment to a post
router.post('/:postId/comments', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }

    const [result] = await pool.execute(
      'INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)',
      [postId, userId, comment.trim()]
    );

    const [newComment] = await pool.execute(`
      SELECT 
        c.id,
        c.comment,
        c.created_at,
        u.name as author_name
      FROM post_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    res.status(201).json(newComment[0]);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
