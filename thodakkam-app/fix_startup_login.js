const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/startup-login.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace /api/startup/login with /api/startup/auth/login
content = content.replace(/\/api\/startup\/login/g, '/api/startup/auth/login');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed startup-login.tsx endpoint.');
