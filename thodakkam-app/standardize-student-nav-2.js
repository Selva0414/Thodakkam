const fs = require('fs');
const path = require('path');

const files = [
  'src/app/student-dashboard.tsx',
  'src/app/student-jobs.tsx',
  'src/app/student-my-jobs.tsx',
  'src/app/student-assessments.tsx',
  'src/app/student-messages.tsx',
  'src/app/student-community.tsx',
  'src/app/student-apply.tsx',
  'src/app/saved-posts.tsx'
];

const newTabs = `[
    { label: 'Home', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Job', icon: Briefcase, path: '/student-jobs' },
    { label: 'Test', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' }
  ]`;

const newTabsWithoutPath = `[
    { label: 'Home', icon: LayoutDashboard },
    { label: 'Job', icon: Briefcase, path: '/student-jobs' as any },
    { label: 'Test', icon: ClipboardList, path: '/student-assessments' as any },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' }
  ]`;

const newTabsSavedPosts = `[
    { label: 'Home', icon: LayoutDashboard, path: '/student-dashboard' },
    { label: 'Job', icon: Briefcase, path: '/student-jobs' },
    { label: 'Test', icon: ClipboardList, path: '/student-assessments' },
    { label: 'Chat', icon: MessageSquare, path: '/student-messages' },
    { label: 'Feed', icon: Users, path: '/student-community' },
  ]`;

for (let file of files) {
  if (!fs.existsSync(file)) continue;
  
  let code = fs.readFileSync(file, 'utf8');
  let updated = false;

  // Replace tabs block
  // We use regex to find the student tabs block and replace it.
  if (file.includes('student-dashboard.tsx')) {
      code = code.replace(/const tabs = \[\s*\{\s*label:\s*'Home'[\s\S]*?\];/m, `const tabs = ${newTabsWithoutPath};`);
      updated = true;
  } else if (file.includes('saved-posts.tsx')) {
      code = code.replace(/const studentTabs = \[\s*\{\s*label:\s*'Home'[\s\S]*?\];/m, `const studentTabs = ${newTabsSavedPosts};`);
      updated = true;
  } else {
      code = code.replace(/const tabs = \[\s*\{\s*label:\s*'Home'[\s\S]*?\];/m, `const tabs = ${newTabs};`);
      updated = true;
  }

  // Also replace the active string if it's set to something like 'Jobs' or 'Jobs Board' or 'Tests'
  if (file.includes('student-jobs.tsx') || file.includes('student-my-jobs.tsx') || file.includes('student-apply.tsx')) {
      code = code.replace(/const active = 'Jobs( Board)?';/, "const active = 'Job';");
  } else if (file.includes('student-assessments.tsx')) {
      code = code.replace(/const active = 'Tests?';/, "const active = 'Test';");
  } else if (file.includes('student-dashboard.tsx')) {
      code = code.replace(/const active = 'Home';/, "const active = 'Home';"); // Just ensuring
  } else if (file.includes('student-messages.tsx')) {
      code = code.replace(/const active = 'Chat';/, "const active = 'Chat';");
  } else if (file.includes('student-community.tsx')) {
      code = code.replace(/const active = 'Feed';/, "const active = 'Feed';");
  }

  if (updated) {
    fs.writeFileSync(file, code);
    console.log('Updated', file);
  }
}
