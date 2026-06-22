const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Add BASE_URL import if missing
  if (!content.includes('import { BASE_URL }')) {
    content = content.replace(
      "import React,",
      "import { BASE_URL } from '@/config/api';\nimport React,"
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed imports in', filePath);
}

fixFile(path.join(__dirname, 'src/app/startup-community.tsx'));
fixFile(path.join(__dirname, 'src/app/student-community.tsx'));
