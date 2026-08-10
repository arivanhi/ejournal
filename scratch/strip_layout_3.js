const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files);
        } else if (name.endsWith('.tsx') && !name.includes('layout.tsx')) {
            files.push(name);
        }
    }
    return files;
}

const files = getFiles('d:/smanda-ej/ejournal-sman2/app');
let updatedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Remove aside
    content = content.replace(/<aside className=\{styles\.sidebar\}>[\s\S]*?<\/aside>/g, '');
    
    // 2. Remove header
    content = content.replace(/<header className=\{styles\.(?:topbar|header)\}>[\s\S]*?<\/header>/g, '');
    
    // 3. Remove JSX comments
    content = content.replace(/\{\/\*\s*(?:SIDEBAR|MAIN CONTENT)\s*\*\/\}/g, '');
    
    // 4. Replace layoutWrapper and its closing div
    if (content.includes('<div className={styles.layoutWrapper}>')) {
        content = content.replace(/<div className=\{styles\.layoutWrapper\}>/, '<>');
        // Match the VERY LAST </div> before );\n} at the end of the file
        content = content.replace(/<\/div>(\s*\);\s*\}\s*)$/, '</>$1');
    }
    
    // 5. Replace mainContent and its closing main
    if (content.match(/<main className=\{styles\.(?:mainContent|contentScroll)\}>/)) {
        content = content.replace(/<main className=\{styles\.(?:mainContent|contentScroll)\}>/, '<>');
        content = content.replace(/<\/main>/g, '</>');
    }
    
    // 6. Fix PDF for RiwayatClient (windowWidth missing)
    if (file.includes('RiwayatClient.tsx')) {
        content = content.replace(/html2canvas:\s*\{\s*scale:\s*2,\s*useCORS:\s*true,\s*letterRendering:\s*true\s*\}/g, 'html2canvas: { scale: 2, useCORS: true, windowWidth: 1024, letterRendering: true }');
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFiles++;
        console.log(`Updated layout in ${file}`);
    }
});

console.log(`Updated ${updatedFiles} files.`);
