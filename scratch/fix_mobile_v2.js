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
    
    // Add mobile resets at the end of every module.css if they have grid
    if (content.includes('display: grid')) {
        let toAppend = `\n\n/* Global Mobile Grid Fix v2 */\n@media (max-width: 1024px) {\n  [class*="Grid"], [class*="Layout"], [class*="Cards"], [class*="grid"], [class*="layout"] {\n    grid-template-columns: 1fr !important;\n  }\n}\n`;
        
        // Remove old mobile resets to prevent duplicates if any
        if (content.includes('/* Global Mobile Grid Fix v2 */')) {
            return;
        }

        fs.writeFileSync(file, content + toAppend);
        console.log(`Updated grids globally in ${file}`);
    }
});
