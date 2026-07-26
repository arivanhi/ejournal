"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
	Plus,
	Printer,
	Download,
	Filter,
	Calendar,
	MapPin,
	User,
	X,
	Trash2,
	ArrowLeft,
	CalendarDays,
	AlertTriangle,
	FileSpreadsheet,
	FileText,
} from "lucide-react";
import styles from "./jadwal.module.css";
import { simpanJadwalAction, hapusJadwalAction } from "./actions";
import * as XLSX from "xlsx";

interface PropJadwal {
	kelasList: { id: string; nama: string; jumlahSiswa: number; waliKelas: string }[];
	pemetaanDasar: { kelasId: string; mapelId: string; mapelNama: string; guruId: string; guruNama: string }[];
	jadwalExisting: any[];
	daftarTahunAjaran: { id: string; nama: string; isActive: boolean }[];
	tahunAjaranAktifId: string;
}

const HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

const SLOT_WAKTU = [
	{ jam: "1", label: "1" },
	{ jam: "2", label: "2" },
	{ jam: "3", label: "3" },
	{ jam: "4", label: "4" },
	{ jam: "5", label: "5" },
	{ jam: "6", label: "6" },
	{ jam: "7", label: "7" },
	{ jam: "8", label: "8" },
	{ jam: "9", label: "9" },
	{ jam: "10", label: "10" },
];

