
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Check if JWT_SECRET is available
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set!');
  console.error('Please create a .env file in the backend directory with JWT_SECRET=your_secret_key');
}

// Initialize Google OAuth client
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Google OAuth login/signup endpoint
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;

    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    if (!GOOGLE_CLIENT_ID) {
      return res.status(500).json({ error: 'Google OAuth not configured. Please contact administrator.' });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log('Google OAuth payload:', { googleId, email, name });

    // Check if user already exists with this Google ID
    const [existingGoogleUsers] = await pool.execute(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE google_id = ?',
      [googleId]
    );

    let user;

    if (existingGoogleUsers.length > 0) {
      // User exists with Google ID, log them in
      user = existingGoogleUsers[0];
      console.log('Existing Google user found:', user.id);
    } else {
      // Check if user exists with same email (link accounts)
      const [existingEmailUsers] = await pool.execute(
        'SELECT id, name, email, phone, role, created_at FROM users WHERE email = ?',
        [email]
      );

      if (existingEmailUsers.length > 0) {
        // Link Google account to existing email account
        await pool.execute(
          'UPDATE users SET google_id = ?, profile_picture = ? WHERE email = ?',
          [googleId, picture, email]
        );
        user = existingEmailUsers[0];
        console.log('Linked Google account to existing user:', user.id);
      } else {
        // Create new user
        const [result] = await pool.execute(
          'INSERT INTO users (name, email, google_id, profile_picture, role) VALUES (?, ?, ?, ?, ?)',
          [name, email, googleId, picture, 'user']
        );

        const [userRows] = await pool.execute(
          'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
          [result.insertId]
        );

        user = userRows[0];
        console.log('Created new Google user:', user.id);
      }
    }

    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      name: user.name, 
      role: user.role 
    }, JWT_SECRET);

    res.json({ user, token });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(400).json({ error: 'Google authentication failed' });
  }
});

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, 'user']
    );

    const [userRows] = await pool.execute(
      'SELECT id, name, email, phone, role, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    const user = userRows[0];
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET);

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'An account with this email already exists' });
    } else {
      res.status(500).json({ error: 'Registration failed' });
    }
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server configuration error. Please contact administrator.' });
    }

    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET);

    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Update user profile
router.put('/profile', authenticateToken, upload.single('profileImage'), async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;
    
    console.log('Updating profile for user:', userId);
    console.log('Request body:', { name, phone });
    console.log('File:', req.file);

    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    let profilePicturePath = null;
    
    // Handle profile image upload
    if (req.file) {
      profilePicturePath = `/uploads/profiles/${req.file.filename}`;
      console.log('Profile picture uploaded:', profilePicturePath);
    }

    // Build update query dynamically
    let updateQuery = 'UPDATE users SET name = ?, phone = ?';
    let updateParams = [name.trim(), phone.trim() || null];

    if (profilePicturePath) {
      updateQuery += ', profile_picture = ?';
      updateParams.push(profilePicturePath);
    }

    updateQuery += ' WHERE id = ?';
    updateParams.push(userId);

    // Update user in database
    await pool.execute(updateQuery, updateParams);

    // Fetch updated user data
    const [userRows] = await pool.execute(
      'SELECT id, name, email, phone, role, profile_picture, created_at FROM users WHERE id = ?',
      [userId]
    );

    const updatedUser = userRows[0];
    console.log('Profile updated successfully:', updatedUser);

    res.json({ 
      user: updatedUser,
      message: 'Profile updated successfully' 
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password endpoint
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current user data
    const [userRows] = await pool.execute('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // Verify old password
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const [userRows] = await pool.execute('SELECT id, name FROM users WHERE email = ?', [email]);
    
    if (userRows.length === 0) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with this email exists, a password reset link will be sent.' });
    }

    // Generate reset token (in production, you'd send this via email)
    const resetToken = jwt.sign({ userId: userRows[0].id, type: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' });
    
    // Store reset token in database (you'd need a password_resets table in production)
    // For now, we'll just return it (not secure for production)
    console.log('Password reset token for', email, ':', resetToken);

    res.json({ 
      message: 'If an account with this email exists, a password reset link will be sent.',
      // Remove this in production - only for demo
      resetToken: resetToken
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Verify reset token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({ error: 'Invalid reset token' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.userId]);

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
