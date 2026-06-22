const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace `if (data.success) {` with `if (res.ok || data.success || data.id) {`
  const oldCondition = /if \(\s*data\.success\s*\)\s*\{/g;
  const newCondition = 'if (res.ok || data.success || data.id) {';

  if (oldCondition.test(content)) {
    content = content.replace(oldCondition, newCondition);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed success check in', filePath);
  } else {
    console.log('No change needed or pattern not found in', filePath);
  }
}

fixFile(path.join(__dirname, 'src/app/student-add-post.tsx'));
fixFile(path.join(__dirname, 'src/app/startup-add-post.tsx'));
