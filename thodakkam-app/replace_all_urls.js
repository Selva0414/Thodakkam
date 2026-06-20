const fs = require('fs');
const path = require('path');

const OLD_URL_1 = 'https://thodakkam-backend-47rn.onrender.com';
const OLD_URL_2 = 'https://thodakkam.onrender.com';
const NEW_URL = 'https://thodakkam-1.onrender.com';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(new RegExp(OLD_URL_1, 'g'), NEW_URL);
  newContent = newContent.replace(new RegExp(OLD_URL_2, 'g'), NEW_URL);
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated:', filePath);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.expo') {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.jsx')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory('./src');
console.log('All URLs have been successfully replaced!');
