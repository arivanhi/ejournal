const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files);
        } else if (name.endsWith('.tsx')) {
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

    // Use a precise regex for margin
    content = content.replace(/margin:\s*(?:0|\[[^\]]+\])\s*,/g, 'margin: 10,');
    
    // Replace format: "a4" with format: [215, 330]
    content = content.replace(/format:\s*"a4"/g, 'format: [215, 330]');
    content = content.replace(/format:\s*'a4'/g, 'format: [215, 330]');
    
    // Replace html2canvas scale if it doesn't already have windowWidth
    content = content.replace(/html2canvas:\s*\{\s*scale:\s*2,\s*useCORS:\s*true\s*}/g, 'html2canvas: { scale: 2, useCORS: true, windowWidth: 1024 }');

    // Add pagebreak if not exists
    if (!content.includes('pagebreak: { mode: ["avoid-all", "css", "legacy"] }') && content.includes('html2pdf().set(opt)')) {
        content = content.replace(/jsPDF:\s*{([^}]+)}/g, 'jsPDF: {$1},\n\t\t\t\tpagebreak: { mode: ["avoid-all", "css", "legacy"] }');
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        updatedFiles++;
        console.log(`Updated ${file}`);
    }
});

console.log(`Updated ${updatedFiles} files.`);
