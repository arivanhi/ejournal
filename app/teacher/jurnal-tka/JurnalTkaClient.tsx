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
	Upload,
} from "lucide-react";
import styles from "../jurnal/jurnal.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
	buatJurnalTkaAction,
	simpanPresensiTkaAction,
	updateJurnalTkaAction,
} from "./actions";
import {
	aktifkanPresensiQR,
	tutupPresensiQR,
	hapusJurnalAction,
} from "../jurnal/actions";

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
				<p style={{ margin: 0, fontSize: "10pt", color: "#000" }}>Website: sman2brebes.sch.id - Email: smadabes@gmail.com</p>
			</div>
			<div style={{ width: "120px" }}></div>
		</div>
		<div style={{ borderBottom: "1px solid black" }}></div>
	</div>
);


export default function JurnalTkaClient({
	jadwalTka,
	user,
}: {
	jadwalTka: any[];
	user: any;
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
	const [isTerlambatEdits, setIsTerlambatEdits] = useState<Record<string, boolean>>({});
	const [alasanTerlambatEdits, setAlasanTerlambatEdits] = useState<Record<string, string>>({});
	const [fileBuktiEdits, setFileBuktiEdits] = useState<Record<string, string>>({});
	const [uploadingBukti, setUploadingBukti] = useState(false);
	const [fileInputKey, setFileInputKey] = useState(Date.now());

	const [isModalTerlambatOpen, setIsModalTerlambatOpen] = useState(false);
	const [currentSiswaTerlambat, setCurrentSiswaTerlambat] = useState<{ id: string; nama: string } | null>(null);
	const [inputAlasanTerlambat, setInputAlasanTerlambat] = useState("");

	const [sortColumn, setSortColumn] = useState<"nis" | "nama" | "jk" | "status" | "nilai">("nama");
	const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

	const [isModalIzinOpen, setIsModalIzinOpen] = useState(false);
	const [currentSiswaIzin, setCurrentSiswaIzin] = useState<{ id: string; nama: string } | null>(null);
	const [inputAlasan, setInputAlasan] = useState("");
	const [search, setSearch] = useState("");

	const [isDownloading, setIsDownloading] = useState(false);

	// --- LOGIKA TKA ---
	const groupedJadwal = useMemo(() => {
		const grouped: any[] = [];

		const sortedJadwal = [...(jadwalTka || [])].sort((a, b) => {
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
				!isNaN(jamParsed) && curr.hari !== 0
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
						mergedJurnals.forEach((j) => {
							uniqueJurnalsMap.set(j.id, j);
						});
						last.jurnal = Array.from(uniqueJurnalsMap.values()).sort(
							(a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
						);
						return;
					}
				}
			}

			// Add as new entry
			let displaySesi = "Jadwal Fleksibel";
			let waktuRentang = "-";
			let jams: number[] = [];

			if (curr.hari !== 0 && !isNaN(jamParsed)) {
				displaySesi = `Jam ${jamParsed}`;
				waktuRentang = getWaktuString([jamParsed]);
				jams = [jamParsed];
			}

			grouped.push({
				...curr,
				displaySesi,
				waktuRentang,
				jams,
			});
		});

		return grouped;
	}, [jadwalTka]);

	const kelasTabs = useMemo(() => {
		if (!groupedJadwal) return ["Semua Kelas"];
		const uniqueKelas = Array.from(new Set(groupedJadwal.map((j) => j.kelas?.nama))).filter(Boolean) as string[];
		return ["Semua Kelas", ...uniqueKelas.sort()];
	}, [groupedJadwal]);

	const jadwalAktif = useMemo(() => {
		return groupedJadwal;
	}, [groupedJadwal]);

	const filteredJadwal = useMemo(() => {
		if (!jadwalAktif) return [];
		if (activeTabKelas === "Semua Kelas") return jadwalAktif;
		return jadwalAktif.filter((j) => j.kelas?.nama === activeTabKelas);
	}, [jadwalAktif, activeTabKelas]);

	useEffect(() => {
		if (activeJadwal && groupedJadwal) {
			const updatedJadwal = groupedJadwal.find((j) => j.id === activeJadwal.id);
			if (updatedJadwal) {
				setActiveJadwal(updatedJadwal);
			}
		}
	}, [groupedJadwal, activeJadwal?.id]);

	const handleSaveNilaiTugas = (siswaId: string, val: string) => {
		const num = parseFloat(val);
		setNilaiTugasEdits((prev) => ({ ...prev, [siswaId]: isNaN(num) ? 0 : num }));
	};

	const handleMassalHadirClick = () => {
		setModal({
			isOpen: true,
			title: "Tandai Semua Hadir",
			message: "Siswa yang belum diisi presensinya akan otomatis ditandai sebagai Hadir. Data yang sudah terisi (seperti Sakit/Izin) tidak akan tertimpa. Apakah Anda yakin ingin melanjutkan?",
			onConfirm: () => {
				const newEdits = { ...presensiEdits };
				let updatedCount = 0;
				activeJadwal?.kelas?.riwayatSiswa?.forEach((rs: any) => {
					const sid = rs.siswa?.id || rs.siswaId;
					if (!newEdits[sid]) {
						newEdits[sid] = "H";
						updatedCount++;
					}
				});
				setPresensiEdits(newEdits);

				setToasts((prev) => [
					...prev,
					{
						id: Date.now(),
						message: `${updatedCount} siswa berhasil ditandai Hadir secara massal!`,
						type: "success",
					},
				]);
				setModal(null);
			},
		});
	};

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
		setViewMode("detail");
	};

	const handleBuatJurnal = async () => {
		if (!materi || !waktuMulai || !waktuSelesai) {
			setToasts((prev) => [...prev, { id: Date.now(), message: "Materi, Waktu Mulai, dan Waktu Selesai wajib diisi!", type: "error" }]);
			return;
		}

		setLoading(true);
		
		try {
			const siswaIds = activeJadwal?.kelas?.riwayatSiswa?.map((r: any) => r.siswa?.id || r.siswaId) || [];

			const data = {
				jadwalId: activeJadwal.id,
				tanggal,
				waktuMulai,
				waktuSelesai,
				materi,
				tujuan: "",
				catatan: "",
				tugas,
				siswaIds
			};

			const result = await buatJurnalTkaAction(data);
			if (result.success) {
				setMateri("");
				setTugas("");
				setToasts((prev) => [...prev, { id: Date.now(), message: "Jurnal TKA berhasil disimpan & disinkronisasi ke seluruh tim!", type: "success" }]);
			} else {
				setToasts((prev) => [...prev, { id: Date.now(), message: result.message || "Gagal menyimpan", type: "error" }]);
			}
		} catch (error: any) {
			console.error("Terjadi kesalahan:", error);
			setToasts((prev) => [...prev, { id: Date.now(), message: "Terjadi kesalahan internal", type: "error" }]);
		} finally {
			setLoading(false);
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

	const handleSimpanEdit = async () => {
		if (!editMateri || !editWaktuMulai || !editWaktuSelesai) {
			setToasts((prev) => [...prev, { id: Date.now(), message: "Materi dan waktu wajib diisi!", type: "error" }]);
			return;
		}
		setLoading(true);
		const result = await updateJurnalTkaAction(editJurnalId, {
			tanggal: editTanggal,
			waktuMulai: editWaktuMulai,
			waktuSelesai: editWaktuSelesai,
			materi: editMateri,
			tugas: editTugas,
		});
		if (result.success) {
			setIsEditModalOpen(false);
			setToasts((prev) => [...prev, { id: Date.now(), message: "Jurnal berhasil diupdate ke seluruh tim!", type: "success" }]);
		} else {
			setToasts((prev) => [...prev, { id: Date.now(), message: result.message || "Gagal update", type: "error" }]);
		}
		setLoading(false);
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
		const data = Object.keys(presensiEdits).map((siswaId) => ({
			siswaId,
			status: presensiEdits[siswaId] === "D" ? "H" : presensiEdits[siswaId],
			nilaiTugas: nilaiTugasEdits[siswaId],
			alasanIzin: alasanIzinEdits[siswaId] || null,
			isDispensasi: presensiEdits[siswaId] === "D",
			isTerlambat: isTerlambatEdits[siswaId] || false,
			alasanTerlambat: alasanTerlambatEdits[siswaId] || null,
			fileBukti: fileBuktiEdits[siswaId] || null
		}));
		const result = await simpanPresensiTkaAction(activeJurnal.id, data as any);
		setLoading(false);
		setModal(null);
		
		if (result.success) {
			setToasts((prev) => [...prev, { id: Date.now(), message: "Presensi TKA tersimpan ke seluruh guru tim!", type: "success" }]);
			setPresensiEdits({});
			setNilaiTugasEdits({});
			setAlasanIzinEdits({});
			setIsTerlambatEdits({});
			setAlasanTerlambatEdits({});
			setFileBuktiEdits({});
			setIsModalIzinOpen(false);
			setIsModalTerlambatOpen(false);
			setViewMode("detail");
		} else {
			setToasts((prev) => [...prev, { id: Date.now(), message: result.message || "Gagal menyimpan", type: "error" }]);
		}
	};

	const triggerModalSimpanJurnalBaru = () => {
		if (!tanggal || !materi || !waktuMulai || !waktuSelesai) {
			showToast("Peringatan: Waktu dan Topik Materi wajib diisi!", "error");
			return;
		}

		setModal({
			isOpen: true,
			title: "Simpan Jurnal Baru?",
			message: `Menyimpan jurnal untuk tanggal ${new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} jam ${waktuMulai} - ${waktuSelesai}.`,
			onConfirm: () => {
				setModal(null);
				handleBuatJurnal();
			},
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
		const initialTerlambat: Record<string, boolean> = {};
		const initialAlasanTerlambat: Record<string, string> = {};
		const initialFileBukti: Record<string, string> = {};
		jurnal.presensi?.forEach((p: any) => {
			initialEdits[p.siswaId] = p.isDispensasi ? "D" : p.status;
			initialTerlambat[p.siswaId] = p.isTerlambat || false;
			if (p.alasanTerlambat) {
				initialAlasanTerlambat[p.siswaId] = p.alasanTerlambat;
			}
			if (p.alasan || p.alasanIzin) {
				initialAlasan[p.siswaId] = p.alasan || p.alasanIzin;
			}
			if (p.fileBukti) {
				initialFileBukti[p.siswaId] = p.fileBukti;
			}
			if (p.nilaiTugas !== null && p.nilaiTugas !== undefined) {
				initialNilai[p.siswaId] = p.nilaiTugas;
			}
		});
		setPresensiEdits(initialEdits);
		setNilaiTugasEdits(initialNilai);
		setAlasanIzinEdits(initialAlasan);
		setIsTerlambatEdits(initialTerlambat);
		setAlasanTerlambatEdits(initialAlasanTerlambat);
		setFileBuktiEdits(initialFileBukti);
		setViewMode("presensi");
	};

	const MAX_ROWS = 18;
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
							<AlertTriangle size={24} color="#f59e0b" /> Alasan Keterangan
						</div>
						<div className={styles.modalMessage}>Masukkan alasan untuk siswa <strong>{currentSiswaIzin.nama}</strong>:</div>
						<div style={{ marginBottom: "1.5rem" }}>
							<textarea
								className={styles.formTextarea}
								style={{ minHeight: "80px", width: "100%" }}
								placeholder="Sakit perut, keperluan keluarga, dll..."
								value={inputAlasan}
								onChange={(e) => setInputAlasan(e.target.value)}
							/>
						</div>
						{(presensiEdits[currentSiswaIzin.id] === "I" || presensiEdits[currentSiswaIzin.id] === "S" || presensiEdits[currentSiswaIzin.id] === "D") && (
							<div style={{ marginBottom: "1.5rem" }}>
								<label className={styles.formLabel}>Upload Surat Bukti (Opsional)</label>
								<div style={{ position: "relative", overflow: "hidden", display: "inline-block", width: "100%" }}>
									<label
										style={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: "0.5rem",
											padding: "0.6rem 1rem",
											backgroundColor: "#f8fafc",
											color: "#334155",
											border: "1px dashed #cbd5e1",
											borderRadius: "0.5rem",
											cursor: "pointer",
											fontWeight: 500,
											fontSize: "0.875rem",
											transition: "all 0.2s"
										}}
									>
										<Upload size={16} /> {uploadingBukti ? "Mengunggah..." : "Pilih File Surat Bukti"}
										<input
											key={fileInputKey}
											type="file"
											accept="image/*,.pdf"
											style={{ display: "none" }}
											onChange={async (e) => {
												if (e.target.files && e.target.files[0]) {
													const file = e.target.files[0];
													if (file.size > 10 * 1024 * 1024) {
														alert("Ukuran file maksimal 10MB!");
														return;
													}
													setUploadingBukti(true);
													const formData = new FormData();
													formData.append("file", file);
													formData.append("kelasName", activeJadwal?.kelas?.nama || "Unknown");
													formData.append("siswaName", currentSiswaIzin.nama.replace(/[^a-zA-Z0-9]/g, "_"));

													try {
														const res = await fetch("/api/upload", {
															method: "POST",
															body: formData,
														});
														const data = await res.json();
														if (data.success) {
															setFileBuktiEdits({ ...fileBuktiEdits, [currentSiswaIzin.id]: data.fileUrl });
															showToast("Berhasil upload surat bukti!", "success");
														} else {
															showToast("Gagal upload surat: " + data.message, "error");
														}
													} catch (err) {
														showToast("Terjadi kesalahan sistem saat upload", "error");
													} finally {
														setUploadingBukti(false);
													}
												}
											}}
											disabled={uploadingBukti}
										/>
									</label>
								</div>
								{fileBuktiEdits[currentSiswaIzin.id] && !uploadingBukti && (
									<div style={{ fontSize: "0.8rem", color: "#10b981", marginTop: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", padding: "0.5rem", backgroundColor: "#ecfdf5", borderRadius: "0.375rem" }}>
										<CheckCircle2 size={14} /> File tersimpan: <a href={fileBuktiEdits[currentSiswaIzin.id]} target="_blank" rel="noreferrer" style={{ textDecoration: "underline", fontWeight: 600 }}>Lihat Surat</a>
									</div>
								)}
							</div>
						)}
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
									showToast(`Keterangan berhasil disimpan`, "success");
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

			{/* === MODAL TERLAMBAT === */}
			{isModalTerlambatOpen && currentSiswaTerlambat && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContent}>
						<div className={styles.modalTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
							<AlertTriangle size={24} color="#ef4444" /> Keterangan Terlambat
						</div>
						<div className={styles.modalMessage}>Masukkan alasan keterlambatan untuk siswa <strong>{currentSiswaTerlambat.nama}</strong>:</div>
						<div style={{ marginBottom: "1.5rem" }}>
							<textarea
								className={styles.formTextarea}
								style={{ minHeight: "80px", width: "100%" }}
								placeholder="Bangun kesiangan, ban bocor, dll..."
								value={inputAlasanTerlambat}
								onChange={(e) => setInputAlasanTerlambat(e.target.value)}
							/>
						</div>
						<div className={styles.modalActions}>
							<button
								className={styles.btnOutlineFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => {
									setIsTerlambatEdits({ ...isTerlambatEdits, [currentSiswaTerlambat.id]: false });
									setIsModalTerlambatOpen(false);
									setCurrentSiswaTerlambat(null);
								}}
							>
								Batal
							</button>
							<button
								className={styles.btnPrimaryFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => {
									setAlasanTerlambatEdits({ ...alasanTerlambatEdits, [currentSiswaTerlambat.id]: inputAlasanTerlambat });
									showToast(`Alasan keterlambatan berhasil disimpan`, "success");
									setIsModalTerlambatOpen(false);
									setCurrentSiswaTerlambat(null);
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
								onClick={handleSimpanEdit}
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
													<MapPin size={14} /> {jadwal.kelas?.tempat || jadwal.ruang || "-"}
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
								<p className={styles.pageSubtitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
									<span>
										<Clock size={14} style={{ display: "inline", marginRight: "0.25rem", verticalAlign: "text-bottom" }} />
										Jadwal:{" "}
										{["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][activeJadwal.hari]} (
										{activeJadwal.displaySesi})
									</span>
									<span style={{ color: "#cbd5e1" }}>|</span>
									<span>
										<MapPin size={14} style={{ display: "inline", marginRight: "0.25rem", verticalAlign: "text-bottom" }} />
										Tempat: {activeJadwal.kelas?.tempat || activeJadwal.ruang || "-"}
									</span>
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
										{activeJadwal.kelas?.riwayatSiswa?.filter((rs: any) => presensiEdits[rs.siswa.id] === "H" || presensiEdits[rs.siswa.id] === "D")
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
											(activeJadwal.kelas?.riwayatSiswa?.filter((rs: any) => presensiEdits[rs.siswa.id] === "H" || presensiEdits[rs.siswa.id] === "D")
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
								<div className={styles.searchWrapper} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
									<button
										onClick={handleMassalHadirClick}
										className={styles.btnOutlineFull}
										style={{ padding: "0.5rem 1rem", height: "100%" }}
									>
										<UserCheck size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: "0.25rem" }} /> Tandai Semua Hadir
									</button>
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
											<th>Alasan</th>
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
														<td colSpan={activeJurnal.tugas ? 8 : 7} style={{ textAlign: "center", padding: "3rem", color: "#64748b", fontStyle: "italic" }}>
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
												else if (currentStatus === "D") badgeStyle = { bg: "#d1fae5", text: "#047857", label: "Hadir Dispensasi" };
												else if (currentStatus === "I") badgeStyle = { bg: "#fef3c7", text: "#b45309", label: "Izin" };
												else if (currentStatus === "S") badgeStyle = { bg: "#dbeafe", text: "#1d4ed8", label: "Sakit" };
												else if (currentStatus === "A") badgeStyle = { bg: "#fee2e2", text: "#b91c1c", label: "Alpha" };

												return (
													<tr key={siswa.id}>
														<td>{startIndex + index + 1}</td>
														<td style={{ fontWeight: 500 }}>{siswa.nis}</td>
														<td style={{ fontWeight: 600, color: "#0f172a" }}>
															<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
																{siswa.user?.nama || "Nama Siswa"}
																<button
																	style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}
																	onClick={() => {
																		const isCurrentlyLate = isTerlambatEdits[siswa.id];
																		setIsTerlambatEdits({ ...isTerlambatEdits, [siswa.id]: !isCurrentlyLate });
																		if (!isCurrentlyLate) {
																			// Turning it ON, open modal
																			setCurrentSiswaTerlambat({ id: siswa.id, nama: siswa.user?.nama || "Siswa" });
																			setInputAlasanTerlambat(alasanTerlambatEdits[siswa.id] || "");
																			setIsModalTerlambatOpen(true);
																		} else {
																			// Turning it OFF, clear reason and show toast
																			setAlasanTerlambatEdits({ ...alasanTerlambatEdits, [siswa.id]: "" });
																			showToast("Keterlambatan dibatalkan", "success");
																		}
																	}}
																	title={isTerlambatEdits[siswa.id] ? "Siswa ini ditandai terlambat (Klik untuk batalkan)" : "Tandai siswa terlambat"}
																>
																	<AlertTriangle size={16} color={isTerlambatEdits[siswa.id] ? "#ef4444" : "#cbd5e1"} />
																</button>
															</div>
														</td>
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
																{originalAbsensi?.waktuScan && currentStatus === (originalAbsensi.isDispensasi ? "D" : originalAbsensi.status)
																	? `(${new Date(originalAbsensi.waktuScan).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})`
																	: ""}
															</span>
														</td>
														<td>
															<div style={{ fontSize: "0.875rem", color: "#64748b", whiteSpace: "pre-line", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
																{currentStatus === "D" || currentStatus === "S" || currentStatus === "I" ? (
																	<>
																		{alasanIzinEdits[siswa.id] && <div>{alasanIzinEdits[siswa.id]}</div>}
																		{fileBuktiEdits[siswa.id] && (
																			<a href={fileBuktiEdits[siswa.id]} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontSize: "0.8rem", display: "inline-block", fontWeight: 500 }}>
																				Lihat Surat
																			</a>
																		)}
																		<button
																			onClick={() => {
																				setCurrentSiswaIzin({ id: siswa.id, nama: siswa.user?.nama || "Siswa" });
																				setInputAlasan(alasanIzinEdits[siswa.id] || "");
																				setFileInputKey(Date.now());
																				setIsModalIzinOpen(true);
																			}}
																			style={{ color: "#10b981", background: "none", border: "none", fontSize: "0.8rem", cursor: "pointer", padding: 0, textAlign: "left", display: "inline-flex", alignItems: "center", gap: "0.25rem", width: "fit-content" }}
																		>
																			<Edit size={12} /> Edit Alasan/Surat
																		</button>
																	</>
																) : null}
																{isTerlambatEdits[siswa.id]
																	? (
																		<div>
																			<span style={{ color: "#ef4444", fontWeight: 600 }}>Terlambat:</span> {alasanTerlambatEdits[siswa.id] || "-"}
																		</div>
																	) : null}
															</div>
														</td>
														{activeJurnal.tugas && (
															<td style={{ textAlign: "center" }}>
																<input
																	type="number"
																	step="0.01"
																	className={styles.formInput}
																	style={{ width: "80px", padding: "0.25rem 0.5rem", textAlign: "center", margin: "0 auto" }}
																	placeholder="0-100"
																	value={nilaiTugasEdits[siswa.id] === undefined ? "" : nilaiTugasEdits[siswa.id]}
																	onChange={(e) => {
																		const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
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
																	if (newStatus === "I" || newStatus === "S" || newStatus === "D") {
																		setCurrentSiswaIzin({ id: siswa.id, nama: siswa.user?.nama || "Siswa" });
																		setInputAlasan(alasanIzinEdits[siswa.id] || "");
																		setFileInputKey(Date.now());
																		setIsModalIzinOpen(true);
																	}
																}}
															>
																<option value="" disabled>
																	Pilih Aksi
																</option>
																<option value="H">Hadir</option>
																<option value="D">Dispensasi</option>
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

										const hCount = activeJadwal.kelas?.riwayatSiswa?.filter((rs: any) => presensiEdits[rs.siswa.id] === "H" || presensiEdits[rs.siswa.id] === "D").length || 0;
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
																else if (currentStatus === "D") {
																	statusLabel = "Hadir Dispensasi";
																	if (alasanIzinEdits[siswa.id]) statusLabel += ` (${alasanIzinEdits[siswa.id]})`;
																}
																else if (currentStatus === "I") {
																	statusLabel = "Izin";
																	if (alasanIzinEdits[siswa.id]) statusLabel += ` (${alasanIzinEdits[siswa.id]})`;
																}
																else if (currentStatus === "S") {
																	statusLabel = "Sakit";
																	if (alasanIzinEdits[siswa.id]) statusLabel += ` (${alasanIzinEdits[siswa.id]})`;
																}

																if (isTerlambatEdits[siswa.id]) {
																	statusLabel += ` [Terlambat: ${alasanTerlambatEdits[siswa.id] || "-"}]`;
																}

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