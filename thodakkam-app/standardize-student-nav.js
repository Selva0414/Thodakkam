const fs = require('fs');

const files = [
  'src/app/student-dashboard.tsx',
  'src/app/student-jobs.tsx',
  'src/app/student-my-jobs.tsx',
  'src/app/student-assessments.tsx',
  'src/app/student-messages.tsx',
  'src/app/student-community.tsx',
  'src/app/student-apply.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Normalize "Jobs Board" to "Jobs"
    code = code.replace(
      /\{\s*label:\s*'Jobs Board',\s*icon:\s*Briefcase,\s*path:\s*'\/student-jobs'( as any)?\s*\}/g,
      "{ label: 'Jobs', icon: Briefcase, path: '/student-jobs' }"
    );
    
    // Add 'Tests' to student-apply.tsx if missing
    if (file.includes('student-apply.tsx')) {
       if (!code.includes("label: 'Tests'")) {
          code = code.replace(
            /\{\s*label:\s*'Jobs',\s*icon:\s*Briefcase,\s*path:\s*'\/student-jobs'\s*\},/g,
            "{ label: 'Jobs', icon: Briefcase, path: '/student-jobs' },\n    { label: 'Tests', icon: ClipboardList, path: '/student-assessments' },"
          );
       }
    }

    fs.writeFileSync(file, code);
  }
}
console.log('Done standardizing student nav');
