"use client";

import { useState, useEffect, useMemo } from "react";
import {
	LayoutDashboard,
	BookOpen,
	QrCode,
	History,
	Users,
	Settings,
	LogOut,
	ArrowLeft,
	Beaker,
	CheckCircle2,
	Clock,
	MapPin,
	Download,
	Save,
	UserCheck,
	Bell,
	HelpCircle,
	X,
	Search,
	CalendarDays,
	AlertTriangle,
	Edit,
	PowerOff,
	Printer,
	Filter,
	ArrowUp,
	ArrowDown,
	Trash2,
} from "lucide-react";
import styles from "./jurnal.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
	buatJurnalAction,
	aktifkanPresensiQR,
	simpanPresensiManualAction,
	updateJurnalAction,
	tutupPresensiQR,
	hapusJurnalAction,
} from "./actions";

type ModalConfig = {
	isOpen: boolean;
	title: string;
	message: string;
	withInput?: boolean;
	onConfirm: (val?: string) => void;
} | null;

type ToastConfig = { id: number; message: string; type: "success" | "error" };

// --- MAP WAKTU (1 Sesi = 45 Menit) ---
const JAM_MAP = [
	{ jam: 1, start: "07:00", end: "07:45" },
	{ jam: 2, start: "07:45", end: "08:30" },
	{ jam: 3, start: "08:30", end: "09:15" },
	{ jam: 4, start: "09:15", end: "10:00" },
	{ jam: 5, start: "10:30", end: "11:15" },
	{ jam: 6, start: "11:15", end: "12:00" },
	{ jam: 7, start: "13:00", end: "13:45" },
	{ jam: 8, start: "13:45", end: "14:30" },
	{ jam: 9, start: "14:30", end: "15:15" },
	{ jam: 10, start: "15:15", end: "16:00" },
];

const getWaktuString = (jams: number[]) => {
	if (!jams || jams.length === 0) return "-";
	const first = JAM_MAP.find((m) => m.jam === jams[0]);
	const last = JAM_MAP.find((m) => m.jam === jams[jams.length - 1]);
	if (first && last) return `${first.start} - ${last.end}`;
	return "-";
};

// ============================================================================
// KOMPONEN PEMBANTU PDF (PAGINATION MANUAL)
// ============================================================================
const PageContainer = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
	<div
		style={{
			width: "210mm",
			height: "296mm",
			padding: "15mm 20mm",
			boxSizing: "border-box",
			display: "flex",
			flexDirection: "column",
			pageBreakAfter: isLast ? "auto" : "always",
			backgroundColor: "white",
			color: "black",
			position: "relative",
			overflow: "hidden"
		}}
	>
		{children}
	</div>
);

