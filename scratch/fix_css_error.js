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
    
    if (content.includes('.tableContainer, .tableWrapper, [class*="table"] {') || content.includes(':global([class*="table"])')) {
        content = content.replace(/\.tableContainer, \.tableWrapper, \[class\*="table"\] \{/g, '.tableContainer, .tableWrapper, :global([class*="table"]) {');
        fs.writeFileSync(file, content);
        console.log(`Fixed CSS error in ${file}`);
    }
});
