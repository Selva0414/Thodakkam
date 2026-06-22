const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/student-community.tsx',
  'src/app/startup-community.tsx',
  'src/app/saved-posts.tsx'
];

filesToFix.forEach(relPath => {
  const filePath = path.join(__dirname, relPath);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix Like
  if (content.includes('/api/posts/${post.id}/like')) {
    content = content.replace(/\/api\/posts\/\$\{post\.id\}\/like/g, '/api/community/posts/${post.id}/like');
    changed = true;
  }
  // Fix Comment
  if (content.includes('/api/posts/${post.id}/comment')) {
    content = content.replace(/\/api\/posts\/\$\{post\.id\}\/comment/g, '/api/community/posts/${post.id}/comments');
    changed = true;
  }
  // Fix Repost / Share
  if (content.includes('/api/posts/${post.id}/repost')) {
    content = content.replace(/\/api\/posts\/\$\{post\.id\}\/repost/g, '/api/community/posts/${post.id}/share');
    changed = true;
  }
  // Fix Save
  if (content.includes('/api/posts/${post.id}/save')) {
    content = content.replace(/\/api\/posts\/\$\{post\.id\}\/save/g, '/api/community/posts/${post.id}/save');
    changed = true;
  }

  // Fix initial fetch in saved-posts.tsx
  if (relPath.includes('saved-posts.tsx')) {
    const oldSavedUrl = /fetch\(`\$\{baseUrl\}\/api\/posts\/saved\/[^`]+`\)/g;
    if (oldSavedUrl.test(content)) {
      content = content.replace(oldSavedUrl, 'fetch(`${baseUrl}/api/community/saved`, { headers: { "Authorization": `Bearer ${token}` } })');
      
      // Add AsyncStorage import
      if (!content.includes('@react-native-async-storage/async-storage')) {
        content = content.replace(/import \{ BASE_URL \} from '@\/config\/api';/, "import { BASE_URL } from '@/config/api';\nimport AsyncStorage from '@react-native-async-storage/async-storage';");
      }

      // Add token assignment in fetchPosts
      content = content.replace(
        /const baseUrl = BASE_URL;\s+const res = await fetch\(`\$\{baseUrl\}\/api\/community\/saved/,
        "const baseUrl = BASE_URL;\n      const token = await AsyncStorage.getItem(role === 'startup' ? 'startupToken' : 'studentToken');\n      const res = await fetch(`${baseUrl}/api/community/saved`"
      );

      changed = true;
    }
  }

  // Also fix feed endpoint in community files if they still have /api/posts
  if (relPath.includes('community.tsx')) {
    if (content.includes('fetch(`${baseUrl}/api/posts`)')) {
       content = content.replace(/fetch\(`\$\{baseUrl\}\/api\/posts`\)/g, 'fetch(`${baseUrl}/api/community/posts`, { headers: { "Authorization": `Bearer ${await AsyncStorage.getItem(role === "startup" ? "startupToken" : "studentToken")}` } })');
       changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed endpoints in ${relPath}`);
  } else {
    console.log(`No changes needed in ${relPath}`);
  }
});
