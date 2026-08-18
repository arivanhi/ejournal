import sys
import re

file_path = r"d:\smanda-ej\ejournal-sman2\app\pimpinan\jurnal\JurnalClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update tableRowsPerPage
content = content.replace('	const tableRowsPerPage = 5;', '	const tableRowsPerPage = 15;')

# 2. Add pagination for sortedSiswa in modal
content = content.replace(
    '	const [isNilaiModalOpen, setIsNilaiModalOpen] = useState(false);',
    '	const [isNilaiModalOpen, setIsNilaiModalOpen] = useState(false);\n\tconst [currentModalPage, setCurrentModalPage] = useState(1);'
)

# Reset page when modal opens
content = content.replace(
    '																setIsNilaiModalOpen(true);',
    '																setCurrentModalPage(1);\n																setIsNilaiModalOpen(true);'
)

# Paginate sortedSiswa
siswa_target = """											{(() => {
												const sortedSiswa = [...selectedItem.siswaList].sort((a: any, b: any) =>
													a.nama.localeCompare(b.nama),
												);

												return sortedSiswa.map((siswa: any, idx: number) => {"""
siswa_replacement = """											{(() => {
												const sortedSiswa = [...selectedItem.siswaList].sort((a: any, b: any) =>
													a.nama.localeCompare(b.nama),
												);
												
												const itemsPerPage = 15;
												const totalItems = sortedSiswa.length;
												const startIndex = (currentModalPage - 1) * itemsPerPage;
												const paginatedSiswa = sortedSiswa.slice(startIndex, startIndex + itemsPerPage);

												return paginatedSiswa.map((siswa: any, idx: number) => {"""
content = content.replace(siswa_target, siswa_replacement)

# Pagination UI for modal
siswa_end_target = """											})()}
										</tbody>
									</table>
								</div>
							</div>"""
siswa_end_replacement = """											})()}
										</tbody>
									</table>
								</div>
							</div>

							{/* PAGINATION UI MODAL */}
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
								<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
									Menampilkan {selectedItem.siswaList && selectedItem.siswaList.length > 0 ? (currentModalPage - 1) * 15 + 1 : 0}-{Math.min(currentModalPage * 15, selectedItem.siswaList.length)} dari {selectedItem.siswaList.length} data
								</span>
								<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
									<button
										disabled={currentModalPage === 1}
										onClick={() => setCurrentModalPage(currentModalPage - 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentModalPage === 1 ? "#f1f5f9" : "white", color: currentModalPage === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentModalPage === 1 ? "not-allowed" : "pointer" }}
									>
										Prev
									</button>
									<button
										disabled={currentModalPage >= Math.ceil(selectedItem.siswaList.length / 15) || selectedItem.siswaList.length === 0}
										onClick={() => setCurrentModalPage(currentModalPage + 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentModalPage >= Math.ceil(selectedItem.siswaList.length / 15) || selectedItem.siswaList.length === 0 ? "#f1f5f9" : "white", color: currentModalPage >= Math.ceil(selectedItem.siswaList.length / 15) || selectedItem.siswaList.length === 0 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentModalPage >= Math.ceil(selectedItem.siswaList.length / 15) || selectedItem.siswaList.length === 0 ? "not-allowed" : "pointer" }}
									>
										Next
									</button>
								</div>
							</div>"""
content = content.replace(siswa_end_target, siswa_end_replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Pimpinan JurnalClient patched")
