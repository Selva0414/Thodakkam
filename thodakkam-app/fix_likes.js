const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to match the fetch call inside handleLike
  const fetchLikeRegex = /const res = await fetch\(`\$\{baseUrl\}\/api\/posts\/\$\{post\.id\}\/like`, \{\s*method: 'PUT',\s*headers: \{[\s\S]*?'Authorization': `Bearer \$\{token\}`\s*\},\s*body: JSON\.stringify\(\{[\s\S]*?\}\)\s*\}\);/g;

  const replacementStr = `const res = await fetch(\`\${baseUrl}/api/community/posts/\${post.id}/like\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        }
      });`;

  if (fetchLikeRegex.test(content)) {
    content = content.replace(fetchLikeRegex, replacementStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed like endpoint in', filePath);
  } else {
    console.log('Like fetch not matched in', filePath);
  }
}

fixFile(path.join(__dirname, 'src/app/startup-community.tsx'));
fixFile(path.join(__dirname, 'src/app/student-community.tsx'));
