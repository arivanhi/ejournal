const fs = require('fs');
const path = require('path');

function getFiles(dir, files = []) {
    const fileList = fs.readdirSync(dir);
    for (const file of fileList) {
        const name = path.join(dir, file);
        if (fs.statSync(name).isDirectory()) {
            getFiles(name, files);
        } else if (name.endsWith('Client.tsx')) {
            files.push(name);
        }
    }
    return files;
}

const files = getFiles('d:/smanda-ej/ejournal-sman2/app');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // 1. Remove <div className={styles.layoutWrapper}>
    // Replace the exact lines of layoutWrapper opening up to dashboardContainer
    content = content.replace(/<div className=\{styles\.layoutWrapper\}>\s*(<div style=\{\{ display: "none" \}\}>[\s\S]*?<\/div>\s*<\/div>\s*)?<!-- SIDEBAR -->\s*<aside className=\{styles\.sidebar\}>[\s\S]*?<\/aside>\s*<!-- MAIN CONTENT -->\s*<main className=\{styles\.mainContent\}>\s*<header className=\{styles\.topbar\}>[\s\S]*?<\/header>\s*(<div className=\{styles\.dashboardContainer\}>)/g, 
    (match, p1, p2) => {
        return (p1 ? p1 : '') + p2;
    });

    // Also some files might not have <!-- SIDEBAR --> comments
    content = content.replace(/<div className=\{styles\.layoutWrapper\}>\s*(<div style=\{\{ display: "none" \}\}>[\s\S]*?<\/div>\s*<\/div>\s*)?<aside className=\{styles\.sidebar\}>[\s\S]*?<\/aside>\s*<main className=\{styles\.mainContent\}>\s*<header className=\{styles\.topbar\}>[\s\S]*?<\/header>\s*(<div className=\{styles\.dashboardContainer\}>)/g, 
    (match, p1, p2) => {
        return (p1 ? p1 : '') + p2;
    });

    // 2. Remove closing tags for main and layoutWrapper
    // We expect </div>\n</main>\n</div> at the end, replace with just </div>
    content = content.replace(/<\/div>\s*<\/main>\s*<\/div>\s*\);\s*\}/g, '</div>\n\t);\n}');

    // 3. Fix html2canvas missing windowWidth (e.g. in RiwayatClient.tsx)
    content = content.replace(/html2canvas:\s*\{\s*scale:\s*2,\s*useCORS:\s*true,\s*letterRendering:\s*true\s*\}/g, 'html2canvas: { scale: 2, useCORS: true, windowWidth: 1024, letterRendering: true }');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated layout in ${file}`);
    }
});

// For AdminLayout
const adminLayoutPath = 'd:/smanda-ej/ejournal-sman2/app/admin/layout.tsx';
let adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf8');
// rename to client wrapper style or just adapt to ResponsiveLayout
// wait, Admin doesn't use AdminLayoutClient. Let's just create AdminLayoutClient and modify layout.tsx.
