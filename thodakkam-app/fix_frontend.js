const fs = require('fs');
const path = require('path');

function fixFile(filePath, isStartup) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add AsyncStorage import if missing
  if (!content.includes('import AsyncStorage')) {
    content = content.replace(
      "import React, { useState, useEffect, useRef } from 'react';",
      "import React, { useState, useEffect, useRef } from 'react';\nimport AsyncStorage from '@react-native-async-storage/async-storage';"
    );
  }

  // 2. Fix baseUrl in fetchPosts (if present)
  content = content.replace(
    /const baseUrl = Platform\.OS === 'android' \? 'https:\/\/thodakkam-1\.onrender\.com' : 'https:\/\/thodakkam-1\.onrender\.com';/g,
    'const baseUrl = BASE_URL;'
  );

  // 3. Fix data.posts.map to data.data.posts.map in fetchPosts
  content = content.replace(
    /if \(data\.success\) \{\s*const processedPosts = data\.posts\.map\(\(post: any\) => \{/g,
    'if (data.success && data.data && data.data.posts) {\n        const processedPosts = data.data.posts.map((post: any) => {'
  );

  // 4. Fix handleLike to use PUT and token
  // Use a targeted regex to replace the fetch call inside handleLike
  const oldFetchRegex = /await fetch\(`\$\{baseUrl\}\/api\/posts\/\$\{post\.id\}\/like`, \{\s*method: 'POST',\s*headers: \{ 'Content-Type': 'application\/json' \},\s*body: JSON\.stringify\(\{ (companyName|email: userStore\.email) \}\)\s*\}\);/g;
  
  content = content.replace(oldFetchRegex, (match, bodyContent) => {
    return `const token = await AsyncStorage.getItem('${isStartup ? 'startupToken' : 'studentToken'}');
      await fetch(\`\${baseUrl}/api/posts/\${post.id}/like\`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({ ${bodyContent} })
      });`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', filePath);
}

fixFile(path.join(__dirname, 'src/app/startup-community.tsx'), true);
fixFile(path.join(__dirname, 'src/app/student-community.tsx'), false);
