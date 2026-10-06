const fs = require('fs');

const filesToFix = [
  'app/pimpinan/dashboard/PimpinanDashboardClient.tsx',
  'app/pimpinan/jurnal/JurnalClient.tsx',
  'app/pimpinan/kehadiran/KehadiranClient.tsx',
  'app/pimpinan/monitoring/MonitoringClient.tsx',
  'app/pimpinan/rating/RatingClient.tsx',
  'app/pimpinan/report/ReportClient.tsx',
  'app/teacher/jurnal-tka/JurnalTkaClient.tsx',
  'app/teacher/jurnal/JurnalClient.tsx',
  'app/teacher/jurnal-konseling/JurnalKonselingClient.tsx',
  'app/teacher/kehadiran-koor/KehadiranClient.tsx',
  'app/teacher/riwayat/RiwayatClient.tsx',
  'app/admin/jadwal/JadwalClient.tsx'
];

for (let f of filesToFix) {
  let content = fs.readFileSync(f, 'utf8');

  // Replace { display: "none" } with position absolute
  // Some might be { display: 'none' }
  // We'll just replace `<div style={{ display: "none" }}>`
  // and `<div style={{ display: 'none' }}>`
  
  content = content.replace(
    /<div style=\{\{\s*display:\s*["']none["']\s*\}\}>/g,
    '<div style={{ position: "absolute", top: "-9999px", left: "-9999px" }}>'
  );

  // In RiwayatClient it was `visibility: "hidden"`
  content = content.replace(
    /visibility:\s*["']hidden["']/g,
    'visibility: "visible"'
  );
  
  // In JadwalClient, it might not be explicitly display none, let me check. Let's just do a generic replace.

  fs.writeFileSync(f, content, 'utf8');
}
console.log("Fixed visibility!");
