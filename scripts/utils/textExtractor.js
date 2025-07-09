
// Helper function to extract text from various verse formats
function extractVerseText(verse) {
  if (typeof verse === 'string') {
    return verse;
  }
  
  if (typeof verse === 'object' && verse !== null) {
    // Check for common text properties
    if (verse._) return String(verse._);
    if (verse.text) return String(verse.text);
    if (verse.content) return String(verse.content);
    if (verse['#text']) return String(verse['#text']);
    
    // If it's an object with no recognizable text property, try to stringify
    if (typeof verse.toString === 'function') {
      return verse.toString();
    }
  }
  
  // Last resort: convert to string
  return String(verse || '');
}

module.exports = { extractVerseText };
