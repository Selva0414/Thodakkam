const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

schema = schema.replace(/student\s+User/g, 'student        Student');
schema = schema.replace(/userId\]/g, 'studentId]');
schema = schema.replace(/\[userId/g, '[studentId');

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Fixed remaining references.');
