
const fs = require('fs').promises;

async function checkXMLDirectory(xmlDir) {
  try {
    await fs.access(xmlDir);
    return true;
  } catch (error) {
    console.error('❌ XML directory not found. Please create ./xml-data directory and place XML files there.');
    console.error('   Download from: https://github.com/sajeevavahini/bibles');
    return false;
  }
}

async function getXMLFiles(xmlDir) {
  const files = await fs.readdir(xmlDir);
  const xmlFiles = files.filter(file => file.endsWith('.xml'));
  
  if (xmlFiles.length === 0) {
    console.error('❌ No XML files found in the directory.');
    return null;
  }
  
  return xmlFiles;
}

module.exports = { 
  checkXMLDirectory, 
  getXMLFiles 
};
