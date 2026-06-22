const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace the mapping logic inside fetchPosts
  const oldMappingRegex = /\/\/ Normalize backend fields to what PostItem expects[\s\S]*?let pImageUrl = post\.media_url \|\| post\.media \|\| post\.imageUrl;/g;
  
  const newMapping = `// Normalize backend fields to what PostItem expects
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

  content = content.replace(oldMappingRegex, newMapping);

  // Replace uPhoto parsing logic
  const oldUPhotoRegex = /let uPhoto = post\.user\?\.profilePhoto;\s*if \(uPhoto && !uPhoto\.startsWith\('http'\) && !uPhoto\.startsWith\('data:image'\)\) \{\s*const filename = uPhoto\.split\(\/\[\/\\\\\]\/\)\.pop\(\);\s*uPhoto = `\$\{baseUrl\}\/uploads\/\$\{filename\}`;\s*\}/g;

  const newUPhoto = `let uPhoto = post.user?.profilePhoto;
          if (typeof uPhoto === 'string' && (uPhoto.trim() === '' || uPhoto === 'null' || uPhoto === 'undefined')) {
             uPhoto = null;
          } else if (uPhoto && !uPhoto.startsWith('http') && !uPhoto.startsWith('data:image')) {
            const filename = uPhoto.split(/[/\\]/).pop();
            uPhoto = \`\${baseUrl}/uploads/\${filename}\`;
          }`;

  content = content.replace(oldUPhotoRegex, newUPhoto);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed avatars in', filePath);
}

fixFile(path.join(__dirname, 'src/app/startup-community.tsx'));
fixFile(path.join(__dirname, 'src/app/student-community.tsx'));
