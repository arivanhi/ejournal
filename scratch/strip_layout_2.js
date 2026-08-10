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

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // We want to delete:
    // 1. <aside className={styles.sidebar}> ... </aside>
    // 2. <header className={styles.topbar}> ... </header>
    // 3. <header className={styles.header}> ... </header> (for admin)
    
    // We can do this by finding the tags and removing them along with their contents.
    // Since we know the structure, we can use regex carefully.
    
    // Remove aside
    content = content.replace(/<aside className=\{styles\.sidebar\}>[\s\S]*?<\/aside>/g, '');
    
    // Remove header
    content = content.replace(/<header className=\{styles\.(?:topbar|header)\}>[\s\S]*?<\/header>/g, '');
    
    // Remove {/* SIDEBAR */} and {/* MAIN CONTENT */}
    content = content.replace(/\{\/\*\s*(?:SIDEBAR|MAIN CONTENT)\s*\*\/\}/g, '');
    
    // Remove <div className={styles.layoutWrapper}> or <div className={styles.layoutContainer}>
    // We can just remove the exact opening tag. But we must remove the corresponding closing tag at the end.
    if (content.includes('<div className={styles.layoutWrapper}>')) {
        content = content.replace(/<div className=\{styles\.layoutWrapper\}>/, '<>');
        content = content.replace(/<\/div>\s*\);\s*\}/, '</>\n\t);\n}');
    }
    if (content.includes('<div className={styles.layoutContainer}>')) {
        content = content.replace(/<div className=\{styles\.layoutContainer\}>/, '<>');
        content = content.replace(/<\/div>\s*\);\s*\}/, '</>\n\t);\n}');
    }

    // Remove <main className={styles.mainContent}> or <main className={styles.contentScroll}>
    if (content.match(/<main className=\{styles\.(?:mainContent|contentScroll)\}>/)) {
        content = content.replace(/<main className=\{styles\.(?:mainContent|contentScroll)\}>/, '<>');
        // The closing </main> is usually near the end before the layoutWrapper closing div
        content = content.replace(/<\/main>/g, '</>');
    }
    
    // Remove <div className={styles.mainArea}> (for admin)
    if (content.includes('<div className={styles.mainArea}>')) {
        content = content.replace(/<div className=\{styles\.mainArea\}>/, '<>');
        content = content.replace(/<\/div>\s*<\/>\s*\);\s*\}/, '</>\n\t\t</>\n\t);\n}');
    }

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated layout in ${file}`);
    }
});
