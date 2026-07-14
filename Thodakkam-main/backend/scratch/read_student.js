const fs = require('fs');
const content = fs.readFileSync('C:/Users/mukes/Desktop/test/unknown/backend/controllers/studentController.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.toLowerCase().includes('course_enrollments')) {
    console.log(`Line ${index + 1}: ${line}`);
  }
});
