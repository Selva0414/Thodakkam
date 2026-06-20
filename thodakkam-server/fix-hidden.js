const fs = require('fs');
let content = fs.readFileSync('src/server.ts', 'utf8');

// Fix ES6 shorthand for userId inside data objects
content = content.replace(/data:\s*\{\s*(.*?)(,\s*)?userId(,\s*)?(.*?)\}/g, (match, before, comma1, comma2, after) => {
    let newStr = `data: { ${before ? before + ', ' : ''}studentId: userId${after ? ', ' + after : ''} }`;
    return newStr.replace(/\{\s*,/g, '{').replace(/,\s*\}/g, '}');
});

// Fix userId: user.id in where clauses
content = content.replace(/userId:\s*user\.id/g, 'studentId: user.id');

fs.writeFileSync('src/server.ts', content, 'utf8');
console.log('Fixed hidden runtime errors in server.ts');
