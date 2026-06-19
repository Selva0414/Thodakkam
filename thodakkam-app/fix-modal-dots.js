const fs = require('fs');

const files = [
  'src/app/student-community.tsx',
  'src/app/saved-posts.tsx'
];

for (let file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(
      /paddingVertical:\s*20,\s*gap:\s*8/g,
      "paddingTop: 20, paddingBottom: 100, gap: 8"
    );
    fs.writeFileSync(file, code);
  }
}
console.log('Fixed pagination dots overlap');
