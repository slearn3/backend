
async function getOrCreateVersion(connection, versionCode, language, versionName) {
  console.log(`Getting or creating version: ${versionCode} - ${versionName} (${language})`);
  
  // First try to find by version_code (exact match)
  const [existing] = await connection.execute(
    'SELECT id FROM bible_versions WHERE version_code = ?',
    [versionCode]
  );
  
  if (existing.length > 0) {
    console.log(`Version ${versionCode} already exists with ID: ${existing[0].id}`);
    return existing[0].id;
  }
  
  // Create new version if not exists
  const [result] = await connection.execute(
    'INSERT INTO bible_versions (version_code, version_name, language_code, is_active) VALUES (?, ?, ?, TRUE)',
    [versionCode, versionName, language]
  );
  
  console.log(`Created new version ${versionCode} with ID: ${result.insertId}`);
  return result.insertId;
}

async function insertVerse(connection, bookName, chapterNumber, verseNumber, verseText, language, versionId) {
  console.log(`Inserting verse ${bookName} ${chapterNumber}:${verseNumber} for version ID ${versionId}`);
  
  // Insert verse with the new structure - one text field per version
  await connection.execute(`
    INSERT INTO bible_verses (book, chapter, verse_number, text, version_id)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE text = VALUES(text)
  `, [bookName, chapterNumber, verseNumber, verseText, versionId]);
}

async function getImportStatistics(connection) {
  const [stats] = await connection.execute(`
    SELECT 
      COUNT(*) as total_verses,
      COUNT(DISTINCT book) as total_books,
      COUNT(DISTINCT version_id) as total_versions
    FROM bible_verses
  `);
  
  const [versionStats] = await connection.execute(`
    SELECT 
      bv.version_code,
      bv.version_name,
      bv.language_code,
      COUNT(verses.id) as verse_count
    FROM bible_versions bv
    LEFT JOIN bible_verses verses ON bv.id = verses.version_id
    GROUP BY bv.id, bv.version_code, bv.version_name, bv.language_code
    ORDER BY verse_count DESC
  `);
  
  console.log('\n📊 Version Statistics:');
  versionStats.forEach(stat => {
    console.log(`   ${stat.version_code} (${stat.version_name}) [${stat.language_code}]: ${stat.verse_count} verses`);
  });
  
  return stats[0];
}

module.exports = { 
  getOrCreateVersion, 
  insertVerse, 
  getImportStatistics 
};
