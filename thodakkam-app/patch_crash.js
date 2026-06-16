const fs = require('fs');

const fixNavAndSvg = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let f = fs.readFileSync(filePath, 'utf8');
  // Change router.replace to router.navigate
  f = f.replace(/router\.replace/g, 'router.navigate');
  
  // Wrap Svg with collapsable={false} to fix unmount crash
  f = f.replace(/<Svg /g, '<View collapsable={false}><Svg ');
  f = f.replace(/<\/Svg>/g, '</Svg></View>');
  
  fs.writeFileSync(filePath, f);
};

fixNavAndSvg('src/app/startup-dashboard.tsx');
fixNavAndSvg('src/app/startup-jobs.tsx');
fixNavAndSvg('src/app/student-dashboard.tsx');
