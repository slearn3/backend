
const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Update user presence
router.post('/update', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { offline } = req.body;
    
    if (offline) {
      // Set user offline
      await pool.execute(
        'UPDATE users SET is_online = FALSE WHERE id = ?',
        [userId]
      );
      console.log(`User ${userId} set to offline`);
    } else {
      // Update last_seen and set is_online to true
      await pool.execute(
        'UPDATE users SET last_seen = NOW(), is_online = TRUE WHERE id = ?',
        [userId]
      );
      console.log(`User ${userId} presence updated - online`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating presence:', error);
    res.status(500).json({ error: 'Failed to update presence' });
  }
});

// Get online users count
router.get('/online-count', async (req, res) => {
  try {
    // Users are considered offline if they haven't been seen in the last 5 minutes
    await pool.execute(
      'UPDATE users SET is_online = FALSE WHERE last_seen < DATE_SUB(NOW(), INTERVAL 5 MINUTE)'
    );

    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE is_online = TRUE'
    );

    res.json({ count: rows[0].count });
  } catch (error) {
    console.error('Error getting online count:', error);
    res.status(500).json({ error: 'Failed to get online count' });
  }
});

module.exports = router;
