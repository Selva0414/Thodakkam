const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/startup-register.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the formData appending for files with platform-aware logic
const oldFormDataLogic = /formData\.append\('companyLogo', \{ uri: companyLogo, name: 'logo\.jpg', type: 'image\/jpeg' \} as any\);\s*\/\/ Duplicate companyLogo for other required files\s*formData\.append\('certificateFile', \{ uri: companyLogo, name: 'cert\.jpg', type: 'image\/jpeg' \} as any\);\s*formData\.append\('physicalPhotos', \{ uri: companyLogo, name: 'photo1\.jpg', type: 'image\/jpeg' \} as any\);\s*formData\.append\('physicalPhotos', \{ uri: companyLogo, name: 'photo2\.jpg', type: 'image\/jpeg' \} as any\);/g;

const newFormDataLogic = `let fileData: any;
      if (Platform.OS === 'web') {
        const res = await fetch(companyLogo);
        const blob = await res.blob();
        fileData = new File([blob], 'logo.jpg', { type: 'image/jpeg' });
      } else {
        fileData = { uri: companyLogo, name: 'logo.jpg', type: 'image/jpeg' };
      }

      formData.append('companyLogo', fileData);
      formData.append('certificateFile', fileData);
      formData.append('physicalPhotos', fileData);
      formData.append('physicalPhotos', fileData);`;

if (content.match(oldFormDataLogic)) {
  content = content.replace(oldFormDataLogic, newFormDataLogic);
  
  // also add Platform to imports if not there
  if (!content.includes('import { Platform')) {
    content = content.replace(/import \{/, 'import { Platform, ');
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed startup-register.tsx for web upload');
} else {
  console.log('Pattern not found');
}
