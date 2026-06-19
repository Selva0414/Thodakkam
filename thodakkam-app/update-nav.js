const fs = require('fs');
const path = require('path');

const directory = path.join(__dirname, 'src', 'app');

const targetFiles = [
  'startup-dashboard.tsx',
  'startup-jobs.tsx',
  'startup-candidates.tsx',
  'startup-interviews.tsx',
  'startup-community.tsx',
  'startup-ai-analyzer.tsx'
];

const newNavArray = `[
          { label: 'Dashboard', icon: LayoutGrid },
          { label: 'Jobs', icon: Briefcase },
          { label: 'Candidates', icon: Users },
          { label: 'Interviews', icon: Calendar },
          { label: 'Community', icon: MessageSquare }
        ]`;

for (const file of targetFiles) {
  const filePath = path.join(directory, file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace Home -> Dashboard, Feed -> Community
  // First, replace the array
  content = content.replace(/\[\s*\{\s*label:\s*'(Home|Dashboard)'[\s\S]*?\]\.map/m, newNavArray + '.map');

  // Second, replace the onPress logic labels
  content = content.replace(/item\.label === 'Home'/g, "item.label === 'Dashboard'");
  content = content.replace(/item\.label === 'Feed'/g, "item.label === 'Community'");
  
  // Update setActiveTab('Home') to setActiveTab('Dashboard') 
  content = content.replace(/setActiveTab\('Home'\)/g, "setActiveTab('Dashboard')");
  // Update useState('Home') to useState('Dashboard')
  content = content.replace(/useState\('Home'\)/g, "useState('Dashboard')");
  
  // For Community, make sure 'Users' icon is updated to 'MessageSquare' in the import if missing
  if (!content.includes('MessageSquare')) {
      content = content.replace(/import \{([\s\S]*?)\} from 'lucide-react-native';/, "import {$1, MessageSquare} from 'lucide-react-native';");
  }

  // Also in startup-jobs.tsx, handleNavPress has 'Home' and 'Feed'
  content = content.replace(/label === 'Home'/g, "label === 'Dashboard'");
  content = content.replace(/label === 'Feed'/g, "label === 'Community'");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
}
