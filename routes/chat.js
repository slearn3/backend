
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Admin middleware - check for admin role
const requireAdmin = async (req, res, next) => {
  try {
    // Get user details from database to check role
    const [userRows] = await pool.execute(
      'SELECT role FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (userRows.length === 0 || userRows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Error checking admin role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get messages for current user (regular users see their own messages + general admin messages)
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // For regular users: show their own messages and admin messages directed to them or general admin messages
    const [rows] = await pool.execute(`
      SELECT id, message, sender, sender_name, timestamp, user_id 
      FROM chat_messages 
      WHERE user_id = ? OR (sender = 'admin' AND (user_id = ? OR user_id IS NULL))
      ORDER BY timestamp ASC
    `, [userId, userId]);
    
    console.log(`Fetched ${rows.length} messages for user ${userId}`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message (regular users)
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const sender = 'user';
    const sender_name = req.user.name;
    const user_id = req.user.id;

    console.log(`User ${user_id} sending message: ${message}`);

    const [result] = await pool.execute(
      'INSERT INTO chat_messages (message, sender, sender_name, user_id) VALUES (?, ?, ?, ?)',
      [message, sender, sender_name, user_id]
    );

    const [messageRows] = await pool.execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [result.insertId]
    );

    console.log('User message saved successfully:', messageRows[0]);
    res.status(201).json(messageRows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Admin send message to specific user
router.post('/admin/messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message, user_id } = req.body;
    const sender = 'admin';
    const sender_name = 'Admin';

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required for admin messages' });
    }

    console.log(`Admin sending message to user ${user_id}: ${message}`);

    const [result] = await pool.execute(
      'INSERT INTO chat_messages (message, sender, sender_name, user_id) VALUES (?, ?, ?, ?)',
      [message, sender, sender_name, user_id]
    );

    const [messageRows] = await pool.execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [result.insertId]
    );

    console.log('Admin message saved successfully:', messageRows[0]);
    res.status(201).json(messageRows[0]);
  } catch (error) {
    console.error('Error sending admin message:', error);
    res.status(500).json({ error: 'Failed to send admin message' });
  }
});

// Get messages for a specific user conversation (admin only)
router.get('/user/:userId/messages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`Admin fetching conversation with user ${userId}`);
    
    // Get messages between admin and specific user, plus general admin messages
    const [rows] = await pool.execute(`
      SELECT id, message, sender, sender_name, timestamp, user_id 
      FROM chat_messages 
      WHERE user_id = ? OR (sender = 'admin' AND user_id = ?)
      ORDER BY timestamp ASC
    `, [userId, userId]);
    
    console.log(`Fetched ${rows.length} messages for admin conversation with user ${userId}`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ error: 'Failed to fetch user messages' });
  }
});

// Admin broadcast message to all users (optional feature)
router.post('/admin/broadcast', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    const sender = 'admin';
    const sender_name = 'Admin';

    console.log(`Admin broadcasting message: ${message}`);

    const [result] = await pool.execute(
      'INSERT INTO chat_messages (message, sender, sender_name, user_id) VALUES (?, ?, ?, ?)',
      [message, sender, sender_name, null] // null user_id means broadcast to all
    );

    const [messageRows] = await pool.execute(
      'SELECT * FROM chat_messages WHERE id = ?',
      [result.insertId]
    );

    console.log('Admin broadcast message saved successfully:', messageRows[0]);
    res.status(201).json(messageRows[0]);
  } catch (error) {
    console.error('Error sending broadcast message:', error);
    res.status(500).json({ error: 'Failed to send broadcast message' });
  }
});

module.exports = router;
