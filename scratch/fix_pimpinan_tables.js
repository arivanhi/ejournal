const fs = require('fs');
const path = require('path');

const files = [
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/report/ReportClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/monitoring/MonitoringClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/kehadiran/KehadiranClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/jurnal/JurnalClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/dashboard/PimpinanDashboardClient.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Look for <table className={styles.dataTable}> or <table className={styles.pdcaTable}> 
    // that is NOT preceded by <div style={{ overflowX: "auto"
    
    const tableRegex = /(?<!<div style=\{\{\s*overflowX:\s*"auto"[^>]*>\s*)<table className=\{styles\.(?:dataTable|pdcaTable)\}(?:[^>]*)>([\s\S]*?)<\/table>/g;
    
    let newContent = content.replace(tableRegex, (match) => {
        return `<div style={{ overflowX: "auto", width: "100%" }}>\n${match}\n</div>`;
    });

    // Handle any special tables like the ones with inline styles
    const inlineTableRegex = /(?<!<div style=\{\{\s*overflowX:\s*"auto"[^>]*>\s*)<table className=\{styles\.dataTable\} style=\{\{[^}]+\}\}>([\s\S]*?)<\/table>/g;
    newContent = newContent.replace(inlineTableRegex, (match) => {
        return `<div style={{ overflowX: "auto", width: "100%" }}>\n${match}\n</div>`;
    });

    if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        console.log(`Updated tables in ${file}`);
    }
});
