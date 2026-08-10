const fs = require('fs');

function replaceDates(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Convert .toISOString().split("T")[0] to custom local date format string to avoid timezone bugs
    // We will replace `new Date(xxx).toISOString().split("T")[0]` with `new Date(xxx).toLocaleDateString("en-CA")`
    // Actually, to be absolutely safe across all engines, let's use a small inline format or just "en-CA" which works in modern V8.
    
    // Instead of regex replacing everything blindly, let's do exactly:
    let newContent = content.replace(/\.toISOString\(\)\.split\("T"\)\[0\]/g, '.toLocaleDateString("en-CA")');
    
    if (newContent !== content) {
        fs.writeFileSync(filePath, newContent);
        console.log(`Fixed dates in ${filePath}`);
    }
}

replaceDates('d:/smanda-ej/ejournal-sman2/app/teacher/jurnal/JurnalClient.tsx');
replaceDates('d:/smanda-ej/ejournal-sman2/app/teacher/riwayat/RiwayatClient.tsx');

// Fix the auto-close from 16 to 20 in presensi/page.tsx
let presensiPage = 'd:/smanda-ej/ejournal-sman2/app/teacher/presensi/page.tsx';
if (fs.existsSync(presensiPage)) {
    let content = fs.readFileSync(presensiPage, 'utf8');
    let newContent = content.replace(/today\.getHours\(\)\s*>=\s*16/, 'today.getHours() >= 20');
    newContent = newContent.replace('JAM 4 SORE (16:00)', 'JAM 8 MALAM (20:00)');
    newContent = newContent.replace('jam 16:00 atau lebih', 'jam 20:00 atau lebih');
    if (newContent !== content) {
        fs.writeFileSync(presensiPage, newContent);
        console.log(`Fixed auto-close time in ${presensiPage}`);
    }
}
