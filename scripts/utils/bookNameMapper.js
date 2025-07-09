
// Book name mapping for cross-references
const bookNameMappings = {
  // Old Testament
  'Gen': 'Genesis',
  'Exod': 'Exodus', 
  'Exo': 'Exodus',
  'Lev': 'Leviticus',
  'Num': 'Numbers',
  'Deut': 'Deuteronomy',
  'Deu': 'Deuteronomy',
  'Josh': 'Joshua',
  'Jos': 'Joshua',
  'Judg': 'Judges',
  'Jdg': 'Judges',
  'Ruth': 'Ruth',
  '1Sam': '1 Samuel',
  '1Sa': '1 Samuel',
  '2Sam': '2 Samuel', 
  '2Sa': '2 Samuel',
  '1Kgs': '1 Kings',
  '1Ki': '1 Kings',
  '2Kgs': '2 Kings',
  '2Ki': '2 Kings',
  '1Chr': '1 Chronicles',
  '1Ch': '1 Chronicles',
  '2Chr': '2 Chronicles',
  '2Ch': '2 Chronicles',
  'Ezra': 'Ezra',
  'Ezr': 'Ezra',
  'Neh': 'Nehemiah',
  'Esth': 'Esther',
  'Est': 'Esther',
  'Job': 'Job',
  'Ps': 'Psalms',
  'Psa': 'Psalms',
  'Prov': 'Proverbs',
  'Pro': 'Proverbs',
  'Eccl': 'Ecclesiastes',
  'Ecc': 'Ecclesiastes',
  'Song': 'Song of Solomon',
  'Sol': 'Song of Solomon',
  'Isa': 'Isaiah',
  'Jer': 'Jeremiah',
  'Lam': 'Lamentations',
  'Ezek': 'Ezekiel',
  'Eze': 'Ezekiel',
  'Dan': 'Daniel',
  'Hos': 'Hosea',
  'Joel': 'Joel',
  'Amos': 'Amos',
  'Obad': 'Obadiah',
  'Oba': 'Obadiah',
  'Jonah': 'Jonah',
  'Jon': 'Jonah',
  'Mic': 'Micah',
  'Nah': 'Nahum',
  'Hab': 'Habakkuk',
  'Zeph': 'Zephaniah',
  'Zep': 'Zephaniah',
  'Hag': 'Haggai',
  'Zech': 'Zechariah',
  'Zec': 'Zechariah',
  'Mal': 'Malachi',
  
  // New Testament
  'Matt': 'Matthew',
  'Mat': 'Matthew',
  'Mark': 'Mark',
  'Mar': 'Mark',
  'Luke': 'Luke',
  'Luk': 'Luke',
  'John': 'John',
  'Joh': 'John',
  'Acts': 'Acts',
  'Act': 'Acts',
  'Rom': 'Romans',
  '1Cor': '1 Corinthians',
  '1Co': '1 Corinthians',
  '2Cor': '2 Corinthians',
  '2Co': '2 Corinthians',
  'Gal': 'Galatians',
  'Eph': 'Ephesians',
  'Phil': 'Philippians',
  'Phi': 'Philippians',
  'Col': 'Colossians',
  '1Thess': '1 Thessalonians',
  '1Th': '1 Thessalonians',
  '2Thess': '2 Thessalonians',
  '2Th': '2 Thessalonians',
  '1Tim': '1 Timothy',
  '1Ti': '1 Timothy',
  '2Tim': '2 Timothy',
  '2Ti': '2 Timothy',
  'Titus': 'Titus',
  'Tit': 'Titus',
  'Phlm': 'Philemon',
  'Phm': 'Philemon',
  'Heb': 'Hebrews',
  'Jas': 'James',
  'Jam': 'James',
  '1Pet': '1 Peter',
  '1Pe': '1 Peter',
  '2Pet': '2 Peter',
  '2Pe': '2 Peter',
  '1John': '1 John',
  '1Jn': '1 John',
  '2John': '2 John',
  '2Jn': '2 John',
  '3John': '3 John',
  '3Jn': '3 John',
  'Jude': 'Jude',
  'Rev': 'Revelation'
};

function mapBookName(shortName) {
  // Remove any whitespace and normalize
  const cleanName = shortName.trim();
  
  // Return mapped name if exists, otherwise return original
  return bookNameMappings[cleanName] || cleanName;
}

function getAllBookVariations(fullName) {
  // Find all short forms that map to this full name
  const variations = [fullName];
  
  for (const [shortName, longName] of Object.entries(bookNameMappings)) {
    if (longName === fullName) {
      variations.push(shortName);
    }
  }
  
  return variations;
}

module.exports = { mapBookName, getAllBookVariations, bookNameMappings };
