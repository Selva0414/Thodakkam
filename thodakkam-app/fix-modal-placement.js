const fs = require('fs');

let code = fs.readFileSync('src/app/saved-posts.tsx', 'utf8');

// 1. Find and extract the Modal code
const modalRegex = /\s*\{\/\* Full Screen Image Viewer Modal \*\/\}[\s\S]*?<\/Modal>/;
const modalMatch = code.match(modalRegex);

if (modalMatch) {
  const modalCode = modalMatch[0];
  
  // 2. Remove it from its current location
  code = code.replace(modalRegex, '');
  
  // 3. Inject it at the end of PostItem
  const target = `    </View>\r?\n  \\);\r?\n\\}\r?\n\r?\n// ─── Main Screen`;
  code = code.replace(new RegExp(target), `\n${modalCode}\n    </View>\n  );\n}\n\n// ─── Main Screen`);
  
  fs.writeFileSync('src/app/saved-posts.tsx', code);
  console.log('Fixed Modal placement');
} else {
  console.log('Modal not found');
}
