import sys
import re

file_path = r"d:\smanda-ej\ejournal-sman2\app\admin\role\RoleClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State and Logic
logic_replacement = """	const filteredGuru = guruData.filter(
		(guru) => guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) || guru.npp.includes(searchQuery),
	);

	// Pagination Logic
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 15;
	const totalItems = filteredGuru.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedGuru = filteredGuru.slice(startIndex, startIndex + itemsPerPage);"""

content = content.replace(
    '	const filteredGuru = guruData.filter(\n\t\t(guru) => guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) || guru.npp.includes(searchQuery),\n\t);',
    logic_replacement
)

# 2. Map replacement
content = content.replace('filteredGuru.map((guru) => (', 'paginatedGuru.map((guru) => (')

# 3. Add Pagination UI after </table>
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

content = content.replace('</table>\n\t\t\t\t</div>', pagination_ui)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("RoleClient patched")
