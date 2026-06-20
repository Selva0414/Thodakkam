const fs = require('fs');
let content = fs.readFileSync('src/server.ts', 'utf8');

content = content.replace(/userId\s*\}/g, 'studentId: userId }');
content = content.replace(/,\s*userId/g, ', studentId: userId');

fs.writeFileSync('src/server.ts', content, 'utf8');
console.log('Fixed shorthand object notation for userId');
