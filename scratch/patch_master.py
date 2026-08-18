import sys
import re

file_path = r"d:\smanda-ej\ejournal-sman2\app\admin\master\MasterClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace('import { useState } from "react";', 'import { useState, useEffect } from "react";')

# 2. State
content = content.replace(
    'const [mappedMapelIds, setMappedMapelIds] = useState<string[]>([]);',
    'const [mappedMapelIds, setMappedMapelIds] = useState<string[]>([]);\n\tconst [currentPage, setCurrentPage] = useState(1);\n\tconst itemsPerPage = 15;\n\tuseEffect(() => {\n\t\tsetCurrentPage(1);\n\t}, [activeTab, searchQuery, filterKelas, filterStatusGuru]);'
)

# 3. Logic
logic_replacement = """	});

	// Pagination Logic
	const totalItems =
		activeTab === "siswa"
			? sortedSiswa.length
			: activeTab === "guru"
				? sortedGuru.length
				: activeTab === "mapel"
					? sortedMapel.length
					: activeTab === "tahunAjar"
						? sortedTahunAjar.length
						: sortedKelas.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedSiswa = sortedSiswa.slice(startIndex, startIndex + itemsPerPage);
	const paginatedGuru = sortedGuru.slice(startIndex, startIndex + itemsPerPage);
	const paginatedMapel = sortedMapel.slice(startIndex, startIndex + itemsPerPage);
	const paginatedTahunAjar = sortedTahunAjar.slice(startIndex, startIndex + itemsPerPage);
	const paginatedKelas = sortedKelas.slice(startIndex, startIndex + itemsPerPage);

	const handleSelectAll"""
content = content.replace('	});\n\n\tconst handleSelectAll', logic_replacement)

# 4. Replace arrays
content = content.replace('sortedSiswa.map((siswa) => (', 'paginatedSiswa.map((siswa) => (')
content = content.replace('sortedSiswa.length === 0 ?', 'paginatedSiswa.length === 0 ?')

content = content.replace('sortedGuru.map((guru) => (', 'paginatedGuru.map((guru) => (')
content = content.replace('sortedGuru.length === 0 ?', 'paginatedGuru.length === 0 ?')

content = content.replace('sortedMapel.map((mapel) => (', 'paginatedMapel.map((mapel) => (')
content = content.replace('sortedMapel.length === 0 ?', 'paginatedMapel.length === 0 ?')

content = content.replace('sortedTahunAjar.map((tahun) => (', 'paginatedTahunAjar.map((tahun) => (')
content = content.replace('sortedTahunAjar.length === 0 ?', 'paginatedTahunAjar.length === 0 ?')

content = content.replace('sortedKelas.map((kelas) => (', 'paginatedKelas.map((kelas) => (')
content = content.replace('sortedKelas.length === 0 ?', 'paginatedKelas.length === 0 ?')

# 5. Add Pagination UI after </table>
# Since there is only one </table>\n\t\t\t\t\t</div> in the main render view (wait, let's check).
pagination_ui = """</table>
					</div>

					{/* PAGINATION UI */}
					<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
						<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
							Menampilkan {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} data
						</span>
						<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
							<button
								disabled={currentPage === 1}
								onClick={() => setCurrentPage(currentPage - 1)}
								style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPage === 1 ? "#f1f5f9" : "white", color: currentPage === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
							>
								Prev
							</button>
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
								<button
									key={p}
									onClick={() => setCurrentPage(p)}
									style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPage === p ? "#1e3a8a" : "white", color: currentPage === p ? "white" : "#334155", border: "1px solid", borderColor: currentPage === p ? "#1e3a8a" : "#e2e8f0", cursor: "pointer" }}
								>
									{p}
								</button>
							))}
							<button
								disabled={currentPage === totalPages}
								onClick={() => setCurrentPage(currentPage + 1)}
								style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPage === totalPages ? "#f1f5f9" : "white", color: currentPage === totalPages ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
							>
								Next
							</button>
						</div>
					</div>"""

content = content.replace('</table>\n\t\t\t\t\t</div>\n\t\t\t\t</div>', pagination_ui + '\n\t\t\t\t</div>')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("MasterClient patched")
