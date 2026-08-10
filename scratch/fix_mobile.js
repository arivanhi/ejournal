const fs = require('fs');
const path = require('path');

const cssClassesToReset = [
    '.gridLayout', '.metricsGrid', '.splitLayout', '.liveLayout', '.analisaGrid', '.statsGrid',
    '.summaryGrid', '.twoColGrid', '.gridCards', '.statGrid', '.bottomGrid', '.detailInfoGrid',
    '.detailHeaderGrid', '.selectionGrid', '.threeGrid', '.headerGrid', '.dashboardGrid'
];

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
    
    // Add mobile resets at the end of every module.css
    // But we only want to add it if the file actually uses display: grid
    if (content.includes('display: grid')) {
        let toAppend = `\n\n/* Mobile Responsive Resets */\n@media (max-width: 1024px) {\n`;
        const foundClasses = cssClassesToReset.filter(cls => content.includes(cls));
        if (foundClasses.length > 0) {
            toAppend += `  ${foundClasses.join(', ')} {\n    grid-template-columns: 1fr !important;\n  }\n`;
        }
        if (content.includes('.weeklyGrid')) {
            toAppend += `  .weeklyGrid {\n    grid-template-columns: repeat(2, 1fr) !important;\n  }\n`;
        }
        toAppend += `}\n`;
        
        toAppend += `@media (max-width: 640px) {\n`;
        if (content.includes('.weeklyGrid')) {
            toAppend += `  .weeklyGrid {\n    grid-template-columns: 1fr !important;\n  }\n`;
        }
        toAppend += `}\n`;

        // If it has tables, make them responsive
        toAppend += `\n.tableContainer, .tableWrapper, [class*="table"] {\n  max-width: 100%;\n  overflow-x: auto;\n}\n`;

        if (!content.includes('/* Mobile Responsive Resets */')) {
            fs.writeFileSync(file, content + toAppend);
            console.log(`Updated grids in ${file}`);
        }
    }
});

// Fix sidebar layout
const responsiveCssFile = 'd:/smanda-ej/ejournal-sman2/app/components/responsiveLayout.module.css';
let layoutContent = fs.readFileSync(responsiveCssFile, 'utf8');
if (!layoutContent.includes('flex: 1;\n\toverflow: hidden;')) {
    layoutContent = layoutContent.replace(/\.sidebarHeader \{/, `.sidebarContent {\n\tflex: 1;\n\tdisplay: flex;\n\tflex-direction: column;\n\toverflow: hidden;\n}\n\n.sidebarHeader {`);
}
fs.writeFileSync(responsiveCssFile, layoutContent);

const responsiveLayoutFile = 'd:/smanda-ej/ejournal-sman2/app/components/ResponsiveLayout.tsx';
let tsxContent = fs.readFileSync(responsiveLayoutFile, 'utf8');
tsxContent = tsxContent.replace(/<aside className=\{\`\$\{styles\.sidebar\} \$\{isSidebarOpen \? styles\.open : ""\}\`\}>\s*<div>/, 
    '<aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ""}`}>\n\t\t\t\t<div className={styles.sidebarContent}>');
fs.writeFileSync(responsiveLayoutFile, tsxContent);
console.log('Fixed sidebar layout');
