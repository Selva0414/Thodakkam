const fs = require('fs');
const path = require('path');

function applyAllFixes(filePath, isStartup) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add AsyncStorage and BASE_URL imports if missing
  if (!content.includes('import AsyncStorage')) {
    content = content.replace(
      "import React,",
      "import { BASE_URL } from '@/config/api';\nimport AsyncStorage from '@react-native-async-storage/async-storage';\nimport React,"
    );
  } else if (!content.includes('import { BASE_URL }')) {
    content = content.replace(
      "import React,",
      "import { BASE_URL } from '@/config/api';\nimport React,"
    );
  }

  // 2. Fix baseUrl (remove Render URL)
  content = content.replace(
    /const baseUrl = Platform\.OS === 'android' \? 'https:\/\/thodakkam-1\.onrender\.com' : 'https:\/\/thodakkam-1\.onrender\.com';/g,
    'const baseUrl = BASE_URL;'
  );

  // 3. Fix data.posts.map and add robust avatar mapping (combines fix_frontend.js, fix_data_mapping.js, and fix_avatar.js)
  // We replace the entire block from `if (data.success)` up to `let pImageUrl = post.imageUrl;` or `let pImageUrl = post.media_url`
  // We will just do a standard string replace on the old original block.
  
  const originalBlockStart = /if \(data\.success\) \{\s*const processedPosts = data\.posts\.map\(\(post: any\) => \{\s*let pImageUrl = post\.imageUrl;/g;
  
  const newBlockStart = `if (data.success && data.data && data.data.posts) {
        const processedPosts = data.data.posts.map((post: any) => {
          post.text = post.content || post.text;
          
          let avatar = post.author_avatar || post.userId?.avatar;
          if (typeof avatar === 'string' && (avatar.trim() === '' || avatar === 'null' || avatar === 'undefined')) {
            avatar = null;
          }
          
          if (!post.user && (post.author_name || post.userId?.name)) {
            post.user = { 
              fullName: post.author_name || post.userId?.name, 
              profilePhoto: avatar 
            };
          }
          
          let pImageUrl = post.media_url || post.media || post.imageUrl;`;

  content = content.replace(originalBlockStart, newBlockStart);

  // 4. Fix uPhoto parsing (this fixes the gray circle bug and the regex syntax error)
  const oldUPhotoRegex = /let uPhoto = post\.user\?\.profilePhoto;\s*if \(uPhoto && !uPhoto\.startsWith\('http'\) && !uPhoto\.startsWith\('data:image'\)\) \{\s*const filename = uPhoto\.split\(\/\[\/\\\\\]\/\)\.pop\(\);\s*uPhoto = `\$\{baseUrl\}\/uploads\/\$\{filename\}`;\s*\}/g;

  // NOTICE the 4 backslashes in the regex literal string to correctly output 2 backslashes in the TSX file
  const newUPhoto = `let uPhoto = post.user?.profilePhoto;
          if (typeof uPhoto === 'string' && (uPhoto.trim() === '' || uPhoto === 'null' || uPhoto === 'undefined')) {
             uPhoto = null;
          } else if (uPhoto && !uPhoto.startsWith('http') && !uPhoto.startsWith('data:image')) {
            const filename = uPhoto.split(/[\\/\\\\]/).pop();
            uPhoto = \`\${baseUrl}/uploads/\${filename}\`;
          }`;

  content = content.replace(oldUPhotoRegex, newUPhoto);

  // 5. Fix handleLike to use PUT and token
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

applyAllFixes(path.join(__dirname, 'src/app/startup-community.tsx'), true);
applyAllFixes(path.join(__dirname, 'src/app/student-community.tsx'), false);