const PageFooter = ({ current, total }: { current: number; total: number }) => (
	<div style={{ textAlign: "right", fontSize: "10pt", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
		Halaman {current} dari {total}
	</div>
);

const KopSurat = () => (
	<div style={{ paddingBottom: "5px", backgroundColor: "white", marginBottom: "15px", flexShrink: 0 }}>
		<div
			style={{
				display: "flex",
				alignItems: "center",
				borderBottom: "3px solid black",
				paddingBottom: "10px",
				marginBottom: "2px",
			}}
		>
			<img
				src="/logo.jpg"
				alt="Logo SMAN 2 Brebes"
				style={{ width: "80px", height: "80px", objectFit: "contain", margin: "0 20px" }}
			/>
			<div style={{ flex: 1, textAlign: "center" }}>
				<h1
					style={{
						margin: "0 0 4px 0",
						fontSize: "20pt",
						fontWeight: "bold",
						color: "#000",
						fontFamily: '"Times New Roman", Times, serif',
					}}
				>
					SMA NEGERI 2 BREBES
				</h1>
				<p style={{ margin: "2px 0", fontSize: "11pt", color: "#000" }}>Jl. Jend. A. Yani 77 Brebes 52212 Telp. (0283) 671060</p>
				<p style={{ margin: 0, fontSize: "10pt", color: "#000" }}>Website: sman2brebes.sch.id - Email: smandabes@gmail.com</p>
			</div>
			<div style={{ width: "120px" }}></div>
		</div>
		<div style={{ borderBottom: "1px solid black" }}></div>
	</div>
);


export default function JurnalClient({
	jadwalSemua,
	user,
	isWaliKelas,
}: {
	jadwalSemua: any[];
	user: any;
	isWaliKelas: boolean;
}) {
	const [viewMode, setViewMode] = useState<"list" | "detail" | "presensi">("list");
	const [loading, setLoading] = useState(false);

	const [modal, setModal] = useState<ModalConfig>(null);
	const [modalInputValue, setModalInputValue] = useState("");

	const [toasts, setToasts] = useState<ToastConfig[]>([]);
	const [activeJadwal, setActiveJadwal] = useState<any>(null);
	const [activeJurnal, setActiveJurnal] = useState<any>(null);
	const [currentPageJurnal, setCurrentPageJurnal] = useState(1);
	const [currentPageRekap, setCurrentPageRekap] = useState(1);
	const itemsPerPage = 15;

	// Form Pembuatan Jurnal
	const [tanggal, setTanggal] = useState(new Date().toLocaleDateString("en-CA"));
	const [waktuMulai, setWaktuMulai] = useState("07:00");
	const [waktuSelesai, setWaktuSelesai] = useState("08:30");
	const [materi, setMateri] = useState("");
	const [tugas, setTugas] = useState("");

	// Form Edit Jurnal
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editJurnalId, setEditJurnalId] = useState("");
	const [editTanggal, setEditTanggal] = useState("");
	const [editWaktuMulai, setEditWaktuMulai] = useState("");
	const [editWaktuSelesai, setEditWaktuSelesai] = useState("");
	const [editMateri, setEditMateri] = useState("");
	const [editTugas, setEditTugas] = useState("");

	// Hapus Jurnal
	const [isHapusModalOpen, setIsHapusModalOpen] = useState(false);
	const [hapusJurnalId, setHapusJurnalId] = useState("");

	// Tab Kelas (View 1)
	const [activeTabKelas, setActiveTabKelas] = useState("Semua Kelas");

	const [presensiEdits, setPresensiEdits] = useState<Record<string, string>>({});
	const [nilaiTugasEdits, setNilaiTugasEdits] = useState<Record<string, number>>({});
	const [alasanIzinEdits, setAlasanIzinEdits] = useState<Record<string, string>>({});

	const [sortColumn, setSortColumn] = useState<"nis" | "nama" | "jk" | "status" | "nilai">("nama");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	const [isModalIzinOpen, setIsModalIzinOpen] = useState(false);
	const [currentSiswaIzin, setCurrentSiswaIzin] = useState<{ id: string; nama: string } | null>(null);
	const [inputAlasan, setInputAlasan] = useState("");
	const [search, setSearch] = useState("");

	const [isDownloading, setIsDownloading] = useState(false);

	// --- LOGIKA PENGGABUNGAN JADWAL (GROUPING) ---
	const groupedJadwal = useMemo(() => {
		const grouped: any[] = [];

		const sortedJadwal = [...(jadwalSemua || [])].sort((a, b) => {
			if (a.hari !== b.hari) return a.hari - b.hari;
			if (a.kelas.nama !== b.kelas.nama) return a.kelas.nama.localeCompare(b.kelas.nama);
			if (a.mapel.nama !== b.mapel.nama) return a.mapel.nama.localeCompare(b.mapel.nama);

			const jamA = parseInt(a.jam || a.waktuMulai);
			const jamB = parseInt(b.jam || b.waktuMulai);
			return (isNaN(jamA) ? 0 : jamA) - (isNaN(jamB) ? 0 : jamB);
		});

		sortedJadwal.forEach((curr) => {
			const last = grouped[grouped.length - 1];
			const jamValue = curr.jam || curr.waktuMulai;
			const jamParsed = parseInt(jamValue);

			if (
				last &&
				last.hari === curr.hari &&
				last.kelas.id === curr.kelas.id &&
				last.mapel.id === curr.mapel.id &&
				!isNaN(jamParsed)
			) {
				const lastJams = last.jams;
				if (lastJams && lastJams.length > 0) {
					const lastJamVal = lastJams[lastJams.length - 1];
					if (jamParsed === lastJamVal + 1) {
						last.jams.push(jamParsed);
						last.displaySesi =
							last.jams.length > 1 ? `Jam ${last.jams[0]}-${last.jams[last.jams.length - 1]}` : `Jam ${last.jams[0]}`;
						last.waktuRentang = getWaktuString(last.jams);

						const mergedJurnals = [...(last.jurnal || []), ...(curr.jurnal || [])];
						const uniqueJurnalsMap = new Map();
						mergedJurnals.forEach((j: any) => uniqueJurnalsMap.set(j.id, j));
						last.jurnal = Array.from(uniqueJurnalsMap.values());

						return;
					}
				}
			}

			grouped.push({
				...curr,
				jams: isNaN(jamParsed) ? [] : [jamParsed],
				displaySesi: isNaN(jamParsed) ? jamValue : `Jam Ke ${jamParsed}`,
				waktuRentang: isNaN(jamParsed)
					? curr.waktuMulai && curr.waktuMulai.includes("-")
						? curr.waktuMulai
						: "-"
					: getWaktuString([jamParsed]),
				jurnal: curr.jurnal || [],
			});
		});

		return grouped;
	}, [jadwalSemua]);

	const kelasTabs = useMemo(() => {
		if (!groupedJadwal) return ["Semua Kelas"];
		const uniqueKelas = Array.from(new Set(groupedJadwal.map((j) => j.kelas?.nama))).filter(Boolean) as string[];
		return ["Semua Kelas", ...uniqueKelas.sort()];
	}, [groupedJadwal]);

	const filteredJadwal = useMemo(() => {
		if (!groupedJadwal) return [];
		if (activeTabKelas === "Semua Kelas") return groupedJadwal;
		return groupedJadwal.filter((j) => j.kelas?.nama === activeTabKelas);
	}, [groupedJadwal, activeTabKelas]);

	useEffect(() => {
		if (activeJadwal && groupedJadwal) {
			const updatedJadwal = groupedJadwal.find((j) => j.id === activeJadwal.id);
			if (updatedJadwal) {
				setActiveJadwal(updatedJadwal);
				if (updatedJadwal.waktuRentang && updatedJadwal.waktuRentang.includes("-")) {
					const times = updatedJadwal.waktuRentang.split(" - ");
					setWaktuMulai(times[0].trim());
					setWaktuSelesai(times[1].trim());
				}
			}
		}
	}, [groupedJadwal, activeJadwal?.id]);

	const showToast = (message: string, type: "success" | "error" = "success") => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 3500);
	};

	const handleBukaKelas = (jadwal: any) => {
		setActiveJadwal(jadwal);
		setTanggal(new Date().toLocaleDateString("en-CA"));
		setMateri("");
		setTugas("");

		if (jadwal.waktuRentang && jadwal.waktuRentang.includes("-")) {
			const times = jadwal.waktuRentang.split(" - ");
			setWaktuMulai(times[0].trim());
			setWaktuSelesai(times[1].trim());
		}
		setViewMode("detail");
	};

	const handleSimpanJurnalBaru = async () => {
		setLoading(true);
		let isAutoHadir = false;
		if (activeJadwal.jams && activeJadwal.jams.length > 0) {
			const minJam = Math.min(...activeJadwal.jams);
			const maxJam = Math.max(...activeJadwal.jams);
			if (minJam >= 2 && maxJam <= 9) {
				isAutoHadir = true;
			}
		}

		const siswaIds = activeJadwal.kelas?.riwayatSiswa?.map((rs: any) => rs.siswa.id) || [];

		const res = await buatJurnalAction({
			jadwalId: activeJadwal.id,
			tanggal,
			waktuMulai,
			waktuSelesai,
			materi,
			tujuan: "",
			catatan: "",
			tugas,
			isAutoHadir,
			siswaIds,
		});

		setLoading(false);
		setModal(null);
		if (res.success) {
			if (isAutoHadir) {
				showToast("Jurnal berhasil dibuat & Presensi siswa otomatis diisi HADIR!", "success");
			} else {
				showToast("Jurnal berhasil dibuat! (Silakan isi presensi secara manual)", "success");
			}
			setMateri("");
			setTugas("");
		} else {
			showToast(res.message, "error");
		}
	};

	const handleBukaQR = async (jurnalId: string) => {
		setLoading(true);
		const res = await aktifkanPresensiQR(jurnalId);
		setLoading(false);
		setModal(null);
		if (res.success) showToast("QR Presensi berhasil diaktifkan!", "success");
		else showToast("Gagal mengaktifkan QR: " + res.message, "error");
	};

	const handleTutupQR = async (jurnalId: string, catatanKBM: string) => {
		setLoading(true);
		const res = await tutupPresensiQR(jurnalId, catatanKBM);
		setLoading(false);
		setModal(null);
		if (res.success) showToast("QR Presensi ditutup & Catatan disimpan.", "success");
		else showToast("Gagal menutup QR: " + res.message, "error");
	};

	const handleSimpanEditJurnal = async () => {
		if (!editTanggal || !editMateri) {
			alert("Tanggal dan Materi wajib diisi.");
			return;
		}
		setLoading(true);
		const res = await updateJurnalAction(editJurnalId, {
			tanggal: editTanggal,
			waktuMulai: editWaktuMulai,
			waktuSelesai: editWaktuSelesai,
			materi: editMateri,
			tugas: editTugas,
		});
		setLoading(false);
		setIsEditModalOpen(false);
		if (res.success) showToast("Perubahan jurnal berhasil disimpan!", "success");
		else showToast(res.message, "error");
	};

	const triggerModalHapusJurnal = (jurnalId: string) => {
		setHapusJurnalId(jurnalId);
		setIsHapusModalOpen(true);
	};

	const handleHapusJurnal = async () => {
		setLoading(true);
		try {
			const res = await hapusJurnalAction(hapusJurnalId);
			if (res.success) {
				showToast("Jurnal berhasil dihapus", "success");
				setIsHapusModalOpen(false);
				setHapusJurnalId("");
			} else {
				showToast(res.message || "Gagal menghapus jurnal", "error");
			}
		} catch (error) {
			showToast("Terjadi kesalahan sistem", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleSimpanPresensiManual = async () => {
		setLoading(true);
		const presensiData = Object.entries(presensiEdits).map(([siswaId, status]) => ({
			siswaId,
			status,
			nilaiTugas: nilaiTugasEdits[siswaId],
			alasanIzin: alasanIzinEdits[siswaId]
		}));
		const res = await simpanPresensiManualAction(activeJurnal.id, presensiData);
		setLoading(false);
		setModal(null);
		if (res.success) {
			showToast("Presensi berhasil diperbarui!", "success");
			setViewMode("detail");
		} else showToast(res.message, "error");
	};

	const triggerModalSimpanJurnalBaru = () => {
		if (!tanggal || !materi) {
			showToast("Peringatan: Tanggal dan Topik Materi wajib diisi!", "error");
			return;
		}

		let autoHadirMsg = "";
		if (activeJadwal.jams && activeJadwal.jams.length > 0) {
			const minJam = Math.min(...activeJadwal.jams);
			const maxJam = Math.max(...activeJadwal.jams);
			if (minJam >= 2 && maxJam <= 9) {
				autoHadirMsg = " (Kehadiran siswa akan otomatis diisi 'Hadir' untuk jam ini)";
			}
		}

		setModal({
			isOpen: true,
			title: "Simpan Jurnal Baru?",
			message: `Menyimpan jurnal untuk tanggal ${new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} jam ${waktuMulai} - ${waktuSelesai}.${autoHadirMsg}`,
			onConfirm: handleSimpanJurnalBaru,
		});
	};

	const triggerModalBukaQR = (jurnalId: string, jurnalTanggal: string | Date) => {
		const hariIniStr = new Date().toLocaleDateString("en-CA");
		const tanggalJurnalStr = new Date(jurnalTanggal).toLocaleDateString("en-CA");
		if (hariIniStr !== tanggalJurnalStr) {
			showToast("QR Presensi HANYA BISA diaktifkan pada jadwal HARI INI.", "error");
			return;
		}
		setModal({
			isOpen: true,
			title: "Buka Akses QR Presensi?",
			message: "Siswa akan bisa memindai QR Code untuk melakukan presensi secara mandiri. Lanjutkan?",
			onConfirm: () => handleBukaQR(jurnalId),
		});
	};

	const triggerModalTutupQR = (jurnalId: string) => {
		setModalInputValue("");
		setModal({
			isOpen: true,
			title: "Tutup Akses QR & Sesi Presensi?",
			message:
				"Siswa tidak akan bisa lagi memindai QR Code. Tambahkan catatan kejadian atau evaluasi KBM hari ini (Opsional):",
			withInput: true,
			onConfirm: (val?: string) => handleTutupQR(jurnalId, val || ""),
		});
	};

	const triggerModalSimpanPresensi = () => {
		if (Object.keys(presensiEdits).length === 0) {
			showToast("Tidak ada perubahan presensi yang dibuat.", "error");
			return;
		}
		setModal({
			isOpen: true,
			title: "Simpan Perubahan Presensi?",
			message: "Anda akan menyimpan perubahan absensi secara manual ke sistem. Yakin ingin menyimpan?",
			onConfirm: handleSimpanPresensiManual,
		});
	};

	const openEditModal = (jurnalItem: any) => {
		setEditJurnalId(jurnalItem.id);
		setEditTanggal(new Date(jurnalItem.tanggal).toLocaleDateString("en-CA"));
		setEditMateri(jurnalItem.materiBab);
		setEditTugas(jurnalItem.tugas || "");

		setEditWaktuMulai(jurnalItem.waktuMulai || activeJadwal.waktuRentang.split(" - ")[0].trim());
		setEditWaktuSelesai(jurnalItem.waktuSelesai || activeJadwal.waktuRentang.split(" - ")[1].trim());
		setIsEditModalOpen(true);
	};

	const handleBukaDetailAbsen = (jurnal: any) => {
		setActiveJurnal(jurnal);
		const initialEdits: Record<string, string> = {};
		const initialNilai: Record<string, number> = {};
		const initialAlasan: Record<string, string> = {};
		jurnal.presensi?.forEach((p: any) => {
			initialEdits[p.siswaId] = p.status;
			if (p.nilaiTugas !== null && p.nilaiTugas !== undefined) {
				initialNilai[p.siswaId] = p.nilaiTugas;
			}
			if (p.alasanIzin) {
				initialAlasan[p.siswaId] = p.alasanIzin;
			}
		});
		setPresensiEdits(initialEdits);
		setNilaiTugasEdits(initialNilai);
		setAlasanIzinEdits(initialAlasan);
		setViewMode("presensi");
	};

	const MAX_ROWS = 20;
	const chunkArray = (arr: any[], size: number) => {
		if (!arr || arr.length === 0) return [[]];
		const res = [];
		for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
		return res;
	};

	const handleDownloadPdf = async () => {
		setIsDownloading(true);
		try {
			const html2pdf = (await import("html2pdf.js")).default;
			const element = document.getElementById("pdf-presensi-content");

			const opt = {
				margin: 0,
				filename: `Detail_Presensi_${activeJadwal.mapel.nama}_${activeJadwal.kelas.nama}_${new Date(activeJurnal.tanggal).toLocaleDateString("en-CA")}.pdf`,
				image: { type: "jpeg", quality: 1 },
				html2canvas: { scale: 2, useCORS: true },
				jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				pagebreak: { mode: ['css'] }
			};

			await html2pdf().set(opt).from(element).save();
		} catch (error) {
			console.error("Gagal men-generate PDF:", error);
			alert("Terjadi kesalahan saat memproses PDF.");
		} finally {
		setIsDownloading(false);
		}
	};

	return (
		<>
			{/* === TOAST NOTIFICATION === */}
			<div className={styles.toastContainer}>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}
					>
						{toast.type === "success" ? (
							<CheckCircle2 size={20} color="#10b981" />
						) : (
							<AlertTriangle size={20} color="#ef4444" />
						)}
						<span className={styles.toastText}>{toast.message}</span>
					</div>
				))}
			</div>

			{/* === MODAL KONFIRMASI HAPUS JURNAL === */}
			{isHapusModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContent}>
						<h3 className={styles.modalTitle}>Hapus Jurnal Mengajar</h3>
						<p className={styles.modalMessage}>
							Apakah Anda yakin ingin menghapus jurnal ini? Seluruh data presensi siswa pada jurnal ini juga akan ikut terhapus secara permanen.
						</p>
						<div className={styles.modalActions}>
							<button
								className={styles.btnOutlineFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => setIsHapusModalOpen(false)}
								disabled={loading}
							>
								Batal
							</button>
							<button
								className={styles.btnPrimaryFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem", backgroundColor: "#ef4444", border: "none" }}
								onClick={handleHapusJurnal}
								disabled={loading}
							>
								{loading ? "Menghapus..." : "Ya, Hapus"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* === MODAL KONFIRMASI === */}
			{modal && modal.isOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContent}>
						<div className={styles.modalTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
							<AlertTriangle size={24} color="#f59e0b" /> {modal.title}
						</div>
						<div className={styles.modalMessage}>{modal.message}</div>

						{modal.withInput && (
							<div style={{ marginBottom: "1.5rem" }}>
								<textarea
									className={styles.formTextarea}
									style={{ minHeight: "80px", width: "100%" }}
									placeholder="Ketik catatan di sini (opsional)..."
									value={modalInputValue}
									onChange={(e) => setModalInputValue(e.target.value)}
								/>
							</div>
						)}

						<div className={styles.modalActions}>
							<button
								className={styles.btnOutlineFull}
								style={{
									width: "auto",
									margin: 0,
									padding: "0.5rem 1.5rem",
									backgroundColor: "#f1f5f9",
									borderColor: "#e2e8f0",
								}}
								onClick={() => setModal(null)}
								disabled={loading}
							>
								Batal
							</button>
							<button
								className={styles.btnPrimaryFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => modal.onConfirm(modalInputValue)}
								disabled={loading}
							>
								{loading ? "Memproses..." : "Ya, Lanjutkan"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* === MODAL IZIN === */}
			{isModalIzinOpen && currentSiswaIzin && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContent}>
						<div className={styles.modalTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
							<AlertTriangle size={24} color="#f59e0b" /> Alasan Izin
						</div>
						<div className={styles.modalMessage}>Masukkan alasan izin untuk siswa <strong>{currentSiswaIzin.nama}</strong>:</div>
						<div style={{ marginBottom: "1.5rem" }}>
							<textarea
								className={styles.formTextarea}
								style={{ minHeight: "80px", width: "100%" }}
								placeholder="Sakit perut, keperluan keluarga, dll..."
								value={inputAlasan}
								onChange={(e) => setInputAlasan(e.target.value)}
							/>
						</div>
						<div className={styles.modalActions}>
							<button
								className={styles.btnOutlineFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => {
									setPresensiEdits({ ...presensiEdits, [currentSiswaIzin.id]: "A" });
									setIsModalIzinOpen(false);
									setCurrentSiswaIzin(null);
								}}
							>
								Batal
							</button>
							<button
								className={styles.btnPrimaryFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => {
									setAlasanIzinEdits({ ...alasanIzinEdits, [currentSiswaIzin.id]: inputAlasan });
									setIsModalIzinOpen(false);
									setCurrentSiswaIzin(null);
								}}
							>
								Simpan Alasan
							</button>
						</div>
					</div>
				</div>
			)}

			{/* === MODAL EDIT JURNAL === */}
			{isEditModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContent} style={{ width: "500px" }}>
						<div className={styles.modalTitle} style={{ marginBottom: "1.5rem" }}>
							Edit Jurnal Pertemuan
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
							<div>
								<label className={styles.formLabel}>Tanggal Pertemuan</label>
								<input
									type="date"
									className={styles.formInput}
									value={editTanggal}
									onChange={(e) => setEditTanggal(e.target.value)}
								/>
							</div>

							<div>
								<label className={styles.formLabel}>Waktu Aktual Mengajar</label>
								<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
									<input
										type="time"
										className={styles.formInput}
										value={editWaktuMulai}
										onChange={(e) => setEditWaktuMulai(e.target.value)}
									/>
									<span style={{ color: "#64748b", fontWeight: "bold" }}>s.d</span>
									<input
										type="time"
										className={styles.formInput}
										value={editWaktuSelesai}
										onChange={(e) => setEditWaktuSelesai(e.target.value)}
									/>
								</div>
							</div>

							<div>
								<label className={styles.formLabel}>Topik Materi</label>
								<textarea
									className={styles.formTextarea}
									style={{ minHeight: "80px" }}
									value={editMateri}
									onChange={(e) => setEditMateri(e.target.value)}
								/>
							</div>

							<div>
								<label className={styles.formLabel}>Tugas Harian (Opsional)</label>
								<textarea
									className={styles.formTextarea}
									style={{ minHeight: "80px" }}
									value={editTugas}
									onChange={(e) => setEditTugas(e.target.value)}
								/>
							</div>
						</div>
						<div className={styles.modalActions}>
							<button
								className={styles.btnOutlineFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => setIsEditModalOpen(false)}
								disabled={loading}
							>
								Batal
							</button>
							<button
								className={styles.btnPrimaryFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={handleSimpanEditJurnal}
								disabled={loading}
							>
								{loading ? "Menyimpan..." : "Simpan Perubahan"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* === MAIN CONTENT === */}
			<div className={styles.dashboardContainer}>
				{/* === VIEW 1: DAFTAR KELAS === */}
				{viewMode === "list" && (
					<div>
						<div className={styles.pageHeader}>
							<div>
								<h1 className={styles.pageTitle}>Daftar Mata Pelajaran & Kelas</h1>
								<p className={styles.pageSubtitle}>
									Pilih mata pelajaran di bawah ini untuk mengisi jurnal dan melihat riwayat presensi.
								</p>
							</div>
						</div>

						{/* --- TABS NAVIGASI KELAS --- */}
						<div className={styles.tabsContainer}>
							{kelasTabs.map((tab) => (
								<button
									key={tab}
									className={`${styles.tabBtn} ${activeTabKelas === tab ? styles.tabActive : ""}`}
									onClick={() => setActiveTabKelas(tab)}
								>
									{tab}
								</button>
							))}
						</div>

						{!filteredJadwal || filteredJadwal.length === 0 ? (
							<div className={styles.emptyStateContainer}>Tidak ada jadwal mengajar untuk kelas ini.</div>
						) : (
							<div className={styles.cardGrid}>
								{filteredJadwal.map((jadwal: any) => {
									const hariIniStr = new Date().toLocaleDateString("en-CA");
									const jurnalHariIni = jadwal.jurnal?.find(
										(j: any) => new Date(j.tanggal).toLocaleDateString("en-CA") === hariIniStr,
									);
									const isSubmitted = !!jurnalHariIni;

									let cardClass = isSubmitted ? styles.statusSelesai : styles.statusBelum;
									let badgeClass = isSubmitted ? styles.badgeSelesai : styles.badgeBelum;
									let statusText = isSubmitted ? "Sudah Diisi" : "Belum Diisi";
									const hariText =
										["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][jadwal.hari] || "";

									return (
										<div key={jadwal.id} className={`${styles.jurnalCard} ${cardClass}`}>
											<div className={styles.cardHeader}>
												<div className={styles.iconBox}>
													<Beaker size={20} />
												</div>
												<div style={{ display: "flex", flexDirection: "column" }}>
													<div className={styles.mapelTitle}>{jadwal.mapel.nama}</div>
													<div className={styles.mapelSubtitle}>{jadwal.kelas.nama}</div>
													<div className={`${styles.badgeStatus} ${badgeClass}`}>{statusText}</div>
												</div>
											</div>

											<div className={styles.cardBody}>
												<div className={styles.infoRow}>
													<Clock size={14} />
													<span>
														<strong style={{ color: "#1e293b" }}>{hariText},</strong> {jadwal.displaySesi}
													</span>
												</div>
												<div className={styles.infoRow}>
													<MapPin size={14} /> {jadwal.ruang || "-"}
												</div>
											</div>

											<div style={{ marginTop: "auto", paddingTop: "1rem" }}>
												<button className={styles.btnPrimaryFull} onClick={() => handleBukaKelas(jadwal)}>
													Kelola Jurnal
												</button>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}

				{/* === VIEW 2: FORM & RIWAYAT === */}
				{viewMode === "detail" && activeJadwal && (
					<div>
						<button className={styles.btnBack} onClick={() => setViewMode("list")}>
							<ArrowLeft size={16} /> Kembali ke Daftar Mata Pelajaran
						</button>

						<div className={styles.pageHeader} style={{ marginBottom: "1.5rem" }}>
							<div>
								<h1 className={styles.pageTitle} style={{ fontSize: "1.5rem" }}>
									{activeJadwal.mapel.nama} - {activeJadwal.kelas.nama}
								</h1>
								<p className={styles.pageSubtitle}>
									<Clock
										size={14}
										style={{ display: "inline", marginRight: "0.25rem", verticalAlign: "text-bottom" }}
									/>
									Jadwal Reguler:{" "}
									{["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][activeJadwal.hari]} (
									{activeJadwal.displaySesi})
								</p>
							</div>
						</div>

						<div className={styles.formSection} style={{ marginBottom: "2.5rem" }}>
							<div
								className={styles.formTitle}
								style={{
									fontSize: "1.15rem",
									marginBottom: "1.5rem",
									borderBottom: "1px solid #e2e8f0",
									paddingBottom: "0.75rem",
								}}
							>
								Buat Jurnal Pertemuan Baru
							</div>

							<div className={styles.formGrid}>
								<div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
									<div>
										<label className={styles.formLabel}>Tanggal Pertemuan *</label>
										<input
											type="date"
											className={styles.formInput}
											value={tanggal}
											onChange={(e) => setTanggal(e.target.value)}
											style={{ backgroundColor: "white" }}
										/>
									</div>

									<div>
										<label className={styles.formLabel}>Waktu Aktual Mengajar *</label>
										<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
											<input
												type="time"
												className={styles.formInput}
												value={waktuMulai}
												onChange={(e) => setWaktuMulai(e.target.value)}
												style={{ backgroundColor: "white", cursor: "pointer" }}
											/>
											<span style={{ color: "#64748b", fontWeight: "bold" }}>s.d</span>
											<input
												type="time"
												className={styles.formInput}
												value={waktuSelesai}
												onChange={(e) => setWaktuSelesai(e.target.value)}
												style={{ backgroundColor: "white", cursor: "pointer" }}
											/>
										</div>
									</div>
								</div>

								<div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
									<div>
										<label className={styles.formLabel}>Topik Materi *</label>
										<textarea
											className={styles.formTextarea}
											style={{ minHeight: "115px" }}
											value={materi}
											onChange={(e) => setMateri(e.target.value)}
											placeholder="Tuliskan materi yang diajarkan hari ini..."
										/>
									</div>

									<div>
										<label className={styles.formLabel}>Tugas Harian (Opsional)</label>
										<textarea
											className={styles.formTextarea}
											style={{ minHeight: "80px" }}
											value={tugas}
											onChange={(e) => setTugas(e.target.value)}
											placeholder="Tuliskan tugas harian jika ada..."
										/>
									</div>

									<div style={{ display: "flex", justifyContent: "flex-end" }}>
										<button
											className={styles.btnPrimaryFull}
											style={{
												width: "auto",
												padding: "0.6rem 1.5rem",
												display: "flex",
												alignItems: "center",
												gap: "0.5rem",
											}}
											onClick={triggerModalSimpanJurnalBaru}
										>
											<Save size={16} /> Simpan Jurnal Baru
										</button>
									</div>
								</div>
							</div>
						</div>

						<div className={styles.tableCard}>
							<div className={styles.tableToolbar}>
								<div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem" }}>
									Riwayat Jurnal & Presensi Kelas
								</div>
							</div>
							<div style={{ overflowX: "auto", width: "100%" }}>
								<table className={styles.tableStyle}>
									<thead>
										<tr>
											<th>No</th>
											<th>Tanggal</th>
											<th>Waktu Mengajar</th>
											<th>Topik Materi</th>
											<th style={{ width: "120px" }}>Kehadiran</th>
											<th>Status QR</th>
											<th style={{ textAlign: "center", width: "280px" }}>Aksi</th>
										</tr>
									</thead>
									<tbody>
										{(() => {
											const sortedJurnal = activeJadwal.jurnal ? [...activeJadwal.jurnal].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()) : [];
											const totalItems = sortedJurnal.length;
											const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
											const startIndex = (currentPageJurnal - 1) * itemsPerPage;
											const paginatedJurnal = sortedJurnal.slice(startIndex, startIndex + itemsPerPage);

											if (totalItems === 0) {
												return (
													<tr>
														<td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
															Belum ada riwayat jurnal.
														</td>
													</tr>
												);
											}
											return paginatedJurnal.map((jurnalItem: any, index: number) => {
												const tglFormatted = new Date(jurnalItem.tanggal).toLocaleDateString("id-ID", {
													year: "numeric",
													month: "long",
													day: "numeric",
												});
												const isQRAktif = !!jurnalItem.qrToken;

												const hariIniStr = new Date().toLocaleDateString("en-CA");
												const tanggalJurnalStr = new Date(jurnalItem.tanggal).toLocaleDateString("en-CA");
												const isHariIni = hariIniStr === tanggalJurnalStr;

												const totalKls = activeJadwal.kelas.riwayatSiswa.length;
												const h = jurnalItem.presensi?.filter((p: any) => p.status === "H").length || 0;
												const is =
													jurnalItem.presensi?.filter((p: any) => p.status === "I" || p.status === "S").length || 0;
												const a = totalKls - h - is;

												return (
													<tr key={jurnalItem.id}>
														<td style={{ fontWeight: 500 }}>{startIndex + index + 1}</td>
														<td style={{ fontWeight: 600, color: "#0f172a" }}>{tglFormatted}</td>
														<td style={{ color: "#475569" }}>
															<div style={{ fontWeight: 600, color: "#1e293b" }}>
																{activeJadwal.displaySesi} ({jurnalItem.waktuMulai && jurnalItem.waktuSelesai
																	? `${jurnalItem.waktuMulai} - ${jurnalItem.waktuSelesai}`
																	: activeJadwal.waktuRentang}{" "}
																WIB)
															</div>
														</td>

														<td>
															<div
																style={{
																	maxWidth: "200px",
																	whiteSpace: "nowrap",
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																}}
																title={jurnalItem.materiBab}
															>
																{jurnalItem.materiBab}
															</div>
														</td>
														<td>
															<div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", fontWeight: 700 }}>
																<span style={{ color: "#10b981" }} title="Hadir">
																	H: {h}
																</span>
																<span style={{ color: "#f59e0b" }} title="Izin/Sakit">
																	I/S: {is}
																</span>
																<span style={{ color: "#ef4444" }} title="Alpha/Belum">
																	A: {a}
																</span>
															</div>
														</td>
														<td>
															{isQRAktif ? (
																<span
																	style={{
																		background: "#d1fae5",
																		color: "#047857",
																		padding: "0.25rem 0.5rem",
																		borderRadius: "4px",
																		fontSize: "0.7rem",
																		fontWeight: 700,
																	}}
																>
																	AKTIF
																</span>
															) : (
																<span
																	style={{
																		background: "#f1f5f9",
																		color: "#64748b",
																		padding: "0.25rem 0.5rem",
																		borderRadius: "4px",
																		fontSize: "0.7rem",
																		fontWeight: 700,
																	}}
																>
																	DITUTUP
																</span>
															)}
														</td>
														<td
															style={{
																display: "flex",
																gap: "0.5rem",
																justifyContent: "center",
																alignItems: "center",
															}}
														>
															<button
																style={{
																	background: "none",
																	border: "none",
																	color: "#3b82f6",
																	cursor: "pointer",
																	display: "flex",
																	alignItems: "center",
																}}
																title="Edit Jurnal"
																onClick={() => openEditModal(jurnalItem)}
															>
																<Edit size={16} />
															</button>

															<button
																style={{
																	background: "none",
																	border: "none",
																	color: "#ef4444",
																	cursor: "pointer",
																	display: "flex",
																	alignItems: "center",
																}}
																title="Hapus Jurnal"
																onClick={() => triggerModalHapusJurnal(jurnalItem.id)}
															>
																<Trash2 size={16} />
															</button>

															{isQRAktif ? (
																<button
																	className={styles.btnOutlineFull}
																	style={{
																		padding: "0.4rem 0.75rem",
																		width: "auto",
																		fontSize: "0.75rem",
																		display: "flex",
																		alignItems: "center",
																		gap: "0.35rem",
																		borderColor: "#ef4444",
																		color: "#ef4444",
																		backgroundColor: "#fef2f2",
																	}}
																	onClick={() => triggerModalTutupQR(jurnalItem.id)}
																>
																	<PowerOff size={14} /> Tutup QR
																</button>
															) : (
																<button
																	className={styles.btnOutlineFull}
																	style={{
																		padding: "0.4rem 0.75rem",
																		width: "auto",
																		fontSize: "0.75rem",
																		display: "flex",
																		alignItems: "center",
																		gap: "0.35rem",
																		opacity: !isHariIni ? 0.5 : 1,
																		cursor: !isHariIni ? "not-allowed" : "pointer",
																	}}
																	onClick={() => triggerModalBukaQR(jurnalItem.id, jurnalItem.tanggal)}
																	disabled={!isHariIni}
																>
																	<QrCode size={14} /> Buka QR
																</button>
															)}

															<button
																className={styles.btnPrimaryFull}
																style={{
																	padding: "0.4rem 0.75rem",
																	width: "auto",
																	fontSize: "0.75rem",
																	backgroundColor: "#f59e0b",
																	display: "flex",
																	alignItems: "center",
																	gap: "0.35rem",
																	border: "none",
																}}
																onClick={() => handleBukaDetailAbsen(jurnalItem)}
															>
																<UserCheck size={14} /> Detail Presensi
															</button>
														</td>
													</tr>
												);
											})
										})()}
									</tbody>
								</table>
							</div>

							{/* PAGINATION UI JURNAL */}
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
								<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
									Menampilkan {activeJadwal.jurnal && activeJadwal.jurnal.length > 0 ? (currentPageJurnal - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPageJurnal * itemsPerPage, (activeJadwal.jurnal || []).length)} dari {(activeJadwal.jurnal || []).length} data
								</span>
								<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
									<button
										disabled={currentPageJurnal === 1}
										onClick={() => setCurrentPageJurnal(currentPageJurnal - 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageJurnal === 1 ? "#f1f5f9" : "white", color: currentPageJurnal === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageJurnal === 1 ? "not-allowed" : "pointer" }}
									>
										Prev
									</button>
									<button
										disabled={currentPageJurnal >= Math.ceil((activeJadwal.jurnal || []).length / itemsPerPage) || (activeJadwal.jurnal || []).length === 0}
										onClick={() => setCurrentPageJurnal(currentPageJurnal + 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageJurnal >= Math.ceil((activeJadwal.jurnal || []).length / itemsPerPage) || (activeJadwal.jurnal || []).length === 0 ? "#f1f5f9" : "white", color: currentPageJurnal >= Math.ceil((activeJadwal.jurnal || []).length / itemsPerPage) || (activeJadwal.jurnal || []).length === 0 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageJurnal >= Math.ceil((activeJadwal.jurnal || []).length / itemsPerPage) || (activeJadwal.jurnal || []).length === 0 ? "not-allowed" : "pointer" }}
									>
										Next
									</button>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* === VIEW 3: DETAIL PRESENSI (MANUAL) === */}
				{viewMode === "presensi" && activeJurnal && activeJadwal && (
					<div>
						<div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" }}>
							Jurnal Mengajar &gt; {activeJadwal.mapel.nama} {activeJadwal.kelas.nama} &gt;{" "}
							<span style={{ fontWeight: 600, color: "#0f172a" }}>Detail Presensi</span>
						</div>

						{/* PERBAIKAN 1: BUNGKUS HEADER PRESENSI DENGAN CLASS CSS AGAR RESPONSIVE */}
						<div className={styles.presensiHeader}>
							<div>
								<h2 className={styles.presensiTitle}>
									Presensi Manual - {activeJadwal.mapel.nama} {activeJadwal.kelas.nama}
								</h2>
								<div className={styles.presensiSubtitle}>
									<CalendarDays size={16} />
									{new Date(activeJurnal.tanggal).toLocaleDateString("id-ID", {
										weekday: "long",
										day: "numeric",
										month: "long",
										year: "numeric",
									})}{" "}
									| {activeJadwal.displaySesi}  ({activeJurnal.waktuMulai && activeJurnal.waktuSelesai
										? `${activeJurnal.waktuMulai} - ${activeJurnal.waktuSelesai}`
										: activeJadwal.waktuRentang}{" "}
									WIB)
								</div>
							</div>
							<button
								className={`${styles.btnOutlineFull} ${styles.btnExportMobile}`}
								onClick={handleDownloadPdf}
								disabled={isDownloading}
							>
								<Download size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.5rem" }} />{" "}
								{isDownloading ? "Memproses PDF..." : "Export PDF"}
							</button>
						</div>

						{/* PERBAIKAN 2: REFACTOR STATS GRID DENGAN CSS CLASS */}
						<div className={styles.statsGrid}>
							<div className={styles.summaryCard}>
								<div className={styles.iconCircleBlue}>
									<Users size={24} color="#3b82f6" />
								</div>
								<div className={styles.statTextContainer}>
									<div className={styles.statLabel}>Total Siswa</div>
									<div className={styles.statValueBlue}>
										{activeJadwal.kelas?.riwayatSiswa?.length || 0}
									</div>
								</div>
							</div>
							<div className={styles.summaryCard}>
								<div className={styles.iconCircleGreen}>
									<CheckCircle2 size={24} color="#10b981" />
								</div>
								<div className={styles.statTextContainer}>
									<div className={styles.statLabel}>Hadir</div>
									<div className={styles.statValueGreen}>
										{activeJadwal.kelas?.riwayatSiswa?.filter((rs: any) => presensiEdits[rs.siswa.id] === "H")
											.length || 0}
									</div>
								</div>
							</div>
							<div className={styles.summaryCard}>
								<div className={styles.iconCircleYellow}>
									<Clock size={24} color="#f59e0b" />
								</div>
								<div className={styles.statTextContainer}>
									<div className={styles.statLabel}>Izin/Sakit</div>
									<div className={styles.statValueYellow}>
										{activeJadwal.kelas?.riwayatSiswa?.filter(
											(rs: any) => presensiEdits[rs.siswa.id] === "I" || presensiEdits[rs.siswa.id] === "S",
										).length || 0}
									</div>
								</div>
							</div>
							<div className={styles.summaryCard}>
								<div className={styles.iconCircleRed}>
									<X size={24} color="#ef4444" />
								</div>
								<div className={styles.statTextContainer}>
									<div className={styles.statLabel}>Alpha/Belum</div>
									<div className={styles.statValueRed}>
										{(activeJadwal.kelas?.riwayatSiswa?.length || 0) -
											(activeJadwal.kelas?.riwayatSiswa?.filter((rs: any) => presensiEdits[rs.siswa.id] === "H")
												.length || 0) -
											(activeJadwal.kelas?.riwayatSiswa?.filter(
												(rs: any) => presensiEdits[rs.siswa.id] === "I" || presensiEdits[rs.siswa.id] === "S",
											).length || 0)}
									</div>
								</div>
							</div>
						</div>

						<div className={styles.tableCard}>
							{/* PERBAIKAN 3: REFACTOR TABLE TOOLBAR & SEARCH BAR */}
							<div className={styles.tableToolbar}>
								<div className={styles.tableTitle}>Daftar Kehadiran</div>
								<div className={styles.searchWrapper}>
									<div className={styles.searchContainer}>
										<Search size={16} className={styles.searchIcon} />
										<input
											type="text"
											placeholder="Cari nama siswa..."
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											className={styles.searchInput}
										/>
									</div>
								</div>
							</div>
							<div style={{ overflowX: "auto", width: "100%" }}>
								<table className={styles.tableStyle}>
									<thead>
										<tr>
											<th>No</th>
											<th
												style={{ cursor: "pointer" }}
												onClick={() => {
													if (sortColumn === "nis") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
													else { setSortColumn("nis"); setSortDirection("asc"); }
												}}
											>
												<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
													NIS
													{sortColumn === "nis" ? (sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : (
														<div style={{ display: "flex", flexDirection: "column", opacity: 0.3 }}>
															<ArrowUp size={10} style={{ marginBottom: "-4px" }} />
															<ArrowDown size={10} />
														</div>
													)}
												</div>
											</th>
											<th
												style={{ cursor: "pointer" }}
												onClick={() => {
													if (sortColumn === "nama") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
													else { setSortColumn("nama"); setSortDirection("asc"); }
												}}
											>
												<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
													Nama Siswa
													{sortColumn === "nama" ? (sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : (
														<div style={{ display: "flex", flexDirection: "column", opacity: 0.3 }}>
															<ArrowUp size={10} style={{ marginBottom: "-4px" }} />
															<ArrowDown size={10} />
														</div>
													)}
												</div>
											</th>
											<th
												style={{ cursor: "pointer" }}
												onClick={() => {
													if (sortColumn === "jk") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
													else { setSortColumn("jk"); setSortDirection("asc"); }
												}}
											>
												<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
													L/P
													{sortColumn === "jk" ? (sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : (
														<div style={{ display: "flex", flexDirection: "column", opacity: 0.3 }}>
															<ArrowUp size={10} style={{ marginBottom: "-4px" }} />
															<ArrowDown size={10} />
														</div>
													)}
												</div>
											</th>
											<th
												style={{ cursor: "pointer" }}
												onClick={() => {
													if (sortColumn === "status") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
													else { setSortColumn("status"); setSortDirection("asc"); }
												}}
											>
												<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
													Status Terakhir
													{sortColumn === "status" ? (sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : (
														<div style={{ display: "flex", flexDirection: "column", opacity: 0.3 }}>
															<ArrowUp size={10} style={{ marginBottom: "-4px" }} />
															<ArrowDown size={10} />
														</div>
													)}
												</div>
											</th>
											{activeJurnal.tugas && (
												<th
													style={{ cursor: "pointer", textAlign: "center", width: "120px" }}
													onClick={() => {
														if (sortColumn === "nilai") setSortDirection(sortDirection === "asc" ? "desc" : "asc");
														else { setSortColumn("nilai"); setSortDirection("asc"); }
													}}
												>
													<div style={{ display: "flex", alignItems: "center", gap: "0.25rem", justifyContent: "center" }}>
														Nilai Tugas
														{sortColumn === "nilai" ? (sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : (
															<div style={{ display: "flex", flexDirection: "column", opacity: 0.3 }}>
																<ArrowUp size={10} style={{ marginBottom: "-4px" }} />
																<ArrowDown size={10} />
															</div>
														)}
													</div>
												</th>
											)}
											<th style={{ textAlign: "center", width: "150px" }}>Aksi Manual</th>
										</tr>
									</thead>
									<tbody>
										{(() => {
											let sortedData = [...activeJadwal.kelas.riwayatSiswa];

											// Gunakan fungsi filter di sini
											if (search) {
												sortedData = sortedData.filter((rs: any) => {
													const searchTerm = search.toLowerCase();
													const namaMatch = (rs.siswa.user?.nama || "").toLowerCase().includes(searchTerm);
													const nisMatch = (rs.siswa.nis || "").toLowerCase().includes(searchTerm);
													return namaMatch || nisMatch;
												});
											}

											sortedData.sort((a, b) => {
												let valA: any = "";
												let valB: any = "";

												switch (sortColumn) {
													case "nis":
														valA = a.siswa.nis;
														valB = b.siswa.nis;
														break;
													case "nama":
														valA = (a.siswa.user?.nama || "").toLowerCase();
														valB = (b.siswa.user?.nama || "").toLowerCase();
														break;
													case "jk":
														valA = a.siswa.jenisKelamin;
														valB = b.siswa.jenisKelamin;
														break;
													case "status":
														valA = presensiEdits[a.siswa.id] || "A";
														valB = presensiEdits[b.siswa.id] || "A";
														break;
													case "nilai":
														valA = nilaiTugasEdits[a.siswa.id] || -1;
														valB = nilaiTugasEdits[b.siswa.id] || -1;
														break;
												}

												if (valA < valB) return sortDirection === "asc" ? -1 : 1;
												if (valA > valB) return sortDirection === "asc" ? 1 : -1;
												return 0;
											});

											const totalItems = sortedData.length;
											const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
											const startIndex = (currentPageRekap - 1) * itemsPerPage;
											const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

											if (totalItems === 0) {
												return (
													<tr>
														<td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b", fontStyle: "italic" }}>
															Tidak ada siswa yang cocok dengan pencarian "{search}".
														</td>
													</tr>
												);
											}

											return paginatedData.map((rs: any, index: number) => {
												const siswa = rs.siswa;
												const originalAbsensi = activeJurnal.presensi?.find((p: any) => p.siswaId === siswa.id);
												const currentStatus = presensiEdits[siswa.id] || "";

												let badgeStyle = { bg: "#f1f5f9", text: "#64748b", label: "Belum Absen" };
												if (currentStatus === "H") badgeStyle = { bg: "#d1fae5", text: "#047857", label: "Hadir" };
												else if (currentStatus === "I") badgeStyle = { bg: "#fef3c7", text: "#b45309", label: "Izin" };
												else if (currentStatus === "S") badgeStyle = { bg: "#dbeafe", text: "#1d4ed8", label: "Sakit" };
												else if (currentStatus === "A") badgeStyle = { bg: "#fee2e2", text: "#b91c1c", label: "Alpha" };

												return (
													<tr key={siswa.id}>
														<td>{startIndex + index + 1}</td>
														<td style={{ fontWeight: 500 }}>{siswa.nis}</td>
														<td style={{ fontWeight: 600, color: "#0f172a" }}>{siswa.user?.nama || "Nama Siswa"}</td>
														<td>{siswa.jenisKelamin === "Laki-laki" ? "L" : "P"}</td>
														<td>
															<span
																style={{
																	background: badgeStyle.bg,
																	color: badgeStyle.text,
																	padding: "0.35rem 0.75rem",
																	borderRadius: "0.375rem",
																	fontSize: "0.75rem",
																	fontWeight: 700,
																}}
															>
																{badgeStyle.label}{" "}
																{originalAbsensi?.waktuScan && currentStatus === originalAbsensi.status
																	? `(${new Date(originalAbsensi.waktuScan).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})`
																	: ""}
															</span>
														</td>
														{activeJurnal.tugas && (
															<td style={{ textAlign: "center" }}>
																<input
																	type="number"
																	className={styles.formInput}
																	style={{ width: "80px", padding: "0.25rem 0.5rem", textAlign: "center", margin: "0 auto" }}
																	placeholder="0-100"
																	value={nilaiTugasEdits[siswa.id] === undefined ? "" : nilaiTugasEdits[siswa.id]}
																	onChange={(e) => {
																		const val = e.target.value === "" ? undefined : parseInt(e.target.value);
																		if (val !== undefined && (val < 0 || val > 100)) return;
																		setNilaiTugasEdits({ ...nilaiTugasEdits, [siswa.id]: val as any });
																	}}
																/>
															</td>
														)}
														<td style={{ textAlign: "center" }}>
															<select
																className={styles.filterSelect}
																style={{
																	width: "100%",
																	padding: "0.4rem",
																	cursor: "pointer",
																	fontWeight: 600,
																	color: badgeStyle.text,
																	borderColor: badgeStyle.text,
																}}
																value={currentStatus}
																onChange={(e) => {
																	const newStatus = e.target.value;
																	setPresensiEdits({ ...presensiEdits, [siswa.id]: newStatus });
																	if (newStatus === "I") {
																		setCurrentSiswaIzin({ id: siswa.id, nama: siswa.user?.nama || "Siswa" });
																		setInputAlasan(alasanIzinEdits[siswa.id] || "");
																		setIsModalIzinOpen(true);
																	}
																}}
															>
																<option value="" disabled>
																	Pilih Aksi
																</option>
																<option value="H">Hadir</option>
																<option value="I">Izin</option>
																<option value="S">Sakit</option>
																<option value="A">Alpha</option>
															</select>
														</td>
													</tr>
												);
											});
										})()}
									</tbody>
								</table>
							</div>

							{/* PAGINATION UI REKAP */}
							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
								<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
									Menampilkan {activeJadwal.kelas?.riwayatSiswa && activeJadwal.kelas.riwayatSiswa.length > 0 ? (currentPageRekap - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPageRekap * itemsPerPage, (activeJadwal.kelas?.riwayatSiswa || []).length)} dari {(activeJadwal.kelas?.riwayatSiswa || []).length} data
								</span>
								<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
									<button
										disabled={currentPageRekap === 1}
										onClick={() => setCurrentPageRekap(currentPageRekap - 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageRekap === 1 ? "#f1f5f9" : "white", color: currentPageRekap === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageRekap === 1 ? "not-allowed" : "pointer" }}
									>
										Prev
									</button>
									<button
										disabled={currentPageRekap >= Math.ceil((activeJadwal.kelas?.riwayatSiswa || []).length / itemsPerPage) || (activeJadwal.kelas?.riwayatSiswa || []).length === 0}
										onClick={() => setCurrentPageRekap(currentPageRekap + 1)}
										style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageRekap >= Math.ceil((activeJadwal.kelas?.riwayatSiswa || []).length / itemsPerPage) || (activeJadwal.kelas?.riwayatSiswa || []).length === 0 ? "#f1f5f9" : "white", color: currentPageRekap >= Math.ceil((activeJadwal.kelas?.riwayatSiswa || []).length / itemsPerPage) || (activeJadwal.kelas?.riwayatSiswa || []).length === 0 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageRekap >= Math.ceil((activeJadwal.kelas?.riwayatSiswa || []).length / itemsPerPage) || (activeJadwal.kelas?.riwayatSiswa || []).length === 0 ? "not-allowed" : "pointer" }}
									>
										Next
									</button>
								</div>
							</div>
						</div>

						<div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
							<button
								className={styles.btnOutlineFull}
								style={{ width: "auto" }}
								onClick={() => setViewMode("detail")}
							>
								Batal & Kembali
							</button>
							<button
								className={styles.btnPrimaryFull}
								style={{ width: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}
								onClick={triggerModalSimpanPresensi}
							>
								<Save size={16} /> Simpan Perubahan Presensi
							</button>
						</div>

						{/* ================================================================= */}
						{/* AREA TERSEMBUNYI UNTUK CETAK PDF (SISTEM PAGINATION MANUAL) */}
						{/* ================================================================= */}
						<div style={{ display: "none" }}>
							<div id="pdf-presensi-content" style={{ width: "100%", backgroundColor: "#fff", color: "#000", fontFamily: "Arial, sans-serif" }}>
								{(() => {
									let sortedData = [...activeJadwal.kelas.riwayatSiswa];
									sortedData.sort((a, b) => (a.siswa.user?.nama || "").localeCompare(b.siswa.user?.nama || ""));

									const siswaChunks = chunkArray(sortedData, MAX_ROWS);
									const totalPages = siswaChunks.length;

									return siswaChunks.map((chunk, chunkIdx) => {
										const isLastPage = chunkIdx === totalPages - 1;

										const hCount = activeJadwal.kelas?.riwayatSiswa?.filter((rs: any) => presensiEdits[rs.siswa.id] === "H").length || 0;
										const isCount = activeJadwal.kelas?.riwayatSiswa?.filter((rs: any) => presensiEdits[rs.siswa.id] === "I" || presensiEdits[rs.siswa.id] === "S").length || 0;
										const aCount = (activeJadwal.kelas?.riwayatSiswa?.length || 0) - hCount - isCount;

										return (
											<div key={`page-${chunkIdx}`}>
												<PageContainer isLast={isLastPage}>
													<KopSurat />

													{chunkIdx === 0 && (
														<table style={{ width: "100%", marginBottom: "20px", fontSize: "11pt", borderCollapse: "collapse" }}>
															<tbody>
																<tr>
																	<td style={{ width: "20%", padding: "4px 0", fontWeight: "bold" }}>Mata Pelajaran</td>
																	<td style={{ width: "5%", padding: "4px 0" }}>:</td>
																	<td style={{ width: "75%", padding: "4px 0" }}>{activeJadwal.mapel.nama}</td>
																</tr>
																<tr>
																	<td style={{ padding: "4px 0", fontWeight: "bold" }}>Kelas</td>
																	<td style={{ padding: "4px 0" }}>:</td>
																	<td style={{ padding: "4px 0" }}>{activeJadwal.kelas.nama}</td>
																</tr>
																<tr>
																	<td style={{ padding: "4px 0", fontWeight: "bold" }}>Topik Jurnal</td>
																	<td style={{ padding: "4px 0" }}>:</td>
																	<td style={{ padding: "4px 0" }}>{activeJurnal.materiBab || "-"}</td>
																</tr>
																<tr>
																	<td style={{ padding: "4px 0", fontWeight: "bold" }}>Tugas</td>
																	<td style={{ padding: "4px 0" }}>:</td>
																	<td style={{ padding: "4px 0" }}>{activeJurnal.tugas || "-"}</td>
																</tr>
																<tr>
																	<td style={{ padding: "4px 0", fontWeight: "bold" }}>Kendala KBM</td>
																	<td style={{ padding: "4px 0" }}>:</td>
																	<td style={{ padding: "4px 0" }}>{activeJurnal.catatan || "-"}</td>
																</tr>
																<tr>
																	<td style={{ padding: "4px 0", fontWeight: "bold" }}>Tanggal & Waktu</td>
																	<td style={{ padding: "4px 0" }}>:</td>
																	<td style={{ padding: "4px 0" }}>
																		{new Date(activeJurnal.tanggal).toLocaleDateString("id-ID", {
																			weekday: "long",
																			day: "numeric",
																			month: "long",
																			year: "numeric",
																		})}{" "}
																		/ {activeJadwal.displaySesi} ({activeJurnal.waktuMulai && activeJurnal.waktuSelesai
																			? `${activeJurnal.waktuMulai} - ${activeJurnal.waktuSelesai}`
																			: activeJadwal.waktuRentang}{" "}
																		WIB)
																	</td>
																</tr>
																<tr>
																	<td style={{ padding: "4px 0", fontWeight: "bold" }}>Kehadiran</td>
																	<td style={{ padding: "4px 0" }}>:</td>
																	<td style={{ padding: "4px 0" }}>
																		Hadir: {hCount} | Izin/Sakit: {isCount} | Alpha: {aCount}
																	</td>
																</tr>
															</tbody>
														</table>
													)}
													{chunkIdx > 0 && (
														<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>
															Daftar Kehadiran (Lanjutan)
														</h3>
													)}

													<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
														<thead style={{ display: "table-header-group" }}>
															<tr>
																<th style={{ border: "1px solid #000", padding: "8px", backgroundColor: "#f1f5f9", width: "5%" }}>No</th>
																<th style={{ border: "1px solid #000", padding: "8px", backgroundColor: "#f1f5f9", width: "20%" }}>NIS</th>
																<th style={{ border: "1px solid #000", padding: "8px", backgroundColor: "#f1f5f9", width: "45%" }}>Nama Siswa</th>
																<th style={{ border: "1px solid #000", padding: "8px", backgroundColor: "#f1f5f9", width: "15%" }}>Status</th>
																{activeJurnal.tugas && (
																	<th style={{ border: "1px solid #000", padding: "8px", backgroundColor: "#f1f5f9", width: "15%" }}>Nilai Tugas</th>
																)}
															</tr>
														</thead>
														<tbody>
															{chunk.map((rs: any, index: number) => {
																const globalIdx = (chunkIdx * MAX_ROWS) + index + 1;
																const siswa = rs.siswa;
																const currentStatus = presensiEdits[siswa.id] || "A";

																let statusLabel = "Alpha";
																if (currentStatus === "H") statusLabel = "Hadir";
																else if (currentStatus === "I") {
																	statusLabel = "Izin";
																	if (alasanIzinEdits[siswa.id]) statusLabel += ` (${alasanIzinEdits[siswa.id]})`;
																}
																else if (currentStatus === "S") statusLabel = "Sakit";

																return (
																	<tr key={siswa.id}>
																		<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{globalIdx}</td>
																		<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{siswa.nis}</td>
																		<td style={{ border: "1px solid #000", padding: "6px" }}>{siswa.user?.nama}</td>
																		<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{statusLabel}</td>
																		{activeJurnal.tugas && (
																			<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
																				{nilaiTugasEdits[siswa.id] !== undefined ? nilaiTugasEdits[siswa.id] : "-"}
																			</td>
																		)}
																	</tr>
																);
															})}
														</tbody>
													</table>
													<PageFooter current={chunkIdx + 1} total={totalPages} />
												</PageContainer>
												{!isLastPage && <div className="html2pdf__page-break"></div>}
											</div>
										);
									});
								})()}
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}