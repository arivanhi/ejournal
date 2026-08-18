import sys

file_path = r"d:\smanda-ej\ejournal-sman2\app\pimpinan\kehadiran\KehadiranClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add states
state_target = """	const [searchTermCard, setSearchTermCard] = useState("");
	const [searchSiswa, setSearchSiswa] = useState("");"""

state_replacement = """	const [searchTermCard, setSearchTermCard] = useState("");
	const [searchSiswa, setSearchSiswa] = useState("");
	const [filterTingkat, setFilterTingkat] = useState<string>("Semua Tingkat");
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");"""
content = content.replace(state_target, state_replacement)

# 2. Update filteredKelas logic
filter_target = """	const filteredKelas = dataKelas.filter((k: any) => k.nama.toLowerCase().includes(searchTermCard.toLowerCase()));"""

filter_replacement = """	const filteredKelas = dataKelas.filter((k: any) => {
		const matchesSearch = k.nama.toLowerCase().includes(searchTermCard.toLowerCase());
		const matchesTingkat = filterTingkat === "Semua Tingkat" || k.nama.startsWith(filterTingkat + "-");
		return matchesSearch && matchesTingkat;
	});"""
content = content.replace(filter_target, filter_replacement)

# 3. Add Dropdown UI
dropdown_target = """							<div className={styles.headerButtons}>
								<div className={styles.searchBoxCard}>"""

dropdown_replacement = """							<div className={styles.headerButtons}>
								<select
									className={styles.searchInput}
									style={{ backgroundColor: "white", borderRadius: "0.5rem", border: "1px solid #e2e8f0", padding: "0.5rem 1rem", cursor: "pointer", height: "100%" }}
									value={filterTingkat}
									onChange={(e) => {
										setFilterTingkat(e.target.value);
										setCurrentPage(1);
									}}
								>
									<option value="Semua Tingkat">Semua Tingkat</option>
									<option value="X">Kelas X</option>
									<option value="XI">Kelas XI</option>
									<option value="XII">Kelas XII</option>
								</select>

								<div className={styles.searchBoxCard}>"""
content = content.replace(dropdown_target, dropdown_replacement)

# 4. Add Date Picker in Export Modal
modal_target = """							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
								Pilih kelas yang ingin disertakan dalam satu file PDF:
							</p>

							<div"""

modal_replacement = """							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
								Tentukan periode rekapitulasi kehadiran (Opsional, jika kosong maka akan mengambil rekap 1 semester berjalan):
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
								Pilih kelas yang ingin disertakan dalam satu file PDF:
							</p>

							<div"""
content = content.replace(modal_target, modal_replacement)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("KehadiranClient UI patched")
