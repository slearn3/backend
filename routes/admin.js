
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

// Get all users with online status
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // First, update offline users (haven't been seen in last 5 minutes)
    await pool.execute(
      'UPDATE users SET is_online = FALSE WHERE last_seen < DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
    );

    // Then get all users with their status
    const [rows] = await pool.execute(`
      SELECT id, name, email, role, created_at, last_seen, 
             COALESCE(is_online, FALSE) as is_online 
      FROM users 
      ORDER BY is_online DESC, last_seen DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Update user presence (for admin tracking)
router.post('/users/presence', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    await pool.execute(
      'UPDATE users SET last_seen = NOW(), is_online = TRUE WHERE id = ?',
      [userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user presence:', error);
    res.status(500).json({ error: 'Failed to update user presence' });
  }
});

// Update user
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const [result] = await pool.execute(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name, email, role || 'user', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [userRows] = await pool.execute(
      'SELECT id, name, email, role, created_at, last_seen, COALESCE(is_online, FALSE) as is_online FROM users WHERE id = ?',
      [id]
    );

    res.json(userRows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

module.exports = router;
