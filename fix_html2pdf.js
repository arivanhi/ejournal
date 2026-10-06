const fs = require('fs');

const filesWithPageContainer = [
  'app/teacher/riwayat/RiwayatClient.tsx',
  'app/teacher/kehadiran-koor/KehadiranClient.tsx',
  'app/teacher/jurnal-tka/JurnalTkaClient.tsx',
  'app/teacher/jurnal/JurnalClient.tsx',
  'app/pimpinan/report/ReportClient.tsx',
  'app/pimpinan/rating/RatingClient.tsx',
  'app/pimpinan/monitoring/MonitoringClient.tsx',
  'app/pimpinan/kehadiran/KehadiranClient.tsx',
  'app/pimpinan/dashboard/PimpinanDashboardClient.tsx',
  'app/pimpinan/jurnal/JurnalClient.tsx'
];

for (let f of filesWithPageContainer) {
  let content = fs.readFileSync(f, 'utf8');

  content = content.replace(
    /const PageContainer = \(\{ children, isLast \}: \{ children: React\.ReactNode; isLast\?: boolean \}\) => \(\s*<div/g,
    'const PageContainer = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (\n\t<div\n\t\tclassName="pdf-page-target"'
  );

  content = content.replace(/<div className="html2pdf__page-break"><\/div>/g, '');
  content = content.replace(/<div className='html2pdf__page-break'><\/div>/g, '');

  let regex = /const html2pdf = \(await import\("html2pdf\.js"\)\)\.default;\s*const element = (.*?);\s*const opt = \{([\s\S]*?)filename:\s*(.*),\s*image:([\s\S]*?)jsPDF:\s*\{ unit: "mm", format: "a4", orientation: "(.*?)" \}([\s\S]*?)await html2pdf\(\)\.set\(opt\)\.from\(element\)\.save\(\);/g;

  content = content.replace(regex, (match, elementCode, optBefore, filenameCode, optMid, orientation, optAfter) => {
    let orientationShort = orientation === "landscape" ? "l" : "p";
    let width = orientation === "landscape" ? 297 : 210;
    let height = orientation === "landscape" ? 210 : 297;

    return `const html2canvas = (await import("html2canvas")).default;
				const jsPDF = (await import("jspdf")).default;
				const element = ${elementCode};
				const pdf = new jsPDF("${orientationShort}", "mm", "a4");
				const pages = element.querySelectorAll(".pdf-page-target");

				for (let i = 0; i < pages.length; i++) {
					const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true });
					const imgData = canvas.toDataURL("image/jpeg", 1.0);
					
					if (i > 0) pdf.addPage();
					pdf.addImage(imgData, "JPEG", 0, 0, ${width}, ${height});
				}

				pdf.save(${filenameCode});`;
  });

  fs.writeFileSync(f, content, 'utf8');
}
console.log("Done fixing page containers!");
