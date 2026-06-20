const fs = require('fs');
let content = fs.readFileSync('src/server.ts', 'utf8');

// Replace basic relations
content = content.replace(/prisma\.user\./g, 'prisma.student.');
content = content.replace(/prisma\.userFollowsStartup/g, 'prisma.studentFollowsStartup');
content = content.replace(/prisma\.startupFollowsUser/g, 'prisma.startupFollowsStudent');

// Replace includes
content = content.replace(/user:\s*true/g, 'student: true');

// Replace unique combination query
content = content.replace(/jobId_userId/g, 'jobId_studentId');

// Replace userId shorthand with studentId mapping
content = content.replace(/\{ startupId: startup\.id,\s*userId \}/g, '{ startupId: startup.id, studentId: userId }');
content = content.replace(/where:\s*\{\s*userId\s*\}/g, 'where: { studentId: userId }');
content = content.replace(/userId:\s*userId/g, 'studentId: userId');

fs.writeFileSync('src/server.ts', content, 'utf8');
console.log('Fixed src/server.ts');
