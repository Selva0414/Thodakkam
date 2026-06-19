const fs = require('fs');

let code = fs.readFileSync('src/app/student-apply.tsx', 'utf8');

// Fix 1: The data parsing logic
code = code.replace(
  /let resumeName = '';[\s\S]*?resumeName = u\.resumeFile\.split\(\/\[\/\\\\\]\/\)\.pop\(\) \|\| 'resume\.pdf';\s*\}/,
  `let resumeName = '';
             if (u.resumeFile) {
                if (u.resumeFile.startsWith('data:')) {
                  resumeName = 'Saved_Resume.pdf';
                } else {
                  resumeName = u.resumeFile.split(/[/\\\\]/).pop() || 'resume.pdf';
                }
             }`
);

// Fix 2: The UI truncation
code = code.replace(
  /<Text style=\{\[styles\.uploadText, \{ color: colors\.primary, fontWeight: '600' \}\]\}>\{form\.resumeName\}<\/Text>/,
  `<Text style={[styles.uploadText, { color: colors.primary, fontWeight: '600', paddingHorizontal: 10, textAlign: 'center' }]} numberOfLines={1} ellipsizeMode="middle">{form.resumeName}</Text>`
);

fs.writeFileSync('src/app/student-apply.tsx', code);
console.log('Fixed resume name display');
