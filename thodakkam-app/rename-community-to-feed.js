const fs = require('fs');

const files = [
  'src/app/saved-posts.tsx',
  'src/app/startup-add-post.tsx',
  'src/app/startup-ai-analyzer.tsx',
  'src/app/startup-candidates.tsx',
  'src/app/startup-community.tsx',
  'src/app/startup-dashboard.tsx',
  'src/app/startup-interviews.tsx',
  'src/app/startup-jobs.tsx'
];

for (let file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Replace the tab definition
    code = code.replace(/\{\s*label:\s*'Community',\s*icon:\s*MessageSquare/g, "{ label: 'Feed', icon: MessageSquare");
    
    // Replace the handler check for 'Community'
    code = code.replace(/label === 'Community'/g, "label === 'Feed'");
    code = code.replace(/item\.label === 'Community'/g, "item.label === 'Feed'");
    
    fs.writeFileSync(file, code);
  }
}
console.log('Fixed Community to Feed in startup nav');
