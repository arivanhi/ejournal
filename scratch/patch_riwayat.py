import sys
import re

file_path = r"d:\smanda-ej\ejournal-sman2\app\teacher\riwayat\RiwayatClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State
content = content.replace(
    '	const [activeTab, setActiveTab] = useState<"rekap" | "jurnal" | "analisa" | "tugas">("rekap");',
    '	const [activeTab, setActiveTab] = useState<"rekap" | "jurnal" | "analisa" | "tugas">("rekap");\n\tconst [currentPageRekap, setCurrentPageRekap] = useState(1);\n\tconst [currentPageJurnal, setCurrentPageJurnal] = useState(1);\n\tconst [currentPageTugas, setCurrentPageTugas] = useState(1);\n\tconst itemsPerPage = 15;'
)

# Reset pagination on back to list
content = content.replace(
    '	const handleBackToList = () => {',
    '	const handleBackToList = () => {\n\t\tsetCurrentPageRekap(1);\n\t\tsetCurrentPageJurnal(1);\n\t\tsetCurrentPageTugas(1);'
)

# 2. Rekap Siswa table pagination
rekap_target = """												const sortedSiswa = [...activeJadwal.kelas.riwayatSiswa].sort((a: any, b: any) => {
													const nameA = a.siswa?.user?.nama || "";
													const nameB = b.siswa?.user?.nama || "";
													return nameA.localeCompare(nameB);
												});

												return sortedSiswa.map((rs: any) => {"""
rekap_replacement = """												const sortedSiswa = [...activeJadwal.kelas.riwayatSiswa].sort((a: any, b: any) => {
													const nameA = a.siswa?.user?.nama || "";
													const nameB = b.siswa?.user?.nama || "";
													return nameA.localeCompare(nameB);
												});
												
												const totalItems = sortedSiswa.length;
												const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
												const startIndex = (currentPageRekap - 1) * itemsPerPage;
												const paginatedSiswa = sortedSiswa.slice(startIndex, startIndex + itemsPerPage);

												return paginatedSiswa.map((rs: any) => {"""
content = content.replace(rekap_target, rekap_replacement)

# Pagination UI Rekap
rekap_end_target = """										</tbody>
									</table>
								</div>
							)}"""
rekap_end_replacement = """										</tbody>
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
							)}"""
content = content.replace(rekap_end_target, rekap_end_replacement)

# 3. Jurnal Table pagination
jurnal_target = """									) : (
										[...activeJadwal.jurnal]
											.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
											.map((jurnalItem: any, index: number) => {"""

jurnal_replacement = """									) : (
										(() => {
											const sortedJurnal = [...activeJadwal.jurnal].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
											const totalItems = sortedJurnal.length;
											const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
											const startIndex = (currentPageJurnal - 1) * itemsPerPage;
											const paginatedJurnal = sortedJurnal.slice(startIndex, startIndex + itemsPerPage);
											
											return (
												<>
													{paginatedJurnal.map((jurnalItem: any, index: number) => {"""

content = content.replace(jurnal_target, jurnal_replacement)

jurnal_end_target = """													</div>
												);
											})
									)}
								</div>
							)}"""

jurnal_end_replacement = """													</div>
												);
											})}
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
													</div>
												</>
											);
										})()
									)}
								</div>
							)}"""
content = content.replace(jurnal_end_target, jurnal_end_replacement)

# 4. Tugas Table pagination
tugas_target = """										return [...jurnalTugas]
											.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
											.map((jurnalItem: any, index: number) => {"""
tugas_replacement = """										const sortedTugas = [...jurnalTugas].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
										const totalItems = sortedTugas.length;
										const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
										const startIndex = (currentPageTugas - 1) * itemsPerPage;
										const paginatedTugas = sortedTugas.slice(startIndex, startIndex + itemsPerPage);
										
										return (
											<>
												{paginatedTugas.map((jurnalItem: any, index: number) => {"""
content = content.replace(tugas_target, tugas_replacement)

tugas_end_target = """													</div>
												);
											});
									})()}
								</div>
							)}"""

tugas_end_replacement = """													</div>
												);
											})}
												{/* PAGINATION UI TUGAS */}
												<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
													<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
														Menampilkan {jurnalTugas.length > 0 ? (currentPageTugas - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPageTugas * itemsPerPage, jurnalTugas.length)} dari {jurnalTugas.length} data
													</span>
													<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
														<button
															disabled={currentPageTugas === 1}
															onClick={() => setCurrentPageTugas(currentPageTugas - 1)}
															style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageTugas === 1 ? "#f1f5f9" : "white", color: currentPageTugas === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageTugas === 1 ? "not-allowed" : "pointer" }}
														>
															Prev
														</button>
														<button
															disabled={currentPageTugas >= Math.ceil(jurnalTugas.length / itemsPerPage) || jurnalTugas.length === 0}
															onClick={() => setCurrentPageTugas(currentPageTugas + 1)}
															style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageTugas >= Math.ceil(jurnalTugas.length / itemsPerPage) || jurnalTugas.length === 0 ? "#f1f5f9" : "white", color: currentPageTugas >= Math.ceil(jurnalTugas.length / itemsPerPage) || jurnalTugas.length === 0 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageTugas >= Math.ceil(jurnalTugas.length / itemsPerPage) || jurnalTugas.length === 0 ? "not-allowed" : "pointer" }}
														>
															Next
														</button>
													</div>
												</div>
											</>
										);
									})()}
								</div>
							)}"""
content = content.replace(tugas_end_target, tugas_end_replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("RiwayatClient patched")
