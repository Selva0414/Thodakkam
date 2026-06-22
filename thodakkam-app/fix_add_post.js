const fs = require('fs');
const path = require('path');

function fixFile(filePath, isStartup) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add AsyncStorage import if missing
  if (!content.includes('import AsyncStorage')) {
    content = content.replace(
      "import React,",
      "import AsyncStorage from '@react-native-async-storage/async-storage';\nimport React,"
    );
  }

  // 2. Use Regex to replace the fetch block
  const targetRegex = /const baseUrl = BASE_URL;\s*const res = await fetch\(`\$\{baseUrl\}\/api\/posts`, \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},/g;

  const tokenKey = isStartup ? 'startupToken' : 'studentToken';
  
  const replacementStr = `const baseUrl = BASE_URL;
      const token = await AsyncStorage.getItem('${tokenKey}');
      const res = await fetch(\`\${baseUrl}/api/posts\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },`;

  if (targetRegex.test(content)) {
    content = content.replace(targetRegex, replacementStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed auth header in', filePath);
  } else {
    console.log('Target regex not matched in', filePath);
  }
}

fixFile(path.join(__dirname, 'src/app/startup-add-post.tsx'), true);
fixFile(path.join(__dirname, 'src/app/student-add-post.tsx'), false);
