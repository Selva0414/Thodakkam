const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'controllers/postController.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the cast for array_agg since user_id is text in the database
content = content.replace('ARRAY[]::INTEGER[]', 'ARRAY[]::TEXT[]');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed postController.ts');
