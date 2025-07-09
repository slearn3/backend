
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const { parseXMLFile } = require('./utils/xmlParser');
const { detectLanguageAndVersion } = require('./utils/versionDetector');
const { getOrCreateVersion, getImportStatistics } = require('./utils/databaseOperations');
const { checkXMLDirectory, getXMLFiles } = require('./utils/fileOperations');
const { processXMLData } = require('./utils/xmlProcessor');

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bible_app',
};

async function importBibleData() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🚀 Starting Bible XML import...');
    
    // Path to your downloaded XML files
    const xmlDir = './xml-data';
    
    // Check if directory exists
    if (!(await checkXMLDirectory(xmlDir))) {
      return;
    }
    
    const xmlFiles = await getXMLFiles(xmlDir);
    if (!xmlFiles) {
      return;
    }
    
    console.log(`📚 Found ${xmlFiles.length} XML files`);
    
    for (const filename of xmlFiles) {
      const filePath = path.join(xmlDir, filename);
      console.log(`📖 Processing ${filename}...`);
      
      const xmlData = await parseXMLFile(filePath);
      if (!xmlData) continue;
      
      // Get biblename from XML
      const biblename = xmlData.XMLBIBLE?.biblename || filename;
      const { versionCode, language, versionName } = detectLanguageAndVersion(filename, biblename);
      
      console.log(`   Detected version: ${versionCode} (${versionName}), language: ${language}`);
      
      // Get or create version with proper name
      const versionId = await getOrCreateVersion(connection, versionCode, language, versionName);
      
      // Process XML data
      const insertCount = await processXMLData(xmlData, filename, connection, versionId, language);
      
      console.log(`✅ Processed ${filename} - ${insertCount} verses`);
    }
    
    // Get statistics
    const stats = await getImportStatistics(connection);
    
    console.log('\n📊 Import Statistics:');
    console.log(`   Total verses: ${stats.total_verses}`);
    console.log(`   Total books: ${stats.total_books}`);
    console.log(`   Total versions: ${stats.total_versions}`);
    
    console.log('\n🎉 Bible XML import completed successfully!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await connection.end();
  }
}

// Run the import
if (require.main === module) {
  importBibleData().catch(console.error);
}

module.exports = { importBibleData };
