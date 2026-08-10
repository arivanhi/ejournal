const fs = require('fs');
const path = require('path');

function findCssFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findCssFiles(filePath, fileList);
        } else if (filePath.endsWith('.module.css')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

const cssFiles = findCssFiles('d:/smanda-ej/ejournal-sman2/app');

cssFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    let needsUpdate = false;
    let toAppend = '';

    if (!content.includes('/* Global Mobile Scroll Fix v3 */')) {
        toAppend += `\n\n/* Global Mobile Scroll Fix v3 */\n[class*="tabContainer"], [class*="tabs"], [class*="filterSection"] {\n  max-width: 100%;\n  overflow-x: auto;\n}\n`;
        needsUpdate = true;
    }

    if (needsUpdate) {
        fs.writeFileSync(file, content + toAppend);
        console.log(`Updated globally in ${file}`);
    }
});
