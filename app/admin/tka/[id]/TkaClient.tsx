"use client";

import { useState, useRef } from "react";
import { Plus, Search, Trash2, Edit2, Users, BookOpen, UserPlus, CheckSquare, Square, CheckCircle2, ArrowLeft, UploadCloud, X, MapPin } from "lucide-react";
import * as XLSX from "xlsx";
import styles from "../../master/adminMaster.module.css";
import { 
	buatMapelTkaAction, editMapelTkaAction, hapusMapelTkaAction, importMapelTkaMassalAction,
	buatRombelAction, hapusRombelAction, updateSiswaRombelAction, updateTempatRombelAction,
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
	const [rombelNama, setRombelNama] = useState("");
	
	const [isSiswaModalOpen, setIsSiswaModalOpen] = useState(false);
	const [activeRombel, setActiveRombel] = useState<any>(null);
	const [siswaSearch, setSiswaSearch] = useState("");
	const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);
	
	const [isTempatModalOpen, setIsTempatModalOpen] = useState(false);
	const [activeRombelForTempat, setActiveRombelForTempat] = useState<any>(null);
	const [inputTempat, setInputTempat] = useState("");
	const [searchSiswa, setSearchSiswa] = useState("");
	const [filterKelasSiswa, setFilterKelasSiswa] = useState("");
	const listKelasUnik = Array.from(new Set(siswaReguler.map((s) => s.kelasAsal))).sort();

	const handleBuatRombel = async () => {
		if (!rombelNama) return;
		setLoading(true);
		const res = await buatRombelAction(rombelNama, tahunAjaran.id);
		if (res.success) {
			setIsRombelModalOpen(false);
			setRombelNama("");
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
		setActiveRombel(rombel);
		setSelectedSiswaIds(rombel.riwayatSiswa.map((r: any) => r.siswaId));
		setIsSiswaModalOpen(true);
	};

	const handleSimpanSiswaRombel = async () => {
		if (!activeRombel) return;
		setLoading(true);
		const res = await updateSiswaRombelAction(activeRombel.id, selectedSiswaIds, tahunAjaran.id);
		if (res.success) {
			alert(res.message);
			setIsSiswaModalOpen(false);
		} else {
			alert(res.message);
		}
		setLoading(false);
	};

	const openTempatModal = (rombel: any) => {
		setActiveRombelForTempat(rombel);
		setInputTempat(rombel.tempat || "");
		setIsTempatModalOpen(true);
	};

	const handleSimpanTempatRombel = async () => {
		if (!activeRombelForTempat) return;
		setLoading(true);
		const res = await updateTempatRombelAction(activeRombelForTempat.id, inputTempat, tahunAjaran.id);
		if (res.success) {
			alert(res.message);
			setIsTempatModalOpen(false);
		} else {
			alert(res.message);
		}
		setLoading(false);
	};

	// ========================
	// STATE: PENUGASAN MULTI-GURU
	// ========================
	const [isTimModalOpen, setIsTimModalOpen] = useState(false);
	const [activeMapelForTim, setActiveMapelForTim] = useState<any>(null);
	const [selectedGuruIds, setSelectedGuruIds] = useState<string[]>([]);

	const openTugasModal = (mapel: any) => {
		setActiveMapelForTim(mapel);
		const existingGurus = timFasilitatorList
			.filter((t: any) => t.mapelId === mapel.id)
			.map((t: any) => t.guruId);
		setSelectedGuruIds(existingGurus);
		setIsTimModalOpen(true);
	};

	const handleSavePenugasan = async () => {
		if (!activeMapelForTim) return;
		setLoading(true);
		const res = await setTimFasilitatorMapelAction(activeMapelForTim.id, selectedGuruIds, tahunAjaran.id);
		if (res.success) setIsTimModalOpen(false);
		else alert(res.message);
		setLoading(false);
	};

	// ========================
	// STATE: TAB JADWAL (MAPEL KE ROMBEL)
	// ========================
	const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
	const [selectedMapelIdsJadwal, setSelectedMapelIdsJadwal] = useState<string[]>([]);
	
	// State Sub-Modal Jadwal per Mapel
	const [mapelSchedules, setMapelSchedules] = useState<{ mapelId: string, schedules: { hari: number, jam: string }[] }[]>([]);
	const [isSubModalJadwalOpen, setIsSubModalJadwalOpen] = useState(false);
	const [activeMapelForJadwal, setActiveMapelForJadwal] = useState<any>(null);
	const [tempMapelSchedules, setTempMapelSchedules] = useState<Record<string, string[]>>({});
	const [activeHariTab, setActiveHariTab] = useState<string>("Senin");
	
	const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
	const mapHariToInt: Record<string, number> = { "Senin": 1, "Selasa": 2, "Rabu": 3, "Kamis": 4, "Jumat": 5, "Sabtu": 6 };
	const SLOT_WAKTU = ["1", "2", "3", "4", "5", "6"];

	const openJadwalModal = (rombel: any) => {
		setActiveRombel(rombel);
		const mapelIds = rombel.jadwalPelajaran.map((j: any) => j.mapelId);
		const uniqueMapels = Array.from(new Set(mapelIds)) as string[];
		setSelectedMapelIdsJadwal(uniqueMapels);
		
		// Reconstruct mapelSchedules from existing jadwalPelajaran
		const initialSchedules: any[] = [];
		uniqueMapels.forEach(mId => {
			const jPelajaran = rombel.jadwalPelajaran.filter((j: any) => j.mapelId === mId && j.hari !== 0);
			if (jPelajaran.length > 0) {
				const schedules = jPelajaran.map((j: any) => ({ hari: j.hari, jam: j.waktuMulai }));
				// Remove duplicates because of multiple gurus
				const uniqueSchedules = schedules.filter((v: any, i: number, a: any) => a.findIndex((t: any) => (t.hari === v.hari && t.jam === v.jam)) === i);
				initialSchedules.push({ mapelId: mId, schedules: uniqueSchedules });
			}
		});
		setMapelSchedules(initialSchedules);
		
		setIsJadwalModalOpen(true);
	};

	const handleSaveJadwal = async () => {
		if (!activeRombel) return;
		setLoading(true);
		// Hanya pass jadwal untuk mapel yang saat ini terpilih
		const filteredSchedules = mapelSchedules.filter(ms => selectedMapelIdsJadwal.includes(ms.mapelId));
		const res = await setMapelRombelAction(activeRombel.id, selectedMapelIdsJadwal, tahunAjaran.id, filteredSchedules);
		if (res.success) setIsJadwalModalOpen(false);
		else alert(res.message);
		setLoading(false);
	};
	
	const openSubModalJadwal = (mapel: any) => {
		setActiveMapelForJadwal(mapel);
		
		const existing = mapelSchedules.find(m => m.mapelId === mapel.id)?.schedules || [];
		const temp: Record<string, string[]> = { "Senin": [], "Selasa": [], "Rabu": [], "Kamis": [], "Jumat": [] };
		existing.forEach(sched => {
			const hariString = Object.keys(mapHariToInt).find(k => mapHariToInt[k] === sched.hari);
			if (hariString && temp[hariString]) {
				temp[hariString].push(sched.jam);
			}
		});
		setTempMapelSchedules(temp);
		setActiveHariTab("Senin");
		
		setIsSubModalJadwalOpen(true);
	};
	
	const handleSimpanSubModalJadwal = () => {
		if (!activeMapelForJadwal) return;
		
		const newSchedules: any[] = [];
		Object.keys(tempMapelSchedules).forEach(hariString => {
			tempMapelSchedules[hariString].forEach(jamString => {
				newSchedules.push({
					hari: mapHariToInt[hariString],
					jam: jamString
				});
			});
		});
		
		setMapelSchedules(prev => {
			const clone = [...prev];
			const existingIndex = clone.findIndex(p => p.mapelId === activeMapelForJadwal.id);
			if (existingIndex >= 0) {
				clone[existingIndex] = { ...clone[existingIndex], schedules: newSchedules };
			} else {
				clone.push({ mapelId: activeMapelForJadwal.id, schedules: newSchedules });
			}
			return clone;
		});
		
		setIsSubModalJadwalOpen(false);
	};
	
	const handleHapusSchedulesMapel = (mapelId: string) => {
		setMapelSchedules(prev => prev.filter(p => p.mapelId !== mapelId));
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
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
									<h3 style={{ margin: 0, fontSize: "1.25rem" }}>{r.nama}</h3>
									<button onClick={() => handleHapusRombel(r.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={18} /></button>
								</div>
								
								<div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#475569", marginBottom: "1rem", fontSize: "0.9rem" }}>
									<MapPin size={14} /> 
									<span>{r.tempat || "Tempat belum diatur"}</span>
								</div>

								<p style={{ margin: "0 0 1.5rem 0", color: "#64748b" }}>
									Anggota: <strong>{r.riwayatSiswa.length} Siswa</strong>
								</p>
								<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
									<button
										onClick={() => openSiswaModal(r)}
										style={{ width: "100%", padding: "0.5rem", background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", borderRadius: "0.375rem", cursor: "pointer", display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center" }}
									>
										<Users size={16} /> Kelola Anggota Siswa
									</button>
									<button
										onClick={() => openTempatModal(r)}
										style={{ width: "100%", padding: "0.5rem", background: "#f8fafc", color: "#475569", border: "1px solid #e2e8f0", borderRadius: "0.375rem", cursor: "pointer", display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center" }}
									>
										<MapPin size={16} /> Atur Tempat Kelas
									</button>
								</div>
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
							value={rombelNama}
							onChange={(e) => setRombelNama(e.target.value)}
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
			{isSiswaModalOpen && activeRombel && (
				<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
					<div style={{ background: "#fff", padding: "2rem", borderRadius: "0.5rem", width: "700px", maxWidth: "90vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
						<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
							<h3 style={{ margin: 0 }}>Kelola Siswa: {activeRombel.nama}</h3>
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
							<button onClick={handleSimpanSiswaRombel} disabled={loading} style={{ padding: "0.5rem 1rem", border: "none", background: "#2563eb", color: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Simpan Anggota</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Tempat Kelas */}
			{isTempatModalOpen && activeRombelForTempat && (
				<div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
					<div style={{ background: "#fff", padding: "1.5rem", borderRadius: "0.5rem", width: "400px", maxWidth: "90%" }}>
						<h3 style={{ margin: "0 0 1rem 0" }}>Atur Tempat Kelas {activeRombelForTempat.nama}</h3>
						<input
							type="text"
							value={inputTempat}
							onChange={(e) => setInputTempat(e.target.value)}
							placeholder="Masukkan nama ruangan (Misal: Ruang Lab 1)"
							style={{ width: "100%", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "0.375rem", marginBottom: "1rem" }}
						/>
						<div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
							<button onClick={() => setIsTempatModalOpen(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #ccc", background: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Batal</button>
							<button onClick={handleSimpanTempatRombel} disabled={loading} style={{ padding: "0.5rem 1rem", border: "none", background: "#2563eb", color: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>
								{loading ? "Menyimpan..." : "Simpan Tempat"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Modal Assign Tim Fasilitator ke Mapel */}
			{isTimModalOpen && activeMapelForTim && (
				<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
					<div style={{ background: "#fff", padding: "2rem", borderRadius: "0.5rem", width: "600px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
						<h3 style={{ margin: "0 0 0.5rem 0" }}>Tugaskan Tim Fasilitator</h3>
						<p style={{ margin: "0 0 1.5rem 0", color: "#64748b", fontSize: "0.875rem" }}>
							Mapel Pilihan: <strong>{activeMapelForTim.nama}</strong>
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
			{isJadwalModalOpen && activeRombel && (
				<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 100 }}>
					<div style={{ background: "#fff", padding: "2rem", borderRadius: "0.5rem", width: "500px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
						<h3 style={{ margin: "0 0 0.5rem 0" }}>Atur Mata Pelajaran Rombel</h3>
						<p style={{ margin: "0 0 1.5rem 0", color: "#64748b", fontSize: "0.875rem" }}>
							Pilih Mapel Pilihan TKA apa saja yang diambil oleh rombel <strong>{activeRombel.nama}</strong>.
						</p>

						<div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "0.375rem", padding: "1rem" }}>
							{mapelTkaList.map((m) => {
								const isSelected = selectedMapelIdsJadwal.includes(m.id);
								const currentSchedules = mapelSchedules.find(ms => ms.mapelId === m.id)?.schedules || [];
								return (
									<div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid #f1f5f9" }}>
										<label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", flex: 1 }}>
											<input
												type="checkbox"
												checked={isSelected}
												onChange={(e) => {
													if (e.target.checked) setSelectedMapelIdsJadwal(prev => [...prev, m.id]);
													else {
														setSelectedMapelIdsJadwal(prev => prev.filter(id => id !== m.id));
														handleHapusSchedulesMapel(m.id);
													}
												}}
												style={{ transform: "scale(1.2)" }}
											/>
											<div>
												<div style={{ fontWeight: 600 }}>{m.nama}</div>
												<div style={{ color: "#64748b", fontSize: "0.875rem" }}>{m.kode}</div>
												
												{isSelected && currentSchedules.length > 0 && (
													<div style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#16a34a", background: "#dcfce7", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", display: "inline-block" }}>
														{currentSchedules.length} Slot Jadwal Diatur
													</div>
												)}
											</div>
										</label>
										<button 
											onClick={() => openSubModalJadwal(m)}
											disabled={!isSelected}
											style={{ 
												padding: "0.4rem 0.75rem", 
												border: `1px solid ${isSelected ? "#3b82f6" : "#cbd5e1"}`, 
												background: isSelected ? "#eff6ff" : "#f8fafc", 
												color: isSelected ? "#1d4ed8" : "#94a3b8", 
												borderRadius: "0.375rem", 
												cursor: isSelected ? "pointer" : "not-allowed",
												fontSize: "0.875rem",
												display: "flex",
												alignItems: "center",
												gap: "0.25rem"
											}}
										>
											<BookOpen size={14} /> Atur Jadwal (Opsional)
										</button>
									</div>
								);
							})}
						</div>

						<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
							<button onClick={() => setIsJadwalModalOpen(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Batal</button>
							<button onClick={handleSaveJadwal} disabled={loading} style={{ padding: "0.5rem 1rem", border: "none", background: "#2563eb", color: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Simpan Jadwal</button>
						</div>
					</div>
				</div>
			)}
			
			{/* Sub-Modal Pengaturan Jam Ke */}
			{isSubModalJadwalOpen && activeMapelForJadwal && (
				<div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 110 }}>
					<div style={{ background: "#fff", padding: "1.5rem", borderRadius: "0.5rem", width: "500px", maxWidth: "90vh", display: "flex", flexDirection: "column" }}>
						<h3 style={{ margin: "0 0 0.5rem 0" }}>Pengaturan Waktu Mapel</h3>
						<p style={{ margin: "0 0 1rem 0", color: "#64748b", fontSize: "0.875rem" }}>
							Tentukan hari dan jam pelajaran untuk <strong>{activeMapelForJadwal.nama}</strong>. Anda bisa mengatur jadwal berbeda di setiap harinya.
						</p>
						
						<div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem", overflowX: "auto" }}>
							{HARI.map(h => {
								const hasSchedules = tempMapelSchedules[h] && tempMapelSchedules[h].length > 0;
								return (
									<button
										key={h}
										onClick={() => setActiveHariTab(h)}
										style={{
											padding: "0.4rem 0.75rem",
											border: "none",
											borderRadius: "0.375rem",
											background: activeHariTab === h ? "#eff6ff" : "transparent",
											color: activeHariTab === h ? "#2563eb" : "#64748b",
											fontWeight: activeHariTab === h ? 600 : 400,
											cursor: "pointer",
											display: "flex",
											alignItems: "center",
											gap: "0.25rem",
											whiteSpace: "nowrap"
										}}
									>
										{h}
										{hasSchedules && (
											<span style={{ background: "#dcfce7", color: "#16a34a", padding: "0.1rem 0.4rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: "bold" }}>
												{tempMapelSchedules[h].length}
											</span>
										)}
									</button>
								);
							})}
						</div>
						
						<div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "0.375rem", marginBottom: "1.5rem" }}>
							<label style={{ fontWeight: 600, marginBottom: "0.75rem", display: "block" }}>Pilih Jam Pelajaran di hari {activeHariTab}:</label>
							<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
								{SLOT_WAKTU.map(slot => {
									const isChecked = tempMapelSchedules[activeHariTab]?.includes(slot) || false;
									return (
										<label key={slot} style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", background: "#fff", padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid #e2e8f0" }}>
											<input 
												type="checkbox"
												checked={isChecked}
												onChange={(e) => {
													setTempMapelSchedules(prev => {
														const clone = { ...prev };
														if (e.target.checked) {
															clone[activeHariTab] = [...(clone[activeHariTab] || []), slot];
														} else {
															clone[activeHariTab] = (clone[activeHariTab] || []).filter(s => s !== slot);
														}
														return clone;
													});
												}}
											/>
											<span style={{ fontSize: "0.875rem" }}>Jam ke-{slot}</span>
										</label>
									);
								})}
							</div>
						</div>
						
						<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
							<button onClick={() => setIsSubModalJadwalOpen(false)} style={{ padding: "0.5rem 1rem", border: "1px solid #cbd5e1", background: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Batal</button>
							<button onClick={handleSimpanSubModalJadwal} style={{ padding: "0.5rem 1rem", border: "none", background: "#2563eb", color: "#fff", borderRadius: "0.375rem", cursor: "pointer" }}>Simpan Sesi</button>
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
