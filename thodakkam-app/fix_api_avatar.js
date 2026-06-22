const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  const oldUPhotoRegex = /let uPhoto = post\.user\?\.profilePhoto;\s*if \(typeof uPhoto === 'string' && \(uPhoto\.trim\(\) === '' \|\| uPhoto === 'null' \|\| uPhoto === 'undefined'\)\) \{\s*uPhoto = null;\s*\} else if \(uPhoto && !uPhoto\.startsWith\('http'\) && !uPhoto\.startsWith\('data:image'\)\) \{\s*const filename = uPhoto\.split\(\/\[\\\\\/\\\\\\\\\]\/\)\.pop\(\);\s*uPhoto = `\$\{baseUrl\}\/uploads\/\$\{filename\}`;\s*\}/g;

  // Let's use a simpler regex to replace the entire else if block since it might have formatting variations
  // We'll just read and replace using string manipulation or a looser regex
  
  const targetStr1 = `} else if (uPhoto && !uPhoto.startsWith('http') && !uPhoto.startsWith('data:image')) {
            const filename = uPhoto.split(/[\\/\\\\]/).pop();
            uPhoto = \`\${baseUrl}/uploads/\${filename}\`;
          }`;
          
  const replacement1 = `} else if (uPhoto && !uPhoto.startsWith('http') && !uPhoto.startsWith('data:image')) {
            if (uPhoto.startsWith('/api/')) {
              uPhoto = \`\${baseUrl}\${uPhoto}\`;
            } else {
              const filename = uPhoto.split(/[\\/\\\\]/).pop();
              uPhoto = \`\${baseUrl}/uploads/\${filename}\`;
            }
          }`;

  if (content.includes(targetStr1)) {
    content = content.replace(targetStr1, replacement1);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed api avatar in', filePath);
  } else {
    console.log('Target string not found in', filePath);
  }
}

fixFile(path.join(__dirname, 'src/app/startup-community.tsx'));
fixFile(path.join(__dirname, 'src/app/student-community.tsx'));
