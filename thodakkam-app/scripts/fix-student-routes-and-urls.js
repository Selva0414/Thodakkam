const fs = require('fs');
const path = require('path');

const files = [
  'student-profile.tsx',
  'student-jobs.tsx',
  'student-apply.tsx',
  'student-assessments.tsx',
  'student-settings.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '../src/app', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix thodakkam-1.onrender.com to BASE_URL
  content = content.replace(/const baseUrl = Platform\.OS === 'android' \? 'https:\/\/thodakkam-1\.onrender\.com' : 'https:\/\/thodakkam-1\.onrender\.com';/g, 'const baseUrl = BASE_URL;');
  
  // Make sure BASE_URL is imported if baseUrl = BASE_URL is used
  if (content.includes('const baseUrl = BASE_URL') && !content.includes('import { BASE_URL }')) {
    content = "import { BASE_URL } from '@/config/api';\n" + content;
  }

  // Fix /api/user/ endpoints
  content = content.replace(/\/api\/user\/(\$\{[a-zA-Z0-9_]+\})/g, '/api/students/$1/profile');

  // Fix change password endpoint
  content = content.replace(/\/api\/user\/change-password/g, '/api/students/${storedId}/change-password');

  // Fix json.user -> json.data
  // Ensure we don't accidentally replace userJson.user with userJson.data where userJson is just the var name
  // Actually, we do want to replace userJson.user with userJson.data
  content = content.replace(/(\bjson|\buserJson|\bresJson)\.user\b/g, '$1.data');

  fs.writeFileSync(filePath, content);
  console.log('Fixed', file);
});