export default function JadwalClient({
	kelasList,
	pemetaanDasar,
	jadwalExisting,
	daftarTahunAjaran,
	tahunAjaranAktifId,
}: PropJadwal) {
	const router = useRouter();

	const [viewMode, setViewMode] = useState<"list" | "grid">("list");

	const [selectedKelasId, setSelectedKelasId] = useState("");
	const [activeKelasName, setActiveKelasName] = useState("");
	const [activeSiswaCount, setActiveSiswaCount] = useState(0);

	const [filterTingkat, setFilterTingkat] = useState("Semua");
	const [selectedTahunId, setSelectedTahunId] = useState(tahunAjaranAktifId);

	// State Modals
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
	const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
	const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

	const [loading, setLoading] = useState(false);
	const [deleteDataId, setDeleteDataId] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState("");

	// State Drag and Drop
	const [draggedJadwal, setDraggedJadwal] = useState<any>(null);

	// Form States
	const [formId, setFormId] = useState("");
	const [formMapel, setFormMapel] = useState("");
	const [formGuru, setFormGuru] = useState("");
	const [formGuruName, setFormGuruName] = useState("");
	const [formHari, setFormHari] = useState("Senin");
	const [formJam, setFormJam] = useState(SLOT_WAKTU[1].jam);
	const [formRuang, setFormRuang] = useState("");

	const masukKeJadwal = (kelasId: string, kelasNama: string, jumlahSiswa: number) => {
		setSelectedKelasId(kelasId);
		setActiveKelasName(kelasNama);
		setActiveSiswaCount(jumlahSiswa);
		setViewMode("grid");
	};

	const openModal = (hari: string, jam: string, existingJadwal?: any) => {
		if (hari === "Senin" && jam === "1") return;

		setFormHari(hari);
		setFormJam(jam);
		if (existingJadwal) {
			setFormId(existingJadwal.id);
			setFormMapel(existingJadwal.mapelId);
			setFormGuru(existingJadwal.guruId);
			setFormGuruName(existingJadwal.guru.user.nama);
			setFormRuang(existingJadwal.ruang || "");
		} else {
			setFormId("");
			setFormMapel("");
			setFormGuru("");
			setFormGuruName("");
			setFormRuang("");
		}
		setIsModalOpen(true);
	};

	const handleMapelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const combinedValue = e.target.value;
		const [mapelId, guruId] = combinedValue.split("_");
		setFormMapel(mapelId);
		setFormGuru(guruId);

		const mapping = pemetaanDasarAktif.find((p) => p.mapelId === mapelId && p.guruId === guruId);
		if (mapping) setFormGuruName(mapping.guruNama);
	};

	const handleSimpan = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!formGuru || !formMapel) return alert("Pilih Mata Pelajaran & Guru terlebih dahulu!");
		setLoading(true);
		const hasil = await simpanJadwalAction({
			id: formId,
			kelasId: selectedKelasId,
			mapelId: formMapel,
			guruId: formGuru,
			hari: formHari,
			jam: formJam,
			ruang: formRuang,
		});
		setLoading(false);

		if (hasil.success) setIsModalOpen(false);
		else {
			setErrorMessage(hasil.message);
			setIsErrorModalOpen(true);
		}
	};

	const confirmDelete = (id: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setDeleteDataId(id);
		setIsDeleteModalOpen(true);
	};

	const executeDelete = async () => {
		if (!deleteDataId) return;
		setLoading(true);
		await hapusJadwalAction(deleteDataId);
		setLoading(false);
		setIsDeleteModalOpen(false);
		setDeleteDataId(null);
	};

	// --- FUNGSI DRAG AND DROP DENGAN FITUR COPY (ALT) ---
	const handleDragStart = (e: React.DragEvent, jadwal: any) => {
		setDraggedJadwal(jadwal);
		// Izinkan pindah maupun copy
		e.dataTransfer.effectAllowed = "copyMove";
		setTimeout(() => {
			(e.target as HTMLElement).style.opacity = "0.5";
		}, 0);
	};

	const handleDragEnd = (e: React.DragEvent) => {
		(e.target as HTMLElement).style.opacity = "1";
		setDraggedJadwal(null);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		// Beri efek visual 'plus' jika Alt ditahan, 'panah' jika tidak
		e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
	};

	const handleDrop = async (e: React.DragEvent, targetHari: string, targetJam: string) => {
		e.preventDefault();
		if (!draggedJadwal) return;

		// Cek apakah tombol Alt ditekan saat dilepas
		const isCopyOperation = e.altKey;

		// Cegah pindah/copy ke tempat yang sama
		if (
			draggedJadwal.hari === targetHari &&
			(draggedJadwal.jam === targetJam || draggedJadwal.waktuMulai === targetJam)
		) {
			return;
		}

		if (targetHari === "Senin" && targetJam === "1") {
			alert("Sesi ini khusus untuk Upacara Bendera. Tidak dapat menempatkan jadwal ke sini.");
			return;
		}

		setLoading(true);
		const hasil = await simpanJadwalAction({
			// JIKA COPY: Kosongkan ID agar server membuat record baru. JIKA PINDAH: Kirim ID lama.
			id: isCopyOperation ? "" : draggedJadwal.id,
			kelasId: selectedKelasId,
			mapelId: draggedJadwal.mapelId,
			guruId: draggedJadwal.guruId,
			hari: targetHari,
			jam: targetJam,
			ruang: draggedJadwal.ruang || "",
		});
		setLoading(false);
		setDraggedJadwal(null);

		if (!hasil.success) {
			setErrorMessage(hasil.message);
			setIsErrorModalOpen(true);
		}
	};
	// ----------------------------------------------------

	const handlePrint = () => {
		setIsPrintModalOpen(false);
		window.print();
	};

	const exportToExcel = () => {
		const excelData: any[] = [];

		SLOT_WAKTU.forEach((slot) => {
			const rowData: any = { "Sesi/Jam": slot.jam };
			HARI.forEach((hari) => {
				if (hari === "Senin" && slot.jam === "1") {
					rowData[hari] = "UPACARA BENDERA";
				} else {
					const jadwal = jadwalKelasAktif.find(
						(j) => j.hari === hari && (j.waktuMulai === slot.jam || j.jam === slot.jam),
					);
					rowData[hari] = jadwal
						? `${jadwal.mapel.nama}\n(${jadwal.guru.user.nama})\nRuang: ${jadwal.ruang || "-"}`
						: "-";
				}
			});
			excelData.push(rowData);
		});

		const ws = XLSX.utils.json_to_sheet(excelData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, `Jadwal ${activeKelasName}`);
		XLSX.writeFile(wb, `Jadwal_Pelajaran_${activeKelasName.replace(" ", "_")}.xlsx`);

		setIsDownloadModalOpen(false);
	};

	const exportToPDF = () => {
		setIsDownloadModalOpen(false);
		setTimeout(() => {
			window.print();
		}, 300);
	};

	const jadwalKelasAktif = jadwalExisting.filter((j) => j.kelasId === selectedKelasId);
	const pemetaanDasarAktifRaw = pemetaanDasar.filter((p) => p.kelasId === selectedKelasId);
	const pemetaanDasarAktif = pemetaanDasarAktifRaw.filter(
		(value, index, self) => index === self.findIndex((t) => t.mapelId === value.mapelId && t.guruId === value.guruId),
	);

	const getCardColor = (mapelNama: string) => {
		if (mapelNama.toLowerCase().includes("wajib") || mapelNama.toLowerCase().includes("upacara"))
			return styles.cardBlue;
		if (
			mapelNama.toLowerCase().includes("pjok") ||
			mapelNama.toLowerCase().includes("lintas") ||
			mapelNama.toLowerCase().includes("agama")
		)
			return styles.cardYellow;
		return styles.cardWhite;
	};

	if (viewMode === "list") {
		const filteredKelasList = kelasList.filter((k) => filterTingkat === "Semua" || k.nama.startsWith(filterTingkat));
		const tahunAjaranTerpilih = daftarTahunAjaran.find((t) => t.id === selectedTahunId);

		return (
			<div className={styles.pageContainer}>
				<div className={styles.pageHeader}>
					<div>
						<h1 className={styles.pageTitle}>Manajemen Jadwal Pelajaran</h1>
						<p className={styles.pageSubtitle}>Pilih kelas untuk mengatur atau melihat jadwal pelajaran.</p>
					</div>
				</div>

				<div className={styles.filterCard}>
					<div className={styles.formGroup} style={{ marginBottom: 0, flex: 1 }}>
						<label className={styles.formLabel}>Tingkat Kelas</label>
						<select
							className={styles.formInput}
							value={filterTingkat}
							onChange={(e) => setFilterTingkat(e.target.value)}
						>
							<option value="Semua">Semua Tingkat</option>
							<option value="X ">Kelas X</option>
							<option value="XI ">Kelas XI</option>
							<option value="XII ">Kelas XII</option>
						</select>
					</div>

					<div className={styles.formGroup} style={{ marginBottom: 0, flex: 1 }}>
						<label className={styles.formLabel}>Tahun Ajaran</label>
						<select
							className={styles.formInput}
							value={selectedTahunId}
							onChange={(e) => {
								const newTahunId = e.target.value;
								setSelectedTahunId(newTahunId);
								router.push(`/admin/jadwal?tahunId=${newTahunId}`);
							}}
							style={{ border: "1px solid #0369a1", backgroundColor: "#f0f9ff" }}
						>
							{daftarTahunAjaran.length === 0 ? (
								<option value="">Belum ada Tahun Ajaran</option>
							) : (
								daftarTahunAjaran.map((tahun) => (
									<option key={tahun.id} value={tahun.id}>
										{tahun.nama} {tahun.isActive ? "(Aktif)" : ""}
									</option>
								))
							)}
						</select>
					</div>
				</div>

				<div
					className={styles.sectionTitleContainer}
					style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}
				>
					<h2 className={styles.sectionTitle} style={{ margin: 0 }}>
						{filterTingkat === "Semua" ? "Semua Kelas" : `Tingkat ${filterTingkat.trim()}`}
					</h2>

					<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
						<span className={styles.badgeKurikulum}>Kurikulum Merdeka</span>
						{tahunAjaranTerpilih && (
							<span
								style={{
									backgroundColor: "#1e3a8a",
									color: "white",
									padding: "0.25rem 0.75rem",
									borderRadius: "9999px",
									fontSize: "0.75rem",
									fontWeight: 600,
									display: "flex",
									alignItems: "center",
									gap: "0.3rem",
								}}
							>
								<Calendar size={12} /> {tahunAjaranTerpilih.nama} {tahunAjaranTerpilih.isActive ? " (Aktif)" : ""}
							</span>
						)}
					</div>
				</div>

				<div className={styles.classGrid}>
					{filteredKelasList.map((kelas) => (
						<div key={kelas.id} className={styles.classCard}>
							<div className={styles.classCardHeader}>
								<h3 className={styles.classTitle}>{kelas.nama}</h3>
								<div className={styles.studentBadge}>
									<span style={{ fontSize: "1rem" }}>{kelas.jumlahSiswa}</span>
									<span>Siswa</span>
								</div>
							</div>
							<div className={styles.waliKelasInfo}>
								<User size={16} style={{ marginTop: "2px" }} />
								<div>
									<div style={{ fontSize: "0.75rem" }}>Wali Kelas:</div>
									<div style={{ fontWeight: 500, color: "#111827" }}>{kelas.waliKelas}</div>
								</div>
							</div>
							<button
								className={styles.btnOutlineCard}
								onClick={() => masukKeJadwal(kelas.id, kelas.nama, kelas.jumlahSiswa)}
							>
								<CalendarDays size={16} /> Kelola Jadwal
							</button>
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className={styles.pageContainer}>
			<div>
				<button className={styles.btnBack} onClick={() => setViewMode("list")}>
					<ArrowLeft size={16} /> Kembali ke Daftar Kelas
				</button>
			</div>

			<div className={styles.pageHeader}>
				<div>
					<h1 className={styles.pageTitle}>Penjadwalan Mata Pelajaran</h1>
					<p className={styles.pageSubtitle}>Kelola dan alokasikan jadwal untuk kelas {activeKelasName}.</p>
				</div>
			</div>

			<div className={styles.scheduleWrapper}>
				<div className={styles.scheduleHeader}>
					<div className={styles.scheduleTitle}>
						Jadwal Kelas: {activeKelasName} <span className={styles.badgeSiswa}>{activeSiswaCount} Siswa</span>
					</div>
					<div className={styles.scheduleActions} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
						{/* TIP UI */}
						<div
							style={{
								fontSize: "0.75rem",
								color: "#6b7280",
								fontStyle: "italic",
								borderRight: "1px solid #e5e7eb",
								paddingRight: "1rem",
							}}
						>
							💡 Tahan tombol <strong>Alt</strong> sambil drag untuk duplikat
						</div>
						<span title="Cetak Jadwal" style={{ cursor: "pointer", display: "flex" }}>
							<Printer size={20} onClick={() => setIsPrintModalOpen(true)} />
						</span>
						<span title="Unduh Jadwal" style={{ cursor: "pointer", display: "flex" }}>
							<Download size={20} onClick={() => setIsDownloadModalOpen(true)} />
						</span>
					</div>
				</div>

				{loading && (
					<div style={{ textAlign: "center", color: "#1e3a8a", margin: "10px 0", fontWeight: "bold" }}>
						Menyinkronkan data...
					</div>
				)}

				<table className={styles.scheduleTable}>
					<thead>
						<tr>
							<th>
								<Calendar size={18} color="#6b7280" />
							</th>
							{HARI.map((h) => (
								<th key={h}>{h}</th>
							))}
						</tr>
					</thead>
					<tbody>
						{SLOT_WAKTU.map((slot, idx) => (
							<tr key={idx}>
								<td>
									<div className={styles.timeCol}>
										<span className={styles.timeText} style={{ fontSize: "1.1rem", fontWeight: 700 }}>
											{slot.label}
										</span>
									</div>
								</td>
								{HARI.map((hari) => {
									if (hari === "Senin" && slot.jam === "1") {
										return (
											<td key={`${hari}-${slot.jam}`}>
												<div
													className={`${styles.cardSlot} ${styles.cardBlue}`}
													style={{ cursor: "not-allowed", justifyContent: "center", minHeight: "80px" }}
												>
													<div className={styles.mapelName} style={{ textAlign: "center", width: "100%" }}>
														Upacara Bendera
													</div>
													<div style={{ fontSize: "0.75rem", textAlign: "center", color: "#1e40af", marginTop: "4px" }}>
														(Wajib)
													</div>
												</div>
											</td>
										);
									}

									const jadwalSlot = jadwalKelasAktif.find(
										(j) => j.hari === hari && (j.waktuMulai === slot.jam || j.jam === slot.jam),
									);

									return (
										<td
											key={`${hari}-${slot.jam}`}
											onDragOver={handleDragOver}
											onDrop={(e) => handleDrop(e, hari, slot.jam)}
										>
											{jadwalSlot ? (
												<div
													className={`${styles.cardSlot} ${getCardColor(jadwalSlot.mapel.nama)}`}
													onClick={() => openModal(hari, slot.jam, jadwalSlot)}
													draggable
													onDragStart={(e) => handleDragStart(e, jadwalSlot)}
													onDragEnd={handleDragEnd}
													style={{ cursor: "grab" }}
												>
													<div className={styles.mapelName}>
														{jadwalSlot.mapel.nama}
														<Trash2
															size={14}
															className={styles.deleteIcon}
															onClick={(e) => confirmDelete(jadwalSlot.id, e)}
														/>
													</div>
													<div className={styles.guruName}>
														<User size={12} /> {jadwalSlot.guru.user.nama}
													</div>
													{jadwalSlot.ruang && (
														<div className={styles.roomName}>
															<MapPin size={12} /> {jadwalSlot.ruang}
														</div>
													)}
												</div>
											) : (
												<div
													className={styles.emptySlot}
													onClick={() => openModal(hari, slot.jam)}
													style={{
														opacity: draggedJadwal ? 0.8 : 1,
														borderStyle: draggedJadwal ? "dashed" : "solid",
														borderColor: draggedJadwal ? "#3b82f6" : "#e5e7eb",
													}}
												>
													<Plus size={20} />
													<span>Tambah</span>
												</div>
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* MODAL PRINT KONFIRMASI */}
			{isPrintModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer} style={{ maxWidth: "400px" }}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>
								<Printer size={20} /> Cetak Jadwal
							</h2>
							<button
								onClick={() => setIsPrintModalOpen(false)}
								style={{ background: "none", border: "none", cursor: "pointer" }}
							>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: "1.5" }}>
								Apakah Anda ingin mencetak dokumen kalender jadwal untuk kelas <strong>{activeKelasName}</strong>?
							</p>
						</div>
						<div className={styles.modalFooter}>
							<button type="button" onClick={() => setIsPrintModalOpen(false)} className={styles.btnOutline}>
								Batal
							</button>
							<button type="button" onClick={handlePrint} className={styles.btnPrimary}>
								Ya, Cetak Sekarang
							</button>
						</div>
					</div>
				</div>
			)}

			{/* MODAL DOWNLOAD PILIHAN */}
			{isDownloadModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer} style={{ maxWidth: "420px" }}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>
								<Download size={20} /> Unduh Jadwal
							</h2>
							<button
								onClick={() => setIsDownloadModalOpen(false)}
								style={{ background: "none", border: "none", cursor: "pointer" }}
							>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.5rem", textAlign: "center" }}>
								Pilih format dokumen untuk jadwal kelas <strong>{activeKelasName}</strong>:
							</p>
							<div className={styles.exportOptions}>
								<div className={styles.btnExportCard} onClick={exportToExcel}>
									<FileSpreadsheet size={40} color="#16a34a" />
									<span className={styles.exportCardTitle}>Excel (.xlsx)</span>
								</div>
								<div className={styles.btnExportCard} onClick={exportToPDF}>
									<FileText size={40} color="#ef4444" />
									<span className={styles.exportCardTitle}>PDF (.pdf)</span>
								</div>
							</div>
							<p style={{ fontSize: "0.75rem", color: "#6b7280", textAlign: "center", marginTop: "1rem" }}>
								*Untuk format PDF, silakan pilih "Save as PDF" pada jendela Print yang muncul.
							</p>
						</div>
					</div>
				</div>
			)}

			{/* MODAL TAMBAH/EDIT */}
			{isModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>
								<Calendar size={20} /> {formId ? "Edit Jadwal Pelajaran" : "Tambah Jadwal Pelajaran"}
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								style={{ border: "none", background: "none", cursor: "pointer" }}
							>
								<X size={20} />
							</button>
						</div>
						<form onSubmit={handleSimpan}>
							<div className={styles.modalBody}>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Mata Pelajaran & Guru Pengampu</label>
									<select
										required
										className={styles.formInput}
										value={formMapel && formGuru ? `${formMapel}_${formGuru}` : ""}
										onChange={handleMapelChange}
									>
										<option value="" disabled>
											Pilih Mapel | Guru
										</option>
										{pemetaanDasarAktif.length === 0 && (
											<option value="" disabled>
												Belum ada penugasan untuk kelas ini
											</option>
										)}
										{pemetaanDasarAktif.map((p) => (
											<option key={`${p.mapelId}_${p.guruId}`} value={`${p.mapelId}_${p.guruId}`}>
												{p.mapelNama} | {p.guruNama}
											</option>
										))}
									</select>
								</div>

								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Guru Pengampu (Otomatis)</label>
									<input
										type="text"
										className={styles.formInput}
										disabled
										value={formGuruName}
										placeholder="Pilih opsi di atas terlebih dahulu..."
										style={{ backgroundColor: "#f3f4f6", color: "#6b7280", cursor: "not-allowed" }}
									/>
								</div>

								<div className={styles.formRow}>
									<div className={styles.formGroup} style={{ flex: 1 }}>
										<label className={styles.formLabel}>Hari</label>
										<select
											required
											className={styles.formInput}
											value={formHari}
											onChange={(e) => {
												setFormHari(e.target.value);
												if (e.target.value === "Senin" && formJam === "1") {
													setFormJam("2");
												}
											}}
										>
											{HARI.map((h) => (
												<option key={h} value={h}>
													{h}
												</option>
											))}
										</select>
									</div>
									<div className={styles.formGroup} style={{ flex: 1 }}>
										<label className={styles.formLabel}>Jam Pelajaran</label>
										<select
											required
											className={styles.formInput}
											value={formJam}
											onChange={(e) => setFormJam(e.target.value)}
										>
											{SLOT_WAKTU.filter((s) => !(formHari === "Senin" && s.jam === "1")).map((s) => (
												<option key={s.jam} value={s.jam}>
													{s.label}
												</option>
											))}
										</select>
									</div>
								</div>

								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Ruang Kelas</label>
									<input
										type="text"
										required
										className={styles.formInput}
										placeholder="Contoh: Ruang 12, Lab Komputer"
										value={formRuang}
										onChange={(e) => setFormRuang(e.target.value)}
									/>
								</div>
							</div>
							<div className={styles.modalFooter}>
								<button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnOutline}>
									Batal
								</button>
								<button type="submit" disabled={loading} className={styles.btnPrimary}>
									{loading ? "Menyimpan..." : "Simpan Jadwal"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* MODAL HAPUS */}
			{isDeleteModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer} style={{ maxWidth: "400px" }}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle} style={{ color: "#ef4444" }}>
								Hapus Jadwal
							</h2>
							<button
								onClick={() => setIsDeleteModalOpen(false)}
								style={{ background: "none", border: "none", cursor: "pointer" }}
							>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: "1.5" }}>
								Apakah Anda yakin ingin menghapus jadwal mata pelajaran ini dari kalender kelas?
							</p>
						</div>
						<div className={styles.modalFooter}>
							<button
								type="button"
								disabled={loading}
								onClick={() => setIsDeleteModalOpen(false)}
								className={styles.btnOutline}
							>
								Batal
							</button>
							<button
								type="button"
								disabled={loading}
								onClick={executeDelete}
								className={styles.btnPrimary}
								style={{ backgroundColor: "#ef4444" }}
							>
								{loading ? "Menghapus..." : "Ya, Hapus"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* MODAL ERROR BENTROK */}
			{isErrorModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer} style={{ maxWidth: "420px", borderTop: "4px solid #ef4444" }}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle} style={{ color: "#ef4444" }}>
								<AlertTriangle size={20} /> Jadwal Bentrok!
							</h2>
							<button
								onClick={() => setIsErrorModalOpen(false)}
								style={{ background: "none", border: "none", cursor: "pointer" }}
							>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: "1.5" }}>{errorMessage}</p>
						</div>
						<div className={styles.modalFooter}>
							<button type="button" onClick={() => setIsErrorModalOpen(false)} className={styles.btnPrimary}>
								Tutup & Perbaiki
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
