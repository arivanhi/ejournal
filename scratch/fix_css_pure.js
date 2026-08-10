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
    
    let updated = false;

    // Fix v2 Grid
    if (content.includes('[class*="Grid"], [class*="Layout"], [class*="Cards"], [class*="grid"], [class*="layout"]')) {
        content = content.replace(/\[class\*="Grid"\], \[class\*="Layout"\], \[class\*="Cards"\], \[class\*="grid"\], \[class\*="layout"\]/g, 
        ':global([class*="Grid"]), :global([class*="Layout"]), :global([class*="Cards"]), :global([class*="grid"]), :global([class*="layout"])');
        updated = true;
    }

    // Fix v3 Tabs
    if (content.includes('[class*="tabContainer"], [class*="tabs"], [class*="filterSection"]')) {
        content = content.replace(/\[class\*="tabContainer"\], \[class\*="tabs"\], \[class\*="filterSection"\]/g, 
        ':global([class*="tabContainer"]), :global([class*="tabs"]), :global([class*="filterSection"])');
        updated = true;
    }

    if (updated) {
        fs.writeFileSync(file, content);
        console.log(`Fixed pure selector CSS errors in ${file}`);
    }
});
