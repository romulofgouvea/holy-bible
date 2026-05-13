const fs = require('fs');
const path = require('path');

function stripComments(content) {
    // 1. Multi-line comments /* ... */
    let stripped = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // 2. Single-line comments // ... 
    // Exclude strings and common directives
    // We match // that is NOT preceded by : (to avoid URLs) and NOT followed by @ts-ignore or eslint
    const lines = stripped.split('\n');
    const cleanedLines = lines.map(line => {
        // Find // that is not part of a URL and not a directive
        const commentIndex = line.indexOf('//');
        if (commentIndex === -1) return line;
        
        // Basic URL check: if // is preceded by http: or https:
        const before = line.substring(0, commentIndex);
        if (before.endsWith('http:') || before.endsWith('https:')) return line;
        
        // Directive check: if // is followed by @ts-ignore or eslint
        const after = line.substring(commentIndex + 2);
        if (after.trim().startsWith('@ts-ignore') || after.trim().startsWith('eslint-disable')) return line;
        
        // Remove the comment
        return line.substring(0, commentIndex).trimEnd();
    });
    
    return cleanedLines.join('\n');
}

function traverse(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverse(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const stripped = stripComments(content);
            if (content !== stripped) {
                fs.writeFileSync(fullPath, stripped, 'utf8');
                console.log(`Cleaned: ${fullPath}`);
            }
        }
    }
}

const targetDir = 'c:\\workspace\\holy-bible\\src';
traverse(targetDir);
console.log('Cleanup complete.');
