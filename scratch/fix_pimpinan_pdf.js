const fs = require('fs');
const path = require('path');

const files = [
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/monitoring/MonitoringClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/kehadiran/KehadiranClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/jurnal/JurnalClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/dashboard/PimpinanDashboardClient.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Fix jsPDF format to F4 portrait
    content = content.replace(/format:\s*"a4"/g, 'format: [215, 330]');
    
    // Fix inline widths for containers
    content = content.replace(/width:\s*"210mm"/g, 'width: "195mm"');

    fs.writeFileSync(file, content);
    console.log(`Fixed ${file}`);
});

const cssFiles = [
    'd:/smanda-ej/ejournal-sman2/app/pimpinan/kehadiran/kehadiran.module.css'
];

cssFiles.forEach(file => {
    if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace(/width:\s*210mm;/g, 'width: 195mm;');
        fs.writeFileSync(file, content);
        console.log(`Fixed CSS ${file}`);
    }
});
