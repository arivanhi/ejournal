"use client";

import { useState, useEffect } from "react";
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
	CheckSquare,
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

const WAKTU_JAM = [
	"07:00 - 07:45",
	"07:45 - 08:30",
	"08:30 - 09:15",
	"09:30 - 10:15",
	"10:15 - 11:00",
	"11:00 - 11:45",
	"12:15 - 13:00",
	"13:00 - 13:45",
	"14:00 - 14:45",
	"14:45 - 15:30",
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

	// State Modal Download ALL
	const [isDownloadAllModalOpen, setIsDownloadAllModalOpen] = useState(false);
	const [selectedClassesForDownload, setSelectedClassesForDownload] = useState<string[]>([]);
	const [isDownloadingAllPdf, setIsDownloadingAllPdf] = useState(false);

	const [loading, setLoading] = useState(false);
	const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
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

	const filteredKelasList = kelasList.filter((k) => filterTingkat === "Semua" || k.nama.startsWith(filterTingkat));
	const tahunAjaranTerpilih = daftarTahunAjaran.find((t) => t.id === selectedTahunId);

	// Otomatis pilih semua kelas yang tampil di layar saat modal Download All dibuka
	useEffect(() => {
		if (isDownloadAllModalOpen) {
			setSelectedClassesForDownload(filteredKelasList.map((k) => k.id));
		}
	}, [isDownloadAllModalOpen, filterTingkat]);

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

	const handleDragStart = (e: React.DragEvent, jadwal: any) => {
		setDraggedJadwal(jadwal);
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
		e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
	};

	const handleDrop = async (e: React.DragEvent, targetHari: string, targetJam: string) => {
		e.preventDefault();
		if (!draggedJadwal) return;

		const isCopyOperation = e.altKey;

		if (
			draggedJadwal.hari === targetHari &&
			(draggedJadwal.jam === targetJam || draggedJadwal.waktuMulai === targetJam)
		) {
			return;
		}

		setLoading(true);
		const hasil = await simpanJadwalAction({
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

	const handlePrint = () => {
		setIsPrintModalOpen(false);
		window.print();
	};

	const exportToExcel = () => {
		const excelData: any[] = [];

		SLOT_WAKTU.forEach((slot) => {
			const rowData: any = { "Sesi/Jam": slot.jam };
			HARI.forEach((hari) => {
				const jadwal = jadwalKelasAktif.find(
					(j) => j.hari === hari && (j.waktuMulai === slot.jam || j.jam === slot.jam),
				);
				rowData[hari] = jadwal
					? `${jadwal.mapel.nama}\n(${jadwal.guru.user.nama})\nRuang: ${jadwal.ruang || "-"}`
					: "-";
			});
			excelData.push(rowData);
		});

		const ws = XLSX.utils.json_to_sheet(excelData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, `Jadwal ${activeKelasName}`);
		XLSX.writeFile(wb, `Jadwal_Pelajaran_${activeKelasName.replace(" ", "_")}.xlsx`);

		setIsDownloadModalOpen(false);
	};

	const exportToPDF = async () => {
		setIsDownloadingPdf(true);
		try {
			const html2pdf = (await import("html2pdf.js")).default;
			const element = document.getElementById("pdf-jadwal-container");

			const opt = {
				margin: 0,
				filename: `Jadwal_Kelas_${activeKelasName.replace(" ", "_")}.pdf`,
				image: { type: "jpeg", quality: 1 },
				html2canvas: { scale: 2, useCORS: true },
				jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
			};

			await html2pdf().set(opt).from(element).save();
			setIsDownloadModalOpen(false);
		} catch (error) {
			console.error("Gagal men-generate PDF:", error);
			alert("Terjadi kesalahan saat memproses PDF.");
		} finally {
			setIsDownloadingPdf(false);
		}
	};

	// --- FITUR EXPORT ALL PDF ---
	const exportAllToPDF = async () => {
		if (selectedClassesForDownload.length === 0) return alert("Pilih minimal 1 kelas untuk diexport.");
		setIsDownloadingAllPdf(true);
		try {
			const html2pdf = (await import("html2pdf.js")).default;
			const element = document.getElementById("pdf-download-all-container");

			const opt = {
				margin: 0,
				filename: `Kumpulan_Jadwal_Pelajaran_${tahunAjaranTerpilih?.nama || "TA"}.pdf`,
				image: { type: "jpeg", quality: 1 },
				html2canvas: { scale: 2, useCORS: true },
				jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
			};

			await html2pdf().set(opt).from(element).save();
			setIsDownloadAllModalOpen(false);
		} catch (error) {
			console.error("Gagal men-generate PDF:", error);
			alert("Terjadi kesalahan saat memproses PDF multi-halaman.");
		} finally {
			setIsDownloadingAllPdf(false);
		}
	};

	const handleToggleClassDownload = (id: string) => {
		setSelectedClassesForDownload((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
	};

	const handleToggleAllClasses = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.checked) setSelectedClassesForDownload(filteredKelasList.map((k) => k.id));
		else setSelectedClassesForDownload([]);
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
			mapelNama.toLowerCase().includes("agama") ||
			mapelNama.toLowerCase().includes("keterampilan")
		)
			return styles.cardYellow;
		return styles.cardWhite;
	};

	// FUNGSI RENDER PDF TEMPLATE BERSAMA
	const renderPdfTemplate = (namaKelas: string, jadwalUntukKelasIni: any[]) => {
		return (
			<div
				style={{
					width: "297mm",
					height: "209mm",
					padding: "10mm 15mm",
					boxSizing: "border-box",
					backgroundColor: "#fff",
					color: "#000",
					fontFamily: "Arial, sans-serif",
				}}
			>
				<div
					style={{
						position: "relative",
						textAlign: "center",
						borderBottom: "3px solid #000",
						paddingBottom: "15px",
						marginBottom: "15px",
					}}
				>
					<img
						src="/logo.jpg"
						alt="Logo SMAN 2 Brebes"
						style={{
							position: "absolute",
							left: "20px",
							top: "50%",
							transform: "translateY(-50%)",
							width: "80px",
							height: "80px",
							objectFit: "contain",
						}}
					/>
					<h1
						style={{
							margin: "0 0 5px 0",
							fontSize: "20pt",
							fontWeight: "bold",
							color: "#000",
							fontFamily: '"Times New Roman", Times, serif',
						}}
					>
						SMA NEGERI 2 BREBES
					</h1>
					<p style={{ margin: "2px 0", fontSize: "11pt" }}>Jl. Jend. A. Yani 77 Brebes 52212 Telp. (0283) 671060</p>
					<p style={{ margin: 0, fontSize: "11pt" }}>Website: www.sman2-brebes.sch.id - Email: smadabes@ymail.com</p>
				</div>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: "15px",
						paddingLeft: "5px",
					}}
				>
					<h2 style={{ margin: 0, fontSize: "14pt", fontWeight: "bold", color: "#111827" }}>Kelas: {namaKelas}</h2>
					<div style={{ fontSize: "11pt", fontWeight: "bold" }}>T.A {tahunAjaranTerpilih?.nama || ""}</div>
				</div>
				<table
					style={{
						width: "100%",
						borderCollapse: "collapse",
						fontSize: "10pt",
						border: "1px solid #000",
						height: "calc(100% - 150px)",
					}}
				>
					<thead>
						<tr>
							<th
								style={{
									border: "1px solid #000",
									backgroundColor: "#f1f5f9",
									width: "15%",
									textAlign: "center",
									padding: "8px",
									verticalAlign: "middle",
								}}
							>
								Jam Ke-
							</th>
							{HARI.map((h) => (
								<th
									key={h}
									style={{
										border: "1px solid #000",
										backgroundColor: "#f1f5f9",
										width: "17%",
										textAlign: "center",
										padding: "8px",
										verticalAlign: "middle",
									}}
								>
									{h}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{SLOT_WAKTU.map((slot, idx) => (
							<tr key={slot.jam}>
								<td
									style={{
										border: "1px solid #000",
										textAlign: "center",
										fontWeight: "bold",
										padding: "4px",
										backgroundColor: "#f8fafc",
									}}
								>
									<div style={{ fontSize: "11pt" }}>{slot.label}</div>
									<div style={{ fontSize: "8pt", fontWeight: "normal", color: "#4b5563" }}>{WAKTU_JAM[idx]}</div>
								</td>
								{HARI.map((hari) => {

									const jadwalSlot = jadwalUntukKelasIni.find(
										(j: any) => j.hari === hari && (j.waktuMulai === slot.jam || j.jam === slot.jam),
									);
									let bgColor = "#ffffff";
									if (jadwalSlot) {
										const mapelNama = jadwalSlot.mapel.nama.toLowerCase();
										if (mapelNama.includes("wajib") || mapelNama.includes("upacara")) bgColor = "#bfdbfe";
										else if (
											mapelNama.includes("pjok") ||
											mapelNama.includes("lintas") ||
											mapelNama.includes("agama") ||
											mapelNama.includes("keterampilan")
										)
											bgColor = "#fef08a";
									}
									return (
										<td
											key={`${hari}-${slot.jam}`}
											style={{
												border: "1px solid #000",
												backgroundColor: bgColor,
												textAlign: "center",
												verticalAlign: "middle",
												padding: "4px",
											}}
										>
											{jadwalSlot ? (
												<>
													<div style={{ fontWeight: "bold", marginBottom: "2px", fontSize: "9pt", lineHeight: "1.2" }}>
														{jadwalSlot.mapel.nama}
													</div>
													<div style={{ fontSize: "8pt", color: "#374151" }}>{jadwalSlot.guru.user.nama}</div>
													{jadwalSlot.ruang && (
														<div style={{ fontSize: "8pt", color: "#dc2626", marginTop: "2px", fontWeight: "bold" }}>
															{jadwalSlot.ruang}
														</div>
													)}
												</>
											) : (
												""
											)}
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		);
	};

	if (viewMode === "list") {
		return (
			<div className={styles.pageContainer}>
				{/* --- MODAL DOWNLOAD ALL PDF --- */}
				{isDownloadAllModalOpen && (
					<div className={styles.modalOverlay}>
						<div className={styles.modalContainerLarge} style={{ maxWidth: "600px" }}>
							<div className={styles.modalHeader}>
								<h2 className={styles.modalTitle}>
									<Download size={20} style={{ display: "inline", marginBottom: "-3px" }} /> Export Semua Jadwal
								</h2>
								<button onClick={() => setIsDownloadAllModalOpen(false)} className={styles.modalCloseBtn}>
									<X size={20} />
								</button>
							</div>
							<div className={styles.modalBodyScroll} style={{ padding: "1.5rem" }}>
								<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
									Pilih kelas yang jadwalnya ingin Anda export dan jadikan satu file PDF:
								</p>
								<div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #e2e8f0" }}>
									<label className={styles.checkboxLabel}>
										<input
											type="checkbox"
											checked={
												selectedClassesForDownload.length === filteredKelasList.length && filteredKelasList.length > 0
											}
											onChange={handleToggleAllClasses}
											style={{ width: "16px", height: "16px", cursor: "pointer" }}
										/>
										<span style={{ fontWeight: "bold" }}>Pilih Semua Kelas ({filteredKelasList.length})</span>
									</label>
								</div>
								<div className={styles.checkboxGrid}>
									{filteredKelasList.map((kelas) => (
										<label key={kelas.id} className={styles.checkboxLabel}>
											<input
												type="checkbox"
												checked={selectedClassesForDownload.includes(kelas.id)}
												onChange={() => handleToggleClassDownload(kelas.id)}
												style={{ width: "16px", height: "16px", cursor: "pointer" }}
											/>
											{kelas.nama}
										</label>
									))}
								</div>

								{/* HIDDEN CONTAINER FOR MASSIVE EXPORT */}
								<div style={{ display: "none" }}>
									<div id="pdf-download-all-container">
										{selectedClassesForDownload.map((kelasId, index) => {
											const kelasInfo = kelasList.find((k) => k.id === kelasId);
											const jadwalUntukKelasIni = jadwalExisting.filter((j) => j.kelasId === kelasId);
											return (
												<div key={kelasId}>
													{renderPdfTemplate(kelasInfo?.nama || "", jadwalUntukKelasIni)}
													{index < selectedClassesForDownload.length - 1 && (
														<div className="html2pdf__page-break"></div>
													)}
												</div>
											);
										})}
									</div>
								</div>
							</div>
							<div className={styles.modalFooter}>
								<button type="button" onClick={() => setIsDownloadAllModalOpen(false)} className={styles.btnOutline}>
									Batal
								</button>
								<button
									type="button"
									onClick={exportAllToPDF}
									disabled={isDownloadingAllPdf || selectedClassesForDownload.length === 0}
									className={styles.btnPrimary}
								>
									{isDownloadingAllPdf ? "Memproses PDF..." : `Unduh ${selectedClassesForDownload.length} Jadwal`}
								</button>
							</div>
						</div>
					</div>
				)}

				<div
					className={styles.pageHeader}
					style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
				>
					<div>
						<h1 className={styles.pageTitle}>Manajemen Jadwal Pelajaran</h1>
						<p className={styles.pageSubtitle}>Pilih kelas untuk mengatur atau melihat jadwal pelajaran.</p>
					</div>
					{/* KUNCI PERBAIKAN: Tombol Download All Jadwal */}
					<button className={styles.btnPrimary} onClick={() => setIsDownloadAllModalOpen(true)}>
						<CheckSquare size={16} /> Export Banyak Jadwal
					</button>
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
							<option value="X-">Kelas X</option>
							<option value="XI-">Kelas XI</option>
							<option value="XII-">Kelas XII</option>
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
			{/* CONTAINER TERSEMBUNYI UNTUK EXPORT PDF 1 KELAS */}
			<div style={{ display: "none" }}>
				<div id="pdf-jadwal-container">{renderPdfTemplate(activeKelasName, jadwalKelasAktif)}</div>
			</div>

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
						<span title="Export Jadwal" style={{ cursor: "pointer", display: "flex" }}>
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
								<Download size={20} /> Export Jadwal
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
								<button className={styles.btnExportCard} onClick={exportToPDF} disabled={isDownloadingPdf}>
									<FileText size={40} color="#ef4444" />
									<span className={styles.exportCardTitle}>{isDownloadingPdf ? "Memproses PDF..." : "PDF (.pdf)"}</span>
								</button>
							</div>
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
