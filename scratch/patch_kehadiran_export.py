import sys

file_path = r"d:\smanda-ej\ejournal-sman2\app\pimpinan\kehadiran\KehadiranClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update onClick handler for "Unduh PDF"
onclick_target = """									onClick={() => {
										const classesToExport = dataKelas.filter((k: any) => selectedExportClasses.includes(k.id));
										executePdfExport(classesToExport, `Rekap_Kehadiran_Multi_Kelas.pdf`);
									}}"""

onclick_replacement = """									onClick={async () => {
										let classesToExport = dataKelas.filter((k: any) => selectedExportClasses.includes(k.id));
										
										if (startDate && endDate) {
											setIsDownloadingPdf(true);
											try {
												const res = await fetch("/api/kehadiran/export", {
													method: "POST",
													headers: { "Content-Type": "application/json" },
													body: JSON.stringify({
														startDate,
														endDate,
														kelasIds: selectedExportClasses,
														tahunAjaranId: tahunAjaran?.id
													})
												});
												const json = await res.json();
												
												if (json.useClientData) {
													// Use default classesToExport
												} else if (json.classesToExport) {
													classesToExport = json.classesToExport;
												} else {
													showToast("Gagal mengambil data periode dari server");
													setIsDownloadingPdf(false);
													return;
												}
											} catch (e) {
												showToast("Terjadi kesalahan jaringan");
												setIsDownloadingPdf(false);
												return;
											}
											setIsDownloadingPdf(false);
										}

										executePdfExport(classesToExport, `Rekap_Kehadiran_Multi_Kelas.pdf`);
									}}"""
content = content.replace(onclick_target, onclick_replacement)

# 2. Add period label to PDF Cover
cover_target = """														<p style={{ fontSize: "12pt", fontWeight: 600 }}>Tahun Ajaran {tahunAjaran?.nama || "Aktif"}</p>

														<div style={{ margin: "4rem 0", display: "flex", justifyContent: "center" }}>"""

cover_replacement = """														<p style={{ fontSize: "12pt", fontWeight: 600 }}>Tahun Ajaran {tahunAjaran?.nama || "Aktif"}</p>
														{startDate && endDate && (
															<p style={{ fontSize: "11pt", fontWeight: 500, marginTop: "0.5rem", color: "#475569" }}>
																Periode: {new Date(startDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} s/d {new Date(endDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
															</p>
														)}

														<div style={{ margin: "4rem 0", display: "flex", justifyContent: "center" }}>"""
content = content.replace(cover_target, cover_replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("KehadiranClient Export Logic Patched")
