
function detectLanguageAndVersion(filename, biblename) {
  const lowerFilename = filename.toLowerCase();
  const lowerBiblename = (biblename || '').toLowerCase();
  
  console.log(`Processing file: ${filename}, biblename: ${biblename}`);
  
  let versionCode = 'KJV'; // default
  let versionName = 'King James Version'; // default
  let language = 'en'; // default
  
  // Telugu detection
  if (lowerFilename.includes('telugu') || lowerBiblename.includes('telugu') || 
      filename.includes('Telugu') || /[\u0C00-\u0C7F]/.test(biblename || '')) {
    versionCode = 'TEV';
    versionName = 'Telugu Bible';
    language = 'te';
  }
  // Tamil detection  
  else if (lowerFilename.includes('tamil') || lowerBiblename.includes('tamil') ||
           filename.includes('Tamil') || /[\u0B80-\u0BFF]/.test(biblename || '')) {
    versionCode = 'TAB';
    versionName = 'Tamil Bible';
    language = 'ta';
  }
  // Malayalam detection
  else if (lowerFilename.includes('malayalam') || lowerBiblename.includes('malayalam') ||
           filename.includes('Malayalam') || /[\u0D00-\u0D7F]/.test(biblename || '')) {
    versionCode = 'MLB';
    versionName = 'Malayalam Bible';
    language = 'ml';
  }
  // Kannada detection
  else if (lowerFilename.includes('kannada') || lowerBiblename.includes('kannada') ||
           filename.includes('Kannada') || /[\u0C80-\u0CFF]/.test(biblename || '')) {
    versionCode = 'KNB';
    versionName = 'Kannada Bible';
    language = 'kn';
  }
  // Hindi detection
  else if (lowerFilename.includes('hindi') || lowerBiblename.includes('hindi') ||
           filename.includes('Hindi') || /[\u0900-\u097F]/.test(biblename || '')) {
    versionCode = 'HIB';
    versionName = 'Hindi Bible';
    language = 'hi';
  }
  // Bengali detection
  else if (lowerFilename.includes('bengali') || lowerBiblename.includes('bengali') ||
           filename.includes('Bengali')) {
    versionCode = 'BEB';
    versionName = 'Bengali Bible';
    language = 'bn';
  }
  // English versions
  else if (lowerFilename.includes('king james') || lowerFilename.includes('kjv')) {
    versionCode = 'KJV';
    versionName = 'King James Version';
    language = 'en';
  }
  else if (lowerFilename.includes('new international') || lowerFilename.includes('niv')) {
    versionCode = 'NIV';
    versionName = 'New International Version';
    language = 'en';
  }
  else if (lowerFilename.includes('new living') || lowerFilename.includes('nlt')) {
    versionCode = 'NLT';
    versionName = 'New Living Translation';
    language = 'en';
  }
  else if (lowerFilename.includes('english standard') || lowerFilename.includes('esv')) {
    versionCode = 'ESV';
    versionName = 'English Standard Version';
    language = 'en';
  }
  else if (lowerFilename.includes('american king james') || lowerFilename.includes('akjv')) {
    versionCode = 'AKJV';
    versionName = 'American King James Version';
    language = 'en';
  }
  else if (lowerFilename.includes('amplified')) {
    versionCode = 'AMP';
    versionName = 'Amplified Bible';
    language = 'en';
  }
  else if (lowerFilename.includes('apostles')) {
    versionCode = 'ABC';
    versionName = "Apostles' Bible Complete";
    language = 'en';
  }
  else if (lowerFilename.includes('geneva')) {
    versionCode = 'GNV';
    versionName = 'Geneva Bible';
    language = 'en';
  }
  else if (lowerFilename.includes('hebrew names')) {
    versionCode = 'HNV';
    versionName = 'Hebrew Names Version';
    language = 'en';
  }
  else if (lowerFilename.includes('literal translation')) {
    versionCode = 'LITV';
    versionName = 'Literal Translation of Holy Bible';
    language = 'en';
  }
  
  console.log(`Detected: ${versionCode} - ${versionName} (${language})`);
  
  return { versionCode, language, versionName };
}

module.exports = { detectLanguageAndVersion };
