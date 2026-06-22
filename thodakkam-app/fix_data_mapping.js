const fs = require('fs');
const path = require('path');

function fixMapping(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // We want to replace the mapping inside fetchPosts
  const targetRegex = /const processedPosts = data\.data\.posts\.map\(\(post: any\) => \{(\s*)let pImageUrl = post\.imageUrl;/g;
  
  const replacement = `const processedPosts = data.data.posts.map((post: any) => {
          // Normalize backend fields to what PostItem expects
          post.text = post.content || post.text;
          if (!post.user && post.author_name) {
            post.user = { fullName: post.author_name, profilePhoto: post.author_avatar };
          }
          let pImageUrl = post.media_url || post.media || post.imageUrl;`;

  content = content.replace(targetRegex, replacement);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed mapping in', filePath);
}

fixMapping(path.join(__dirname, 'src/app/startup-community.tsx'));
fixMapping(path.join(__dirname, 'src/app/student-community.tsx'));
