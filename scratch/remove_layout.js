const fs = require('fs');
const path = require('path');

const files = [
    'd:/smanda-ej/ejournal-sman2/app/teacher/setelan/SetelanClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/teacher/riwayat/RiwayatClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/teacher/presensi/PresensiClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/teacher/jurnal/JurnalClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/teacher/data-siswa/DataSiswaClient.tsx',
    'd:/smanda-ej/ejournal-sman2/app/teacher/dashboard/TeacherDashboardClient.tsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace <div className={styles.layoutWrapper}> with <>
    content = content.replace(/<div className=\{styles\.layoutWrapper\}>/, '<>');
    
    // Remove <aside>...</main> up to <div className={styles.dashboardContainer}>
    content = content.replace(/<aside[\s\S]*?(?=<div className=\{styles\.dashboardContainer\}>)/, '');
    
    // Replace closing </main></div> with </>
    content = content.replace(/<\/main>\s*<\/div>/, '</>');
    
    fs.writeFileSync(file, content);
    console.log(`Processed ${file}`);
});
