"use client";

import { useState, useRef } from "react";
import { Plus, Search, Trash2, Edit2, Users, BookOpen, UserPlus, CheckSquare, Square, CheckCircle2, ArrowLeft, UploadCloud, X } from "lucide-react";
import * as XLSX from "xlsx";
import styles from "../../master/adminMaster.module.css";
import { 
	buatMapelTkaAction, editMapelTkaAction, hapusMapelTkaAction, importMapelTkaMassalAction,
	buatRombelAction, hapusRombelAction, updateSiswaRombelAction,
	setTimFasilitatorMapelAction, setMapelRombelAction
} from "./actions";

interface PropTka {
	tahunAjaran: any;
	mapelTkaList: any[];
	guruList: { id: string; nama: string; npp: string }[];
	rombelList: any[];
	timFasilitatorList: any[];
	siswaReguler: { id: string; nama: string; nis: string; kelasAsal: string }[];
}

export default function TkaClient({ tahunAjaran, mapelTkaList, guruList, rombelList, timFasilitatorList, siswaReguler }: PropTka) {
	const [activeTab, setActiveTab] = useState<"mapel" | "rombel" | "penugasan" | "jadwal">("mapel");
	const [loading, setLoading] = useState(false);

	// ========================
	// STATE: MAPEL PILIHAN TKA
	// ========================
	const [isMapelModalOpen, setIsMapelModalOpen] = useState(false);
	const [mapelForm, setMapelForm] = useState({ id: "", kode: "", nama: "" });

	// Modal Excel Import
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [fileExcel, setFileExcel] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};
	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) setFileExcel(droppedFile);
			else alert("Hanya file Excel yang diizinkan!");
		}
	};

	const handleDownloadTemplate = () => {
		const templateData = [
			{ Kode_Mapel: "TKA-KTI", Nama_Mapel: "Karya Tulis Ilmiah" },
			{ Kode_Mapel: "TKA-PSOS", Nama_Mapel: "Proyek Sosial" },
		];
		const fileName = "Template_Import_Mapel_TKA.xlsx";
		const worksheet = XLSX.utils.json_to_sheet(templateData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Mapel_TKA");
		XLSX.writeFile(workbook, fileName);
	};

	const handleUploadExcel = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!fileExcel) return;

		setLoading(true);
		const formData = new FormData();
		formData.append("file", fileExcel);

		const res = await importMapelTkaMassalAction(formData, tahunAjaran.id);
		alert(res.message);
		if (res.success) {
			setIsUploadModalOpen(false);
			setFileExcel(null);
		}
		setLoading(false);
	};

	const handleSaveMapel = async () => {
		if (!mapelForm.kode || !mapelForm.nama) return;
		setLoading(true);
		let res;
		if (mapelForm.id) {
			res = await editMapelTkaAction(mapelForm.id, mapelForm.kode, mapelForm.nama, tahunAjaran.id);
		} else {
			res = await buatMapelTkaAction(mapelForm.kode, mapelForm.nama, tahunAjaran.id);
		}
		if (res.success) {
			setIsMapelModalOpen(false);
		} else {
			alert(res.message);
		}
		setLoading(false);
	};

	const handleDeleteMapel = async (id: string) => {
		if (confirm("Hapus mapel pilihan TKA ini?")) {
			setLoading(true);
			await hapusMapelTkaAction(id, tahunAjaran.id);
			setLoading(false);
		}
	};

	// ========================
	// STATE: ROMBEL
	// ========================
	const [isRombelModalOpen, setIsRombelModalOpen] = useState(false);
	const [newRombelName, setNewRombelName] = useState("");
	
	const [isSiswaModalOpen, setIsSiswaModalOpen] = useState(false);
	const [selectedRombel, setSelectedRombel] = useState<any>(null);
	const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
	const [searchSiswa, setSearchSiswa] = useState("");
	const [filterKelasSiswa, setFilterKelasSiswa] = useState("");
	const listKelasUnik = Array.from(new Set(siswaReguler.map((s) => s.kelasAsal))).sort();

	const handleBuatRombel = async () => {
		if (!newRombelName) return;
		setLoading(true);
		const res = await buatRombelAction(newRombelName, tahunAjaran.id);
		if (res.success) {
			setIsRombelModalOpen(false);
			setNewRombelName("");
		} else alert(res.message);
		setLoading(false);
	};

	const handleHapusRombel = async (kelasId: string) => {
		if (confirm("Hapus Rombel TKA ini? Seluruh data riwayat di dalamnya akan ikut terhapus.")) {
			setLoading(true);
			await hapusRombelAction(kelasId, tahunAjaran.id);
			setLoading(false);
		}
	};

	const openSiswaModal = (rombel: any) => {
		setSelectedRombel(rombel);
		setSelectedSiswaIds(rombel.riwayatSiswa.map((r: any) => r.siswaId));
		setIsSiswaModalOpen(true);
	};

	const handleSaveSiswa = async () => {
		if (!selectedRombel) return;
		setLoading(true);
		const res = await updateSiswaRombelAction(selectedRombel.id, selectedSiswaIds, tahunAjaran.id);
		if (res.success) setIsSiswaModalOpen(false);
		else alert(res.message);
		setLoading(false);
	};

	// ========================
	// STATE: PENUGASAN MULTI-GURU
	// ========================
	const [isTugasModalOpen, setIsTugasModalOpen] = useState(false);
	const [selectedMapelId, setSelectedMapelId] = useState("");
	const [selectedGuruIds, setSelectedGuruIds] = useState<string[]>([]);

	const openTugasModal = (mapel: any) => {
		setSelectedMapelId(mapel.id);
		const existingGurus = timFasilitatorList
			.filter((t: any) => t.mapelId === mapel.id)
			.map((t: any) => t.guruId);
		setSelectedGuruIds(existingGurus);
		setIsTugasModalOpen(true);
	};

	const handleSavePenugasan = async () => {
		if (!selectedMapelId) return;
		setLoading(true);
		const res = await setTimFasilitatorMapelAction(selectedMapelId, selectedGuruIds, tahunAjaran.id);
		if (res.success) setIsTugasModalOpen(false);
		else alert(res.message);
		setLoading(false);
	};

	// ========================
	// STATE: TAB JADWAL (MAPEL KE ROMBEL)
	// ========================
	const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
	const [selectedMapelIdsJadwal, setSelectedMapelIdsJadwal] = useState<string[]>([]);

	const openJadwalModal = (rombel: any) => {
		setSelectedRombel(rombel);
		// Cari mapel apa saja yang diambil rombel ini (dari jadwalPelajaran)
		const mapelIds = rombel.jadwalPelajaran.map((j: any) => j.mapelId);
		// filter unik
		const uniqueMapels = Array.from(new Set(mapelIds)) as string[];
		setSelectedMapelIdsJadwal(uniqueMapels);
		setIsJadwalModalOpen(true);
	};

	const handleSaveJadwal = async () => {
		if (!selectedRombel) return;
		setLoading(true);
		const res = await setMapelRombelAction(selectedRombel.id, selectedMapelIdsJadwal, tahunAjaran.id);
		if (res.success) setIsJadwalModalOpen(false);
		else alert(res.message);
		setLoading(false);
	};


	// ========================
	// RENDERERS
	// ========================
	return (
		<div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
			<div style={{ marginBottom: "2rem", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
				<button 
					onClick={() => window.location.href = "/admin/tka"}
					style={{ padding: "0.5rem", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "0.375rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
					title="Kembali"
				>
					<ArrowLeft size={20} color="#475569" />
				</button>
				<div>
					<h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: 0, color: "#1e293b" }}>
						Manajemen TKA
					</h1>
					<p style={{ margin: "4px 0 0 0", color: "#64748b" }}>
						Tahun Ajaran {tahunAjaran.nama}
					</p>
				</div>
			</div>

			{/* TABS */}
			<div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "2rem" }}>
				<button
					onClick={() => setActiveTab("mapel")}
					style={{
						padding: "1rem 2rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: 600,
						borderBottom: activeTab === "mapel" ? "3px solid #2563eb" : "3px solid transparent",
						color: activeTab === "mapel" ? "#2563eb" : "#64748b"
					}}
				>
					1. Mata Pelajaran TKA
				</button>
				<button
					onClick={() => setActiveTab("rombel")}
					style={{
						padding: "1rem 2rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: 600,
						borderBottom: activeTab === "rombel" ? "3px solid #2563eb" : "3px solid transparent",
						color: activeTab === "rombel" ? "#2563eb" : "#64748b"
					}}
				>
					2. Rombongan Belajar
				</button>
				<button
					onClick={() => setActiveTab("penugasan")}
					style={{
						padding: "1rem 2rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: 600,
						borderBottom: activeTab === "penugasan" ? "3px solid #2563eb" : "3px solid transparent",
						color: activeTab === "penugasan" ? "#2563eb" : "#64748b"
					}}
				>
					3. Tim Fasilitator TKA
				</button>
				<button
					onClick={() => setActiveTab("jadwal")}
					style={{
						padding: "1rem 2rem", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", fontWeight: 600,
						borderBottom: activeTab === "jadwal" ? "3px solid #2563eb" : "3px solid transparent",
						color: activeTab === "jadwal" ? "#2563eb" : "#64748b"
					}}
				>
					4. Jadwal Mapel Rombel
				</button>
			</div>

			{/* TAB ISI */}
			{activeTab === "mapel" && (
				<div>
					<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
						<h2 style={{ fontSize: "1.25rem", margin: 0 }}>Daftar Mapel Pilihan TKA</h2>
						<div style={{ display: "flex", gap: "0.5rem" }}>
							<button
								onClick={() => setIsUploadModalOpen(true)}
								style={{ padding: "0.5rem 1rem", background: "#f1f5f9", color: "#334155", border: "1px solid #cbd5e1", borderRadius: "0.375rem", cursor: "pointer", display: "flex", gap: "0.5rem", alignItems: "center" }}
							>
								<BookOpen size={16} /> Import Excel
							</button>
							<button
								onClick={() => { setMapelForm({ id: "", kode: "", nama: "" }); setIsMapelModalOpen(true); }}
								style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", display: "flex", gap: "0.5rem", alignItems: "center" }}
							>
								<Plus size={16} /> Tambah Mapel TKA
							</button>
						</div>
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
						{mapelTkaList.map(m => (
							<div key={m.id} style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "0.5rem", background: "#f8fafc" }}>
								<div style={{ display: "flex", justifyContent: "space-between" }}>
									<div>
										<span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", fontSize: "0.75rem", fontWeight: "bold" }}>{m.kode}</span>
										<h3 style={{ margin: "0.5rem 0 0 0", fontSize: "1.125rem" }}>{m.nama}</h3>
									</div>
									<div style={{ display: "flex", gap: "0.5rem" }}>
										<button onClick={() => { setMapelForm(m); setIsMapelModalOpen(true); }} style={{ background: "none", border: "none", color: "#3b82f6", cursor: "pointer" }}><Edit2 size={16} /></button>
										<button onClick={() => handleDeleteMapel(m.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={16} /></button>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{activeTab === "rombel" && (
				<div>
					<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
						<h2 style={{ fontSize: "1.25rem", margin: 0 }}>Daftar Rombongan Belajar TKA</h2>
						<button
							onClick={() => setIsRombelModalOpen(true)}
							style={{ padding: "0.5rem 1rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", display: "flex", gap: "0.5rem", alignItems: "center" }}
						>
							<Plus size={16} /> Buat Rombel Baru
						</button>
					</div>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
						{rombelList.map(r => (
							<div key={r.id} style={{ border: "1px solid #e2e8f0", padding: "1.5rem", borderRadius: "0.5rem", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
									<h3 style={{ margin: 0, fontSize: "1.25rem" }}>{r.nama}</h3>
									<button onClick={() => handleHapusRombel(r.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={18} /></button>
								</div>
								<p style={{ margin: "0 0 1.5rem 0", color: "#64748b" }}>
									Anggota: <strong>{r.riwayatSiswa.length} Siswa</strong>
								</p>
								<button
									onClick={() => openSiswaModal(r)}
									style={{ width: "100%", padding: "0.5rem", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "0.375rem", cursor: "pointer", display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center" }}
								>
									<Users size={16} /> Kelola Anggota Siswa
								</button>
							</div>
						))}
					</div>
				</div>
			)}

			{activeTab === "penugasan" && (
				<div>
					<h2 style={{ fontSize: "1.25rem", margin: "0 0 1.5rem 0" }}>Tim Fasilitator TKA (Team Teaching)</h2>
					<p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
						Tentukan Tim Guru (Fasilitator) yang memegang masing-masing Mapel Pilihan TKA di tahun ajaran ini. Tim ini bersifat global dan akan langsung ter-assign ke rombel mana pun yang nantinya dijadwalkan mengambil mapel ini.
					</p>
					<div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "0.5rem", padding: "1.5rem" }}>
						{mapelTkaList.length === 0 ? (
							<p style={{ margin: 0, color: "#94a3b8" }}>Belum ada Mapel Pilihan TKA yang terdaftar.</p>
						) : (
							<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
								<thead>
									<tr>
										<th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>Mapel Pilihan</th>
										<th style={{ textAlign: "left", padding: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>Tim Fasilitator</th>
										<th style={{ textAlign: "right", padding: "0.75rem", borderBottom: "1px solid #e2e8f0" }}>Aksi</th>
									</tr>
								</thead>
								<tbody>
									{mapelTkaList.map(m => {
										// Cari guru yang bertugas di mapel ini dari TimFasilitatorTka
										const timMapelIni = timFasilitatorList.filter((t: any) => t.mapelId === m.id);
										return (
											<tr key={m.id}>
												<td style={{ padding: "1rem 0.75rem", borderBottom: "1px dashed #e2e8f0" }}>
													<strong style={{ display: "block" }}>{m.nama}</strong>
													<span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{m.kode}</span>
												</td>
												<td style={{ padding: "1rem 0.75rem", borderBottom: "1px dashed #e2e8f0" }}>
													{timMapelIni.length === 0 ? (
														<span style={{ color: "#ef4444", fontSize: "0.8rem", background: "#fee2e2", padding: "0.2rem 0.5rem", borderRadius: "1rem" }}>Belum ada tim</span>
													) : (
														<div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
															{timMapelIni.map((t: any) => (
																<span key={t.id} style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #a7f3d0", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
																	<CheckCircle2 size={12} /> {t.guru.user.nama}
																</span>
															))}
														</div>
													)}
												</td>
												<td style={{ padding: "1rem 0.75rem", borderBottom: "1px dashed #e2e8f0", textAlign: "right" }}>
													<button 
														onClick={() => openTugasModal(m)}
														style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: "0.375rem", padding: "0.4rem 0.75rem", cursor: "pointer", fontSize: "0.75rem" }}
													>
														Set Tim
													</button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						)}
					</div>
				</div>
			)}

			{activeTab === "jadwal" && (
				<div>
					<h2 style={{ fontSize: "1.25rem", margin: "0 0 1.5rem 0" }}>Jadwal Mapel TKA per Rombel</h2>
					<p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
						Tentukan Mata Pelajaran Pilihan TKA apa saja yang diambil oleh masing-masing Rombongan Belajar. 
						Setelah ditugaskan, guru (tim) akan mendapatkan rombel ini di jurnal dan presensi mereka.
					</p>
					
					<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1rem" }}>
						{rombelList.map(r => {
							// Filter unik jadwal mapel
							const uniqueJadwalMapels = [];
							const mapelSet = new Set();
							for (const j of r.jadwalPelajaran) {
								if (!mapelSet.has(j.mapelId)) {
									mapelSet.add(j.mapelId);
									uniqueJadwalMapels.push(j.mapel);
								}
							}

							return (
								<div key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: "0.5rem", background: "#fff", overflow: "hidden" }}>
									<div style={{ padding: "1rem", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
										<h3 style={{ margin: 0, fontSize: "1.125rem" }}>{r.nama}</h3>
										<button 
											onClick={() => openJadwalModal(r)}
											style={{ padding: "0.4rem 0.75rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontSize: "0.75rem" }}
										>
											Atur Mapel
										</button>
									</div>
									<div style={{ padding: "1rem" }}>
										{uniqueJadwalMapels.length === 0 ? (
											<p style={{ margin: 0, color: "#94a3b8", fontSize: "0.875rem", fontStyle: "italic" }}>Belum ada mapel pilihan yang diambil.</p>
										) : (
											<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
												{uniqueJadwalMapels.map((m: any) => {
													const timGuru = timFasilitatorList.filter((t: any) => t.mapelId === m.id);
													return (
														<div key={m.id} style={{ borderLeft: "3px solid #3b82f6", paddingLeft: "0.75rem" }}>
															<div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{m.nama}</div>
															<div style={{ color: "#64748b", fontSize: "0.75rem", marginTop: "0.25rem" }}>
																Tim: {timGuru.length > 0 ? timGuru.map((t: any) => t.guru.user.nama).join(", ") : "Belum diatur"}
															</div>
														</div>
													);
												})}
											</div>
										)}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* MODALS */}
			{/* Modal Mapel TKA */}
			{isMapelModalOpen && (
				<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
					<div style={{ background: "#fff", padding: "2rem", borderRadius: "0.5rem", width: "400px" }}>
						<h3 style={{ marginTop: 0 }}>{mapelForm.id ? "Edit" : "Tambah"} Mapel Pilihan TKA</h3>
						<label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Kode Mapel (Cth: TKA-KTI)</label>
						<input type="text" value={mapelForm.kode} onChange={(e) => setMapelForm({ ...mapelForm, kode: e.target.value })} style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }} />
						<label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem" }}>Nama Mapel</label>
						<input type="text" value={mapelForm.nama} onChange={(e) => setMapelForm({ ...mapelForm, nama: e.target.value })} style={{ width: "100%", padding: "0.5rem", marginBottom: "1.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }} />
						<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
							<button onClick={() => setIsMapelModalOpen(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Batal</button>
							<button onClick={handleSaveMapel} disabled={loading} style={{ padding: "0.5rem 1rem", border: "none", background: "#2563eb", color: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Simpan</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Buat Rombel */}
			{isRombelModalOpen && (
				<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
					<div style={{ background: "#fff", padding: "2rem", borderRadius: "0.5rem", width: "400px" }}>
						<h3 style={{ marginTop: 0 }}>Buat Rombel TKA Baru</h3>
						<input
							type="text"
							value={newRombelName}
							onChange={(e) => setNewRombelName(e.target.value)}
							placeholder="Cth: TKA - Rombel 1"
							style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
						/>
						<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
							<button onClick={() => setIsRombelModalOpen(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Batal</button>
							<button onClick={handleBuatRombel} disabled={loading} style={{ padding: "0.5rem 1rem", border: "none", background: "#2563eb", color: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Simpan</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Kelola Siswa */}
			{isSiswaModalOpen && selectedRombel && (
				<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
					<div style={{ background: "#fff", padding: "2rem", borderRadius: "0.5rem", width: "700px", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
							<h3 style={{ margin: 0 }}>Kelola Siswa: {selectedRombel.nama}</h3>
							<span style={{ background: "#dbeafe", color: "#1d4ed8", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.875rem", fontWeight: "bold" }}>
								Terpilih: {selectedSiswaIds.length}
							</span>
						</div>
						
						<div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
							<div style={{ flex: 1, position: "relative" }}>
								<Search size={16} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
								<input
									type="text"
									placeholder="Cari nama atau NIS..."
									value={searchSiswa}
									onChange={(e) => setSearchSiswa(e.target.value)}
									style={{ width: "100%", padding: "0.5rem 0.5rem 0.5rem 2.25rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
								/>
							</div>
							<select
								value={filterKelasSiswa}
								onChange={(e) => setFilterKelasSiswa(e.target.value)}
								style={{ padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #cbd5e1" }}
							>
								<option value="">Semua Kelas</option>
								{listKelasUnik.map((k) => (
									<option key={k} value={k}>{k}</option>
								))}
							</select>
						</div>

						<div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "0.375rem" }}>
							<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
								<thead style={{ position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 1 }}>
									<tr>
										<th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", width: "40px", textAlign: "center" }}>Pilih</th>
										<th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>NIS</th>
										<th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>Nama Siswa</th>
										<th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>Kelas Asal</th>
									</tr>
								</thead>
								<tbody>
									{siswaReguler.filter(s => {
										const matchName = s.nama.toLowerCase().includes(searchSiswa.toLowerCase()) || s.nis.includes(searchSiswa);
										const matchKelas = filterKelasSiswa ? s.kelasAsal === filterKelasSiswa : true;
										return matchName && matchKelas;
									}).map((s) => {
										const isSelected = selectedSiswaIds.includes(s.id);
										return (
											<tr key={s.id} onClick={() => setSelectedSiswaIds(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])} style={{ cursor: "pointer", backgroundColor: isSelected ? "#eff6ff" : "#fff", borderBottom: "1px solid #e2e8f0" }}>
												<td style={{ padding: "0.75rem", textAlign: "center" }}>
													{isSelected ? <CheckSquare size={16} color="#2563eb" /> : <Square size={16} color="#94a3b8" />}
												</td>
												<td style={{ padding: "0.75rem" }}>{s.nis}</td>
												<td style={{ padding: "0.75rem" }}>{s.nama}</td>
												<td style={{ padding: "0.75rem" }}>{s.kelasAsal}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
							<button onClick={() => setIsSiswaModalOpen(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Batal</button>
							<button onClick={handleSaveSiswa} disabled={loading} style={{ padding: "0.5rem 1rem", border: "none", background: "#2563eb", color: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Simpan Anggota</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Set Multi Fasilitator */}
			{isTugasModalOpen && (
				<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
					<div style={{ background: "#fff", padding: "2rem", borderRadius: "0.5rem", width: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
						<h3 style={{ margin: "0 0 0.5rem 0" }}>Tugaskan Tim Fasilitator</h3>
						<p style={{ margin: "0 0 1.5rem 0", color: "#64748b", fontSize: "0.875rem" }}>
							Mapel Pilihan: <strong>{mapelTkaList.find(m => m.id === selectedMapelId)?.nama}</strong>
						</p>

						<div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "0.375rem" }}>
							<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
								<thead style={{ position: "sticky", top: 0, backgroundColor: "#f8fafc", zIndex: 1 }}>
									<tr>
										<th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", width: "40px", textAlign: "center" }}>Pilih</th>
										<th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>Nama Guru</th>
										<th style={{ padding: "0.75rem", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>NPP</th>
									</tr>
								</thead>
								<tbody>
									{guruList.map((g) => {
										const isSelected = selectedGuruIds.includes(g.id);
										return (
											<tr key={g.id} onClick={() => setSelectedGuruIds(prev => prev.includes(g.id) ? prev.filter(i => i !== g.id) : [...prev, g.id])} style={{ cursor: "pointer", backgroundColor: isSelected ? "#ecfdf5" : "#fff", borderBottom: "1px solid #e2e8f0" }}>
												<td style={{ padding: "0.75rem", textAlign: "center" }}>
													{isSelected ? <CheckSquare size={16} color="#059669" /> : <Square size={16} color="#94a3b8" />}
												</td>
												<td style={{ padding: "0.75rem" }}>{g.nama}</td>
												<td style={{ padding: "0.75rem", color: "#64748b" }}>{g.npp}</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>

						<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
							<button onClick={() => setIsTugasModalOpen(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Batal</button>
							<button onClick={handleSavePenugasan} disabled={loading} style={{ padding: "0.5rem 1rem", border: "none", background: "#2563eb", color: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Simpan Penugasan</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Jadwal Mapel Rombel */}
			{isJadwalModalOpen && selectedRombel && (
				<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
					<div style={{ background: "#fff", padding: "2rem", borderRadius: "0.5rem", width: "500px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
						<h3 style={{ margin: "0 0 0.5rem 0" }}>Atur Mata Pelajaran Rombel</h3>
						<p style={{ margin: "0 0 1.5rem 0", color: "#64748b", fontSize: "0.875rem" }}>
							Pilih Mapel Pilihan TKA apa saja yang diambil oleh rombel <strong>{selectedRombel.nama}</strong>.
						</p>

						<div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "0.375rem", padding: "1rem" }}>
							{mapelTkaList.map((m) => {
								const isSelected = selectedMapelIdsJadwal.includes(m.id);
								return (
									<label key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "1rem", cursor: "pointer" }}>
										<input
											type="checkbox"
											checked={isSelected}
											onChange={() => {
												if (isSelected) setSelectedMapelIdsJadwal(prev => prev.filter(id => id !== m.id));
												else setSelectedMapelIdsJadwal(prev => [...prev, m.id]);
											}}
											style={{ marginTop: "0.25rem", width: "16px", height: "16px" }}
										/>
										<div>
											<div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{m.nama}</div>
											<div style={{ color: "#64748b", fontSize: "0.75rem" }}>{m.kode}</div>
										</div>
									</label>
								);
							})}
							{mapelTkaList.length === 0 && <p style={{ margin: 0, fontSize: "0.875rem", color: "#94a3b8" }}>Belum ada Mapel TKA.</p>}
						</div>

						<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
							<button onClick={() => setIsJadwalModalOpen(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Batal</button>
							<button onClick={handleSaveJadwal} disabled={loading} style={{ padding: "0.5rem 1rem", border: "none", background: "#2563eb", color: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Simpan Jadwal</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Import Excel */}
			{isUploadModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>Import Mapel Massal</h2>
							<button
								onClick={() => {
									setIsUploadModalOpen(false);
									setFileExcel(null);
								}}
								className={styles.closeBtn}
							>
								<X size={20} />
							</button>
						</div>
						<form onSubmit={handleUploadExcel}>
							<div className={styles.modalBody}>
								<div
									style={{
										padding: "1rem",
										backgroundColor: "#f0fdf4",
										borderRadius: "0.5rem",
										marginBottom: "1.5rem",
										border: "1px solid #bbf7d0",
									}}
								>
									<h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#166534", marginBottom: "0.5rem" }}>
										Langkah-langkah:
									</h3>
									<ol
										style={{
											fontSize: "0.875rem",
											color: "#15803d",
											paddingLeft: "1.2rem",
											margin: 0,
											lineHeight: "1.5",
										}}
									>
										<li>Unduh template Excel dengan menekan tombol di bawah.</li>
										<li>Isikan data Mata Pelajaran (Kode_Mapel, Nama_Mapel).</li>
										<li>Seret atau unggah file tersebut kembali ke form ini.</li>
									</ol>
								</div>
								<div className={styles.formGroup} style={{ marginBottom: "1.5rem" }}>
									<button
										type="button"
										onClick={handleDownloadTemplate}
										className={styles.btnSecondary}
										style={{ width: "100%", justifyContent: "center" }}
									>
										⬇️ Download Template Excel (.xlsx)
									</button>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Unggah File Excel</label>
									<div
										className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop}
										onClick={() => document.getElementById("file-upload")?.click()}
									>
										<UploadCloud size={40} className={styles.dropzoneIcon} />
										{fileExcel ? (
											<div className={styles.dropzoneText}>
												File siap: <strong>{fileExcel.name}</strong>
											</div>
										) : (
											<div className={styles.dropzoneText}>
												Tarik & lepas file Excel di sini, atau <strong>klik untuk mencari file</strong>
											</div>
										)}
										<input
											id="file-upload"
											type="file"
											accept=".xlsx, .xls"
											onChange={(e) => setFileExcel(e.target.files ? e.target.files[0] : null)}
											style={{ display: "none" }}
										/>
									</div>
								</div>
							</div>
							<div className={styles.modalFooter}>
								<button
									type="button"
									disabled={loading}
									onClick={() => {
										setIsUploadModalOpen(false);
										setFileExcel(null);
									}}
									className={styles.btnCancel}
								>
									Batal
								</button>
								<button type="submit" disabled={loading || !fileExcel} className={styles.btnPrimary}>
									{loading ? "Memproses..." : "Upload & Proses"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
