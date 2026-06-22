const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src/app');
const files = fs.readdirSync(dirPath);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
    if (content.includes('fetch(') || content.includes('fetch (')) {
      if (!content.includes('BASE_URL') && !content.includes('BACKEND_URL')) {
        console.log('Uses fetch but NO BASE_URL:', file);
      }
    }
  }
});
