import sys
import re

file_path = r"d:\smanda-ej\ejournal-sman2\app\pimpinan\kehadiran\KehadiranClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State for pagination
content = content.replace(
    '	const [currentPage, setCurrentPage] = useState(1);',
    '	const [currentPage, setCurrentPage] = useState(1);\n\tconst [currentSiswaPage, setCurrentSiswaPage] = useState(1);\n\tconst itemsPerPage = 15;'
)

# 2. Reset page on view changes
content = content.replace(
    '	const handleBack = () => {',
    '	const handleBack = () => {\n\t\tsetCurrentSiswaPage(1);'
)

# 3. Pagination logic for filteredSiswa
siswa_target = """														{filteredSiswa.length === 0 ? (
															<tr>
																<td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
																	Tidak ada siswa yang cocok dengan pencarian.
																</td>
															</tr>
														) : (
															filteredSiswa.map((siswa: any, index: number) => {"""

siswa_replacement = """														{filteredSiswa.length === 0 ? (
															<tr>
																<td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
																	Tidak ada siswa yang cocok dengan pencarian.
																</td>
															</tr>
														) : (
															(() => {
																const startIndex = (currentSiswaPage - 1) * itemsPerPage;
																const paginatedSiswa = filteredSiswa.slice(startIndex, startIndex + itemsPerPage);
																return paginatedSiswa.map((siswa: any, index: number) => {"""
content = content.replace(siswa_target, siswa_replacement)

# End of table
siswa_end_target = """																);
															})
														)}
													</tbody>
												</table>
											</div>
										</div>
									</div>

									{/* SIDEBAR */}"""
siswa_end_replacement = """																);
															});
														})()
														)}
													</tbody>
												</table>
											</div>
											
											{/* PAGINATION UI */}
											{filteredSiswa.length > 0 && (
												<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
													<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
														Menampilkan {(currentSiswaPage - 1) * itemsPerPage + 1}-{Math.min(currentSiswaPage * itemsPerPage, filteredSiswa.length)} dari {filteredSiswa.length} data
													</span>
													<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
														<button
															disabled={currentSiswaPage === 1}
															onClick={() => setCurrentSiswaPage(currentSiswaPage - 1)}
															style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentSiswaPage === 1 ? "#f1f5f9" : "white", color: currentSiswaPage === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentSiswaPage === 1 ? "not-allowed" : "pointer" }}
														>
															Prev
														</button>
														<button
															disabled={currentSiswaPage >= Math.ceil(filteredSiswa.length / itemsPerPage)}
															onClick={() => setCurrentSiswaPage(currentSiswaPage + 1)}
															style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentSiswaPage >= Math.ceil(filteredSiswa.length / itemsPerPage) ? "#f1f5f9" : "white", color: currentSiswaPage >= Math.ceil(filteredSiswa.length / itemsPerPage) ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentSiswaPage >= Math.ceil(filteredSiswa.length / itemsPerPage) ? "not-allowed" : "pointer" }}
														>
															Next
														</button>
													</div>
												</div>
											)}
										</div>
									</div>

									{/* SIDEBAR */}"""
content = content.replace(siswa_end_target, siswa_end_replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Pimpinan KehadiranClient patched")
