import sys
import re

file_path = r"d:\smanda-ej\ejournal-sman2\app\teacher\jurnal\JurnalClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State
content = content.replace(
    '	const [activeJurnal, setActiveJurnal] = useState<any>(null);',
    '	const [activeJurnal, setActiveJurnal] = useState<any>(null);\n\tconst [currentPageJurnal, setCurrentPageJurnal] = useState(1);\n\tconst [currentPageRekap, setCurrentPageRekap] = useState(1);\n\tconst itemsPerPage = 15;'
)

# 2. Reset page when viewMode changes
content = content.replace(
    '	const handleBackToList = () => {',
    '	const handleBackToList = () => {\n\t\tsetCurrentPageJurnal(1);\n\t\tsetCurrentPageRekap(1);'
)

# 3. Jurnal Table IIFE replacement
jurnal_target = """										{activeJadwal.jurnal && activeJadwal.jurnal.length > 0 ? (
											[...activeJadwal.jurnal]
												.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
												.map((jurnalItem: any, index: number) => {"""

jurnal_replacement = """										{(() => {
											const sortedJurnal = activeJadwal.jurnal ? [...activeJadwal.jurnal].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()) : [];
											const totalItems = sortedJurnal.length;
											const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
											const startIndex = (currentPageJurnal - 1) * itemsPerPage;
											const paginatedJurnal = sortedJurnal.slice(startIndex, startIndex + itemsPerPage);
											
											if (totalItems === 0) {
												return (
													<tr>
														<td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
															Belum ada riwayat jurnal.
														</td>
													</tr>
												);
											}
											return paginatedJurnal.map((jurnalItem: any, index: number) => {"""

content = content.replace(jurnal_target, jurnal_replacement)

# End of Jurnal table IIFE
jurnal_end_target = """												})
										) : (
											<tr>
												<td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
													Belum ada riwayat jurnal.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>"""

jurnal_end_replacement = """												})
										})()}
									</tbody>
								</table>
							</div>
							
							{/* PAGINATION UI JURNAL */}
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
								<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
									Menampilkan {activeJadwal.jurnal && activeJadwal.jurnal.length > 0 ? (currentPageJurnal - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPageJurnal * itemsPerPage, (activeJadwal.jurnal || []).length)} dari {(activeJadwal.jurnal || []).length} data
								</span>
								<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
									<button
										disabled={currentPageJurnal === 1}
										onClick={() => setCurrentPageJurnal(currentPageJurnal - 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageJurnal === 1 ? "#f1f5f9" : "white", color: currentPageJurnal === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageJurnal === 1 ? "not-allowed" : "pointer" }}
									>
										Prev
									</button>
									<button
										disabled={currentPageJurnal >= Math.ceil((activeJadwal.jurnal || []).length / itemsPerPage) || (activeJadwal.jurnal || []).length === 0}
										onClick={() => setCurrentPageJurnal(currentPageJurnal + 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageJurnal >= Math.ceil((activeJadwal.jurnal || []).length / itemsPerPage) || (activeJadwal.jurnal || []).length === 0 ? "#f1f5f9" : "white", color: currentPageJurnal >= Math.ceil((activeJadwal.jurnal || []).length / itemsPerPage) || (activeJadwal.jurnal || []).length === 0 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageJurnal >= Math.ceil((activeJadwal.jurnal || []).length / itemsPerPage) || (activeJadwal.jurnal || []).length === 0 ? "not-allowed" : "pointer" }}
									>
										Next
									</button>
								</div>
							</div>"""

content = content.replace(jurnal_end_target, jurnal_end_replacement)


# 4. Rekap Table Map replacement
rekap_target = """											return sortedData.map((rs: any, index: number) => {"""
rekap_replacement = """											const totalItems = sortedData.length;
											const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
											const startIndex = (currentPageRekap - 1) * itemsPerPage;
											const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

											return paginatedData.map((rs: any, index: number) => {"""
content = content.replace(rekap_target, rekap_replacement)

# End of Rekap table
rekap_end_target = """										})()}
									</tbody>
								</table>
							</div>
						</div>"""
rekap_end_replacement = """										})()}
									</tbody>
								</table>
							</div>

							{/* PAGINATION UI REKAP */}
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
								<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
									Menampilkan {activeJadwal.kelas?.riwayatSiswa && activeJadwal.kelas.riwayatSiswa.length > 0 ? (currentPageRekap - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPageRekap * itemsPerPage, (activeJadwal.kelas?.riwayatSiswa || []).length)} dari {(activeJadwal.kelas?.riwayatSiswa || []).length} data
								</span>
								<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
									<button
										disabled={currentPageRekap === 1}
										onClick={() => setCurrentPageRekap(currentPageRekap - 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageRekap === 1 ? "#f1f5f9" : "white", color: currentPageRekap === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageRekap === 1 ? "not-allowed" : "pointer" }}
									>
										Prev
									</button>
									<button
										disabled={currentPageRekap >= Math.ceil((activeJadwal.kelas?.riwayatSiswa || []).length / itemsPerPage) || (activeJadwal.kelas?.riwayatSiswa || []).length === 0}
										onClick={() => setCurrentPageRekap(currentPageRekap + 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageRekap >= Math.ceil((activeJadwal.kelas?.riwayatSiswa || []).length / itemsPerPage) || (activeJadwal.kelas?.riwayatSiswa || []).length === 0 ? "#f1f5f9" : "white", color: currentPageRekap >= Math.ceil((activeJadwal.kelas?.riwayatSiswa || []).length / itemsPerPage) || (activeJadwal.kelas?.riwayatSiswa || []).length === 0 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageRekap >= Math.ceil((activeJadwal.kelas?.riwayatSiswa || []).length / itemsPerPage) || (activeJadwal.kelas?.riwayatSiswa || []).length === 0 ? "not-allowed" : "pointer" }}
									>
										Next
									</button>
								</div>
							</div>
						</div>"""
content = content.replace(rekap_end_target, rekap_end_replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("JurnalClient patched")
