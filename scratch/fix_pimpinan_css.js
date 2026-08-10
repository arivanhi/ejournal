const fs = require('fs');
const path = require('path');

const files = [
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/report/report.module.css',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/monitoring/monitoring.module.css',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/kehadiran/kehadiran.module.css',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/jurnal/jurnal.module.css',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/dashboard/pimpinan.module.css'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find all class definitions containing grid-template-columns
    const regex = /\.([a-zA-Z0-9_-]+)\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*([^;]+);[^}]*\}/g;
    
    let newContent = content.replace(regex, (match, className, columns) => {
        if (columns.trim() === '1fr') return match; // already responsive
        if (className === 'pdfGrid') return match; // keep PDF grid static
        
        // replace the columns with 1fr
        let replacedMatch = match.replace(/grid-template-columns:\s*[^;]+;/, 'grid-template-columns: 1fr;');
        
        // append the media query
        let mediaQuery = `\n@media (min-width: 768px) {\n\t.${className} {\n\t\tgrid-template-columns: ${columns};\n\t}\n}`;
        
        return replacedMatch + mediaQuery;
    });

    if (newContent !== content) {
        fs.writeFileSync(file, newContent);
        console.log(`Updated ${file}`);
    }
});
