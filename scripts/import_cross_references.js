
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const xml2js = require('xml2js');
const path = require('path');
const { mapBookName } = require('./utils/bookNameMapper');
require('dotenv').config();

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bible_app',
};

async function parseXMLFile(filePath) {
  try {
    const xmlData = await fs.readFile(filePath, 'utf8');
    console.log(`📄 XML file size: ${xmlData.length} characters`);
    
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true
    });
    
    const result = await parser.parseStringPromise(xmlData);
    console.log('🔍 XML root keys:', Object.keys(result));
    
    return result;
  } catch (error) {
    console.error(`Error parsing XML file ${filePath}:`, error);
    return null;
  }
}

async function insertCrossReference(connection, fromBook, fromChapter, fromVerse, toBook, toChapter, toVerse, relationText = null) {
  try {
    // Map book names to full names
    const fullFromBook = mapBookName(fromBook);
    const fullToBook = mapBookName(toBook);
    
    console.log(`📝 Mapping: ${fromBook} -> ${fullFromBook}, ${toBook} -> ${fullToBook}`);
    
    await connection.execute(`
      INSERT IGNORE INTO cross_references (from_book, from_chapter, from_verse, to_book, to_chapter, to_verse, relation_text)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [fullFromBook, fromChapter, fromVerse, fullToBook, toChapter, toVerse, relationText]);
    return true;
  } catch (error) {
    console.error('Error inserting cross-reference:', error);
    return false;
  }
}

function parseVerseReference(reference) {
  console.log(`🔍 Parsing reference: "${reference}"`);
  
  // Handle different reference formats like "Gen.1.1", "Job.26.7", etc.
  const patterns = [
    // "Gen.1.1", "Job.26.7", "Ps.104.30" format
    /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/,
    // "John 3:16", "1 John 3:16" format  
    /^([1-3]?\s*[A-Za-z]+)\s+(\d+):(\d+)$/,
    // "Jn 3:16" abbreviated format
    /^([1-3]?[A-Za-z]+)\s*(\d+):(\d+)$/
  ];
  
  for (const pattern of patterns) {
    const match = reference.match(pattern);
    if (match) {
      const book = match[1].trim();
      const chapter = parseInt(match[2]);
      const verse = parseInt(match[3]);
      
      console.log(`✅ Parsed: ${book} ${chapter}:${verse}`);
      return { book, chapter, verse };
    }
  }
  
  console.log(`❌ Could not parse reference: "${reference}"`);
  return null;
}

async function processCrossReferencesXML(xmlData, connection) {
  let insertCount = 0;
  
  try {
    console.log('🔍 Processing XML structure...');
    
    // Access the crossReferences root
    if (!xmlData.crossReferences) {
      console.log('❌ No crossReferences root element found');
      return 0;
    }
    
    const crossRefsData = xmlData.crossReferences;
    console.log('📊 Cross-references data keys:', Object.keys(crossRefsData));
    
    // Get verses array
    let verses = crossRefsData.verse;
    if (!verses) {
      console.log('❌ No verse elements found');
      return 0;
    }
    
    // Ensure verses is an array
    if (!Array.isArray(verses)) {
      verses = [verses];
    }
    
    console.log(`🎯 Processing ${verses.length} verses...`);
    
    // Show sample verse structure
    if (verses.length > 0) {
      console.log('📖 Sample verse structure:', JSON.stringify(verses[0], null, 2));
    }
    
    for (const verse of verses) {
      try {
        // Get the verse ID (like "Gen.1.1")
        const verseId = verse.id;
        if (!verseId) {
          console.log('⚠️ No ID found for verse:', JSON.stringify(verse, null, 2));
          continue;
        }
        
        console.log(`🔍 Processing verse: ${verseId}`);
        
        // Parse the source verse reference
        const fromRef = parseVerseReference(verseId);
        if (!fromRef) {
          console.log(`⚠️ Could not parse source verse: ${verseId}`);
          continue;
        }
        
        // Get cross-references
        let refs = verse.ref;
        if (!refs) {
          console.log(`⚠️ No refs found for verse: ${verseId}`);
          continue;
        }
        
        // Ensure refs is an array
        if (!Array.isArray(refs)) {
          refs = [refs];
        }
        
        console.log(`🔗 Found ${refs.length} cross-references for ${verseId}`);
        
        for (const ref of refs) {
          let refText = '';
          
          // Extract reference text
          if (typeof ref === 'string') {
            refText = ref;
          } else if (ref._) {
            refText = ref._;
          } else if (ref.$t) {
            refText = ref.$t;
          } else {
            console.log('⚠️ Could not extract ref text from:', JSON.stringify(ref, null, 2));
            continue;
          }
          
          console.log(`📝 Processing ref: ${refText}`);
          
          // Parse the target verse reference
          const toRef = parseVerseReference(refText);
          if (!toRef) {
            console.log(`⚠️ Could not parse target verse: ${refText}`);
            continue;
          }
          
          // Insert cross-reference
          const success = await insertCrossReference(
            connection,
            fromRef.book,
            fromRef.chapter,
            fromRef.verse,
            toRef.book,
            toRef.chapter,
            toRef.verse,
            null // No relation text in this format
          );
          
          if (success) {
            insertCount++;
            if (insertCount % 100 === 0) {
              console.log(`📊 Inserted ${insertCount} cross-references so far...`);
            }
          }
        }
        
      } catch (verseError) {
        console.error('❌ Error processing verse:', verseError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error processing cross-references XML:', error);
  }
  
  return insertCount;
}

async function importCrossReferences() {
  const connection = await mysql.createConnection(dbConfig);
  
  try {
    console.log('🚀 Starting Cross-References import...');
    console.log('📖 Using book name mapping for compatibility...');
    
    const xmlDir = './xml-references';
    
    // Check if directory exists
    try {
      await fs.access(xmlDir);
    } catch (error) {
      console.error('❌ XML references directory not found. Please ensure ./xml-references directory exists.');
      return;
    }
    
    const files = await fs.readdir(xmlDir);
    const xmlFiles = files.filter(file => file.endsWith('.xml'));
    
    if (xmlFiles.length === 0) {
      console.error('❌ No XML files found in xml-references directory.');
      return;
    }
    
    console.log(`📚 Found ${xmlFiles.length} XML files`);
    
    let totalInserted = 0;
    
    for (const filename of xmlFiles) {
      const filePath = path.join(xmlDir, filename);
      console.log(`\n📖 Processing ${filename}...`);
      
      const xmlData = await parseXMLFile(filePath);
      if (!xmlData) continue;
      
      const insertCount = await processCrossReferencesXML(xmlData, connection);
      totalInserted += insertCount;
      
      console.log(`✅ Processed ${filename} - ${insertCount} cross-references inserted`);
    }
    
    // Get statistics
    const [stats] = await connection.execute('SELECT COUNT(*) as total FROM cross_references');
    
    console.log('\n📊 Import Statistics:');
    console.log(`   Total cross-references in database: ${stats[0].total}`);
    console.log(`   New cross-references inserted: ${totalInserted}`);
    
    if (totalInserted > 0) {
      console.log('\n🎉 Cross-References import completed successfully!');
      console.log('📚 Book names have been mapped from short forms to full names');
    } else {
      console.log('\n⚠️ No cross-references were inserted. Please check the logs above for issues.');
    }
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await connection.end();
  }
}

// Run the import
if (require.main === module) {
  importCrossReferences().catch(console.error);
}

module.exports = { importCrossReferences };
