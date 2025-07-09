
-- Create bible_versions table if not exists
CREATE TABLE IF NOT EXISTS bible_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    version_code VARCHAR(10) UNIQUE NOT NULL,
    version_name VARCHAR(100) NOT NULL,
    language_code VARCHAR(5) NOT NULL DEFAULT 'en',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_version_code (version_code),
    INDEX idx_language_code (language_code)
);

-- Insert Bible versions
INSERT IGNORE INTO bible_versions (version_code, version_name, language_code, description, is_active) VALUES
('KJV', 'King James Version', 'en', 'Traditional English translation from 1611', TRUE),
('NIV', 'New International Version', 'en', 'Modern English translation for contemporary readers', TRUE),
('ESV', 'English Standard Version', 'en', 'Literal translation emphasizing word-for-word accuracy', TRUE),
('NLT', 'New Living Translation', 'en', 'Contemporary English translation for easy reading', TRUE),
('NASB', 'New American Standard Bible', 'en', 'Literal translation focusing on accuracy', TRUE),
('CSB', 'Christian Standard Bible', 'en', 'Modern English translation balancing accuracy and clarity', TRUE),
('NKJV', 'New King James Version', 'en', 'Updated King James Version with modern language', TRUE),
('MSG', 'The Message', 'en', 'Contemporary paraphrase in modern language', TRUE),
('TEV', 'Telugu Bible', 'te', 'Telugu translation for Telugu speakers', TRUE),
('HIB', 'Hindi Bible', 'hi', 'Hindi translation for Hindi speakers', TRUE),
('TAB', 'Tamil Bible', 'ta', 'Tamil translation for Tamil speakers', TRUE),
('KNB', 'Kannada Bible', 'kn', 'Kannada translation for Kannada speakers', TRUE),
('MLB', 'Malayalam Bible', 'ml', 'Malayalam translation for Malayalam speakers', TRUE),
('BGB', 'Bengali Bible', 'bn', 'Bengali translation for Bengali speakers', TRUE),
('GUB', 'Gujarati Bible', 'gu', 'Gujarati translation for Gujarati speakers', TRUE),
('PUB', 'Punjabi Bible', 'pa', 'Punjabi translation for Punjabi speakers', TRUE),
('MAB', 'Marathi Bible', 'mr', 'Marathi translation for Marathi speakers', TRUE),
('ORB', 'Oriya Bible', 'or', 'Oriya translation for Oriya speakers', TRUE),
('ASB', 'Assamese Bible', 'as', 'Assamese translation for Assamese speakers', TRUE),
('URB', 'Urdu Bible', 'ur', 'Urdu translation for Urdu speakers', TRUE);

-- Add version_id column to bible_verses if not exists
ALTER TABLE bible_verses ADD COLUMN IF NOT EXISTS version_id INT DEFAULT 1;

-- Add foreign key constraint if not exists
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.KEY_COLUMN_USAGE 
                  WHERE TABLE_NAME = 'bible_verses' 
                  AND COLUMN_NAME = 'version_id' 
                  AND REFERENCED_TABLE_NAME = 'bible_versions');

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE bible_verses ADD CONSTRAINT fk_bible_verses_version FOREIGN KEY (version_id) REFERENCES bible_versions(id)',
    'SELECT "Foreign key already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing verses to reference KJV version (id = 1)
UPDATE bible_verses SET version_id = 1 WHERE version_id IS NULL OR version_id = 0;

-- Create sample posts if posts table exists and is empty
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    author_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert sample posts if none exist
INSERT IGNORE INTO posts (id, title, content, author_id) VALUES
(1, 'Welcome to Our Bible Study Platform', '<p>Welcome to our comprehensive Bible study platform! Here you can read, search, and study the Word of God in multiple languages and versions.</p><p>Features include:</p><ul><li>Multiple Bible versions</li><li>Multi-language support</li><li>Verse search and favorites</li><li>Daily verse of the day</li><li>Reading plans and notes</li></ul>', 1),
(2, 'The Power of Daily Scripture Reading', '<p>Regular Bible reading transforms our hearts and minds. As we meditate on God''s Word daily, we grow in wisdom, faith, and understanding.</p><p>"Your word is a lamp for my feet, a light on my path." - Psalm 119:105</p><p>Make Bible reading a daily habit and watch how God speaks to you through His Word.</p>', 1),
(3, 'Understanding Different Bible Translations', '<p>Our platform offers multiple Bible versions to help you study Scripture more deeply. Each translation has its unique approach:</p><ul><li><strong>KJV:</strong> Traditional, formal language</li><li><strong>NIV:</strong> Balance of accuracy and readability</li><li><strong>ESV:</strong> Word-for-word accuracy</li><li><strong>NLT:</strong> Thought-for-thought clarity</li></ul><p>Use multiple versions together for comprehensive study!</p>', 1);
