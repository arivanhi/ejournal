const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/teacher/jurnal/JurnalClient.tsx');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Find layoutWrapper and replace with <>
const layoutIdx = lines.findIndex(l => l.includes('<div className={styles.layoutWrapper}>'));
if (layoutIdx !== -1) {
    lines[layoutIdx] = lines[layoutIdx].replace('<div className={styles.layoutWrapper}>', '<>');
}

// Find sidebar start and topbar end
const sidebarIdx = lines.findIndex(l => l.includes('{/* === SIDEBAR === */}'));
const dashboardIdx = lines.findIndex(l => l.includes('<div className={styles.dashboardContainer}>'));

if (sidebarIdx !== -1 && dashboardIdx !== -1) {
    // Remove lines from sidebarIdx up to dashboardIdx - 1
    lines.splice(sidebarIdx, dashboardIdx - sidebarIdx);
}

// Replace the closing tags at the very end
const endIdx = lines.length - 1;
for (let i = endIdx; i >= 0; i--) {
    if (lines[i].includes('</main>')) {
        lines.splice(i, 1); // remove </main>
    } else if (lines[i].includes('</div>') && i >= lines.length - 5) { // The last </div> which belonged to layoutWrapper
        lines[i] = lines[i].replace('</div>', '</>');
        break; // only do it once
    }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('JurnalClient layout fixed!');
