const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace /[/\]/ with /[/\\]/
  // Since we are reading the file directly as text, the broken regex is literally `/[/\]/`
  // We want to replace it with `/[/\\\\]/` which in source code means `/[/\\]/`
  content = content.replace(/uPhoto\.split\(\/\[\/\\\]\/\)/g, 'uPhoto.split(/[\\/\\\\]/)');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed regex in', filePath);
}

fixFile(path.join(__dirname, 'src/app/startup-community.tsx'));
fixFile(path.join(__dirname, 'src/app/student-community.tsx'));
