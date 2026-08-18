import sys
import re

file_path = r"d:\smanda-ej\ejournal-sman2\app\pimpinan\report\ReportClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add pagination state
content = content.replace(
    '	const [isPdfLoading, setIsPdfLoading] = useState(false);',
    '	const [isPdfLoading, setIsPdfLoading] = useState(false);\n\tconst [currentPagePdca, setCurrentPagePdca] = useState(1);\n\tconst itemsPerPage = 15;'
)

# 2. Paginate table
pdca_target = """											{activeData.pdca.doImplementasi.length === 0 ? (
												<tr>
													<td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
														Belum ada rencana aksi yang ditambahkan.
													</td>
												</tr>
											) : (
												activeData.pdca.doImplementasi.map((row: any, i: number) => ("""

pdca_replacement = """											{activeData.pdca.doImplementasi.length === 0 ? (
												<tr>
													<td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
														Belum ada rencana aksi yang ditambahkan.
													</td>
												</tr>
											) : (
												(() => {
													const totalItems = activeData.pdca.doImplementasi.length;
													const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
													const startIndex = (currentPagePdca - 1) * itemsPerPage;
													const paginatedData = activeData.pdca.doImplementasi.slice(startIndex, startIndex + itemsPerPage);
													return paginatedData.map((row: any, i: number) => ("""
content = content.replace(pdca_target, pdca_replacement)

# End of table
pdca_end_target = """													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
							</div>

							<div className={styles.sectionBlock}>"""

pdca_end_replacement = """													</tr>
												));
												})()
											)}
										</tbody>
									</table>
								</div>
								
								{/* PAGINATION UI PDCA */}
								{activeData.pdca.doImplementasi.length > 0 && (
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
										<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
											Menampilkan {(currentPagePdca - 1) * itemsPerPage + 1}-{Math.min(currentPagePdca * itemsPerPage, activeData.pdca.doImplementasi.length)} dari {activeData.pdca.doImplementasi.length} data
										</span>
										<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
											<button
												disabled={currentPagePdca === 1}
												onClick={() => setCurrentPagePdca(currentPagePdca - 1)}
												style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPagePdca === 1 ? "#f1f5f9" : "white", color: currentPagePdca === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPagePdca === 1 ? "not-allowed" : "pointer" }}
											>
												Prev
											</button>
											<button
												disabled={currentPagePdca >= Math.ceil(activeData.pdca.doImplementasi.length / itemsPerPage)}
												onClick={() => setCurrentPagePdca(currentPagePdca + 1)}
												style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPagePdca >= Math.ceil(activeData.pdca.doImplementasi.length / itemsPerPage) ? "#f1f5f9" : "white", color: currentPagePdca >= Math.ceil(activeData.pdca.doImplementasi.length / itemsPerPage) ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPagePdca >= Math.ceil(activeData.pdca.doImplementasi.length / itemsPerPage) ? "not-allowed" : "pointer" }}
											>
												Next
											</button>
										</div>
									</div>
								)}
							</div>

							<div className={styles.sectionBlock}>"""

content = content.replace(pdca_end_target, pdca_end_replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Pimpinan ReportClient patched")
