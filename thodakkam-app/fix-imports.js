const fs = require('fs');
const files = [
  'startup-dashboard.tsx', 'startup-jobs.tsx', 'startup-candidates.tsx', 
  'startup-interviews.tsx', 'startup-community.tsx', 'startup-ai-analyzer.tsx'
];
files.forEach(f => {
  const filePath = 'src/app/' + f;
  if (!fs.existsSync(filePath)) return;
  let c = fs.readFileSync(filePath, 'utf8');
  let match = c.match(/import \{([\s\S]*?)\} from 'lucide-react-native';/);
  if (match) {
    let imports = match[1];
    let needsUpdate = false;
    if (!imports.includes('MessageSquare')) { imports += ', MessageSquare'; needsUpdate = true; }
    if (!imports.includes('LayoutGrid')) { imports += ', LayoutGrid'; needsUpdate = true; }
    if (!imports.includes('Briefcase')) { imports += ', Briefcase'; needsUpdate = true; }
    if (!imports.includes('Users')) { imports += ', Users'; needsUpdate = true; }
    if (!imports.includes('Calendar')) { imports += ', Calendar'; needsUpdate = true; }
    if (needsUpdate) {
      c = c.replace(/import \{[\s\S]*?\} from 'lucide-react-native';/, `import {${imports}} from 'lucide-react-native';`);
      fs.writeFileSync(filePath, c);
      console.log('Fixed imports in ' + f);
    }
  }
});
