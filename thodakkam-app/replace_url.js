const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');
const searchString = 'https://thodakkam.onrender.com';
const replacementString = 'https://thodakkam-backend-47rn.onrender.com';

function walkAndReplace(dir) {
  const files = fs.readdirSync(dir);
  let replaceCount = 0;

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      replaceCount += walkAndReplace(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(searchString)) {
        const newContent = content.split(searchString).join(replacementString);
        fs.writeFileSync(filePath, newContent, 'utf8');
        replaceCount++;
        console.log(`Replaced in ${filePath}`);
      }
    }
  });
  return replaceCount;
}

const total = walkAndReplace(directoryPath);
console.log(`Finished replacing in ${total} files.`);
