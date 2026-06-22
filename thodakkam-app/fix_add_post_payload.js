const fs = require('fs');
const path = require('path');

function fixFile(filePath, isStartup) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Let's replace the whole fetch block using regex or string match
  const oldFetchRegex = /const res = await fetch\(`\$\{baseUrl\}\/api\/posts`, \{\s*method: 'POST',\s*headers: \{[\s\S]*?'Authorization': `Bearer \$\{token\}`\s*\},\s*body: JSON\.stringify\(\{\s*text,\s*imageUrl: imageUrls\.length > 0 \? JSON\.stringify\(imageUrls\) : null,\s*category,\s*email: userStore\.email\s*\}\)\s*\}\);/g;

  // Wait, the file might not have the `Authorization` header exactly as written if I didn't match it correctly earlier, but actually I did successfully add it in the previous step!
  // Let's just match from `const res = await fetch(` to `});` using a careful regex

  const fetchBlockRegex = /const res = await fetch\(`\$\{baseUrl\}\/api\/posts`[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?\}\)\s*\}\);/g;

  const replacementStr = `
      // Extract base64 part if image exists
      let media_base64 = null;
      let media_type = null;
      if (imageUrls.length > 0) {
        const firstImage = imageUrls[0];
        if (firstImage.startsWith('data:image')) {
          const parts = firstImage.split(',');
          if (parts.length === 2) {
            media_type = parts[0].split(';')[0].split(':')[1];
            media_base64 = parts[1];
          }
        }
      }

      const res = await fetch(\`\${baseUrl}/api/community/posts\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify({
          content: text,
          tags: [category],
          media_base64,
          media_type
        })
      });`;

  if (fetchBlockRegex.test(content)) {
    content = content.replace(fetchBlockRegex, replacementStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed fetch payload and endpoint in', filePath);
  } else {
    console.log('Target regex not matched in', filePath);
  }
}

fixFile(path.join(__dirname, 'src/app/startup-add-post.tsx'), true);
fixFile(path.join(__dirname, 'src/app/student-add-post.tsx'), false);
