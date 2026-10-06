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
  'app/teacher/kehadiran-koor/KehadiranClient.tsx',
  'app/teacher/riwayat/RiwayatClient.tsx'
];

for (let f of filesToFix) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\{!isLastPage && \}/g, '');
  content = content.replace(/\{!isVeryLastPage && \}/g, '');
  content = content.replace(/\{!isLastOfDocument && \}/g, '');
  fs.writeFileSync(f, content, 'utf8');
}
console.log("Fixed JSX syntax errors.");
