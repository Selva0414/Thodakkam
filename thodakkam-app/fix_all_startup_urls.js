const fs = require('fs');
const path = require('path');

const filesToFix = [
  'startup-add-job.tsx',
  'startup-add-post.tsx',
  'startup-assessment-detail.tsx',
  'startup-candidates.tsx',
  'startup-community.tsx',
  'startup-create-assessment.tsx',
  'startup-dashboard.tsx',
  'startup-edit-job.tsx',
  'startup-interviews.tsx',
  'startup-job-details.tsx',
  'startup-jobs.tsx',
  'startup-login.tsx',
  'startup-messages.tsx',
  'startup-profile.tsx',
  'startup-register.tsx',
  'startup-reschedule.tsx',
  'student-add-post.tsx'
];

const dirPath = path.join(__dirname, 'src/app');

filesToFix.forEach(file => {
  const filePath = path.join(dirPath, file);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace any hardcoded thodakkam URLs with ${baseUrl}
  content = content.replace(/https:\/\/thodakkam-1\.onrender\.com/g, '${baseUrl}');
  content = content.replace(/http:\/\/localhost:5000/g, '${baseUrl}');

  // 2. Replace Platform.OS assignments
  const platformRegex = /const baseUrl\s*=\s*Platform\.OS[\s\S]*?;/g;
  content = content.replace(platformRegex, 'const baseUrl = BASE_URL;');

  // 3. Ensure BASE_URL is imported if baseUrl is used
  if (content.includes('baseUrl') || content.includes('BASE_URL')) {
    if (!content.includes('import { BASE_URL }')) {
      content = "import { BASE_URL } from '@/config/api';\n" + content;
    }
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed URLs in:', file);
  } else {
    console.log('No changes needed in:', file);
  }
});
