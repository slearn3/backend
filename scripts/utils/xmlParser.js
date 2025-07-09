
const fs = require('fs').promises;
const xml2js = require('xml2js');

async function parseXMLFile(filePath) {
  try {
    const xmlData = await fs.readFile(filePath, 'utf8');
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true
    });
    const result = await parser.parseStringPromise(xmlData);
    return result;
  } catch (error) {
    console.error(`Error parsing XML file ${filePath}:`, error);
    return null;
  }
}

module.exports = { parseXMLFile };
