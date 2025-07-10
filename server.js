const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add logging middleware to debug route issues
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bible-versions', require('./routes/bible-versions'));
app.use('/api/verses', require('./routes/verses'));
app.use('/api/books', require('./routes/books'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/highlights', require('./routes/highlights'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/word-meaning', require('./routes/word-meaning'));
app.use('/api/post-interactions', require('./routes/post-interactions'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/presence', require('./routes/presence'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/cross-references', require('./routes/cross-references'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

console.log("Google Search API Key loaded?", !!process.env.GOOGLE_SEARCH_API_KEY);
console.log("Google Search Engine ID loaded?", !!process.env.GOOGLE_SEARCH_ENGINE_ID);
console.log("Server routes registered:");
console.log("- /api/word-meaning");

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('404 - Route not found:', req.originalUrl);
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
