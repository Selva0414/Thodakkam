const fs = require('fs');

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace prisma.user with prisma.student
    let newContent = content.replace(/prisma\.user\./g, 'prisma.student.');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

replaceInFile('src/server.ts');
replaceInFile('test-prisma.ts');
