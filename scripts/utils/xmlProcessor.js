
const { extractVerseText } = require('./textExtractor');
const { insertVerse } = require('./databaseOperations');

async function processXMLData(xmlData, filename, connection, versionId, language) {
  // Handle XMLBIBLE structure
  if (!xmlData.XMLBIBLE || !xmlData.XMLBIBLE.BIBLEBOOK) {
    console.log(`   No BIBLEBOOK data found in ${filename}`);
    return 0;
  }

  const books = Array.isArray(xmlData.XMLBIBLE.BIBLEBOOK) 
    ? xmlData.XMLBIBLE.BIBLEBOOK 
    : [xmlData.XMLBIBLE.BIBLEBOOK];
  
  let insertCount = 0;
  
  for (const book of books) {
    const bookName = book.bname || book.bnumber || 'Unknown';
    console.log(`   Processing book: ${bookName}`);
    
    if (!book.CHAPTER) {
      console.log(`   No chapters found for book: ${bookName}`);
      continue;
    }
    
    const chapters = Array.isArray(book.CHAPTER) ? book.CHAPTER : [book.CHAPTER];
    
    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const chapter = chapters[chapterIndex];
      
      // Handle different ways chapter number can be specified
      let chapterNumber;
      if (chapter.cnumber !== undefined) {
        chapterNumber = parseInt(chapter.cnumber) || (chapterIndex + 1);
      } else if (chapter.$ && chapter.$.cnumber !== undefined) {
        chapterNumber = parseInt(chapter.$.cnumber) || (chapterIndex + 1);
      } else {
        chapterNumber = chapterIndex + 1;
      }
      
      console.log(`   Processing chapter: ${chapterNumber}`);
      
      if (chapter.VERS) {
        const verses = Array.isArray(chapter.VERS) ? chapter.VERS : [chapter.VERS];
        
        for (let verseIndex = 0; verseIndex < verses.length; verseIndex++) {
          const verse = verses[verseIndex];
          
          try {
            // Handle different ways verse number can be specified
            let verseNumber;
            if (verse.vnumber !== undefined) {
              verseNumber = parseInt(verse.vnumber) || (verseIndex + 1);
            } else if (verse.$ && verse.$.vnumber !== undefined) {
              verseNumber = parseInt(verse.$.vnumber) || (verseIndex + 1);
            } else {
              verseNumber = verseIndex + 1;
            }
            
            const rawVerseText = extractVerseText(verse);
            
            // Ensure we have a string and handle edge cases
            let verseText = '';
            if (typeof rawVerseText === 'string') {
              verseText = rawVerseText.trim();
            } else if (verse._ && typeof verse._ === 'string') {
              verseText = verse._.trim();
            } else if (typeof verse === 'string') {
              verseText = verse.trim();
            } else {
              console.warn(`   Warning: Non-string verse text for ${bookName} ${chapterNumber}:${verseNumber}, skipping...`);
              continue;
            }
            
            if (verseText) {
              await insertVerse(connection, bookName, chapterNumber, verseNumber, verseText, language, versionId);
              insertCount++;
              
              if (insertCount % 1000 === 0) {
                console.log(`   Inserted ${insertCount} verses...`);
              }
            }
          } catch (verseError) {
            console.error(`   Error processing verse ${verseIndex + 1}:`, verseError);
            console.log(`   Verse data:`, JSON.stringify(verse, null, 2));
          }
        }
      } else {
        console.log(`   No verses found in chapter ${chapterNumber} of ${bookName}`);
      }
    }
  }
  
  return insertCount;
}

module.exports = { processXMLData };
