const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, 'src/app');
const files = fs.readdirSync(dirPath);

files.forEach(file => {
  if (file.endsWith('.tsx') || file.endsWith('.ts')) {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf8');
    if (content.includes('BASE_URL') && !content.includes('import { BASE_URL }')) {
      console.log('Missing BASE_URL import in:', file);
      
      // Auto-fix it!
      const newContent = "import { BASE_URL } from '@/config/api';\n" + content;
      fs.writeFileSync(path.join(dirPath, file), newContent, 'utf8');
      console.log('Fixed:', file);
    }
  }
});
