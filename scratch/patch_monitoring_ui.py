import sys

file_path = r"d:\smanda-ej\ejournal-sman2\app\pimpinan\monitoring\MonitoringClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states for filterGuru, startDate, endDate
state_target = """	const [searchTerm, setSearchTerm] = useState("");
	const [searchTopik, setSearchTopik] = useState("");"""

state_replacement = """	const [searchTerm, setSearchTerm] = useState("");
	const [searchTopik, setSearchTopik] = useState("");
	const [filterGuru, setFilterGuru] = useState<string>("Semua Guru");
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");"""
content = content.replace(state_target, state_replacement)

# 2. Update filteredData logic
filter_target = """	const filteredData = dataMonitoring.filter(
		(item: any) =>
			item.mapelNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.guruNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.kelasNama.toLowerCase().includes(searchTerm.toLowerCase()),
	);"""

filter_replacement = """	const filteredData = dataMonitoring.filter((item: any) => {
		const matchesSearch = 
			item.mapelNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.guruNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.kelasNama.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesGuru = filterGuru === "Semua Guru" || item.guruNama === filterGuru;
		return matchesSearch && matchesGuru;
	});"""
content = content.replace(filter_target, filter_replacement)

# 3. Replace Filter button with Dropdown
dropdown_target = """								<button className={styles.btnOutline}>
									<Filter size={16} /> Filter
								</button>"""

dropdown_replacement = """								<select
									className={styles.searchInput}
									style={{ backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #e2e8f0", padding: "0.5rem 1rem", cursor: "pointer", height: "100%", width: "max-content", minWidth: "150px", flexShrink: 0, fontSize: "0.875rem" }}
									value={filterGuru}
									onChange={(e) => {
										setFilterGuru(e.target.value);
										setCurrentCardPage(1);
									}}
								>
									<option value="Semua Guru">Semua Guru</option>
									{uniqueGurus.map((guru, idx) => (
										<option key={idx} value={guru}>{guru}</option>
									))}
								</select>"""
content = content.replace(dropdown_target, dropdown_replacement)

# 4. Add Date Pickers in Bulk Modal
modal_target = """							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
								Pilih guru yang ingin diekspor jurnalnya:
							</p>

							<div"""

modal_replacement = """							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
								Tentukan periode rekapitulasi (Opsional, jika kosong maka akan mencetak seluruh data semester):
							</p>

							<div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
								<div style={{ flex: 1 }}>
									<label style={{ display: "block", fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>Dari Tanggal</label>
									<input
										type="date"
										style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", outline: "none" }}
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
									/>
								</div>
								<div style={{ flex: 1 }}>
									<label style={{ display: "block", fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem" }}>Sampai Tanggal</label>
									<input
										type="date"
										style={{ width: "100%", padding: "0.5rem", borderRadius: "0.5rem", border: "1px solid #e2e8f0", outline: "none" }}
										value={endDate}
										onChange={(e) => setEndDate(e.target.value)}
									/>
								</div>
							</div>

							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
								Pilih guru yang ingin diekspor jurnalnya:
							</p>

							<div"""
content = content.replace(modal_target, modal_replacement)


# 5. Filter Riwayat in executeBulkPdfExport
bulk_pdf_target = """		const groupedData = selectedExportGurus.map((guruName) => {
			const itemsGuru = dataMonitoring.filter((item: any) => item.guruNama === guruName);
			return {
				guruNama: guruName,
				guruNpp: itemsGuru[0]?.guruNpp || "-",
				tahunAjaranNama: itemsGuru[0]?.tahunAjaranNama || "-",
				items: itemsGuru,
			};
		});"""

bulk_pdf_replacement = """		let filterStart = 0;
		let filterEnd = Infinity;
		if (startDate && endDate) {
			const start = new Date(startDate);
			start.setHours(0, 0, 0, 0);
			filterStart = start.getTime();

			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			filterEnd = end.getTime();
		}

		const groupedData = selectedExportGurus.map((guruName) => {
			// Deep copy itemsGuru untuk memfilter riwayat tanpa mengubah state aslinya
			const itemsGuruRaw = dataMonitoring.filter((item: any) => item.guruNama === guruName);
			
			const itemsGuru = itemsGuruRaw.map((item: any) => {
				const filteredRiwayat = (item.riwayat || []).filter((r: any) => {
					if (!startDate || !endDate) return true;
					return r.tanggalRaw >= filterStart && r.tanggalRaw <= filterEnd;
				});
				
				return { ...item, riwayat: filteredRiwayat };
			}).filter((item: any) => item.riwayat.length > 0); // Opsional: hilangkan mapel yang riwayatnya kosong di periode ini

			return {
				guruNama: guruName,
				guruNpp: itemsGuru[0]?.guruNpp || itemsGuruRaw[0]?.guruNpp || "-",
				tahunAjaranNama: itemsGuru[0]?.tahunAjaranNama || itemsGuruRaw[0]?.tahunAjaranNama || "-",
				items: itemsGuru,
			};
		}).filter(group => group.items.length > 0); // Hilangkan guru jika tidak ada data sama sekali di periode ini"""

content = content.replace(bulk_pdf_target, bulk_pdf_replacement)


# 6. Add Period Label in PDF Cover Bulk
cover_bulk_target = """														<p style={{ fontSize: "12pt", fontWeight: 600 }}>Tahun Ajaran {guruData.tahunAjaranNama}</p>

														<div style={{ margin: "4rem 0", display: "flex", justifyContent: "center" }}>"""

cover_bulk_replacement = """														<p style={{ fontSize: "12pt", fontWeight: 600 }}>Tahun Ajaran {guruData.tahunAjaranNama}</p>
														{startDate && endDate && (
															<p style={{ fontSize: "11pt", fontWeight: 500, marginTop: "0.5rem", color: "#475569" }}>
																Periode: {new Date(startDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })} s/d {new Date(endDate).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}
															</p>
														)}

														<div style={{ margin: "4rem 0", display: "flex", justifyContent: "center" }}>"""

content = content.replace(cover_bulk_target, cover_bulk_replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("MonitoringClient Patched")
