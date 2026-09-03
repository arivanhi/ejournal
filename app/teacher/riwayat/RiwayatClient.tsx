// app/admin/riwayat/ClientUI.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import {
	LayoutDashboard,
	BookOpen,
	QrCode,
	History,
	Users,
	Settings,
	LogOut,
	Bell,
	HelpCircle,
	Calendar,
	Filter,
	FolderOpen,
	ArrowLeft,
	Download,
	UsersRound,
	Clock,
	CheckCircle2,
	AlertTriangle,
	X,
	Printer,
	FileBarChart,
} from "lucide-react";
import styles from "./riwayat.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";

// ============================================================================
// KOMPONEN PEMBANTU PDF (PAGINATION MANUAL)
// ============================================================================

const PageContainer = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
	<div
		style={{
			width: "296mm",
			height: "209mm",
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

export default function RiwayatClient({
	jadwalSemua,
	tahunAjaranList,
	user,
	isWaliKelas,
}: {
	jadwalSemua: any[];
	tahunAjaranList: any[];
	user: any;
	isWaliKelas: boolean;
}) {
	const [viewMode, setViewMode] = useState<"list" | "detail">("list");

	const [selectedTahunId, setSelectedTahunId] = useState<string>(tahunAjaranList.find((t) => t.isActive)?.id || "");
	const [activeJadwal, setActiveJadwal] = useState<any>(null);
	const [activeTab, setActiveTab] = useState<"rekap" | "jurnal" | "analisa" | "tugas" | "terlambat">("rekap");
	const [currentPageRekap, setCurrentPageRekap] = useState(1);
	const [currentPageJurnal, setCurrentPageJurnal] = useState(1);
	const [currentPageTugas, setCurrentPageTugas] = useState(1);
	const itemsPerPage = 15;
	const LATE_THRESHOLD = 2;

	const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);
	const [startDate, setStartDate] = useState<string>("");
	const [endDate, setEndDate] = useState<string>("");

	const filteredJadwal = jadwalSemua.filter((j) => j.tahunAjaranId === selectedTahunId);

	// State Utama Navigasi Kelas (Tampilan Background)
	const [activeTabKelas, setActiveTabKelas] = useState("Semua Kelas");

	// State Modal Export Massal
	const [isMassPdfModalOpen, setIsMassPdfModalOpen] = useState(false);
	const [selectedJadwalIds, setSelectedJadwalIds] = useState<string[]>([]);
	const [massStartDate, setMassStartDate] = useState<string>("");
	const [massEndDate, setMassEndDate] = useState<string>("");
	const [modalKelasFilter, setModalKelasFilter] = useState<string[]>([]); // Tambahan state khusus Modal

	const kelasTabs = useMemo(() => {
		if (!filteredJadwal) return ["Semua Kelas"];
		const uniqueKelas = Array.from(new Set(filteredJadwal.map((j) => j.kelas?.nama))).filter(Boolean) as string[];
		return ["Semua Kelas", ...uniqueKelas.sort()];
	}, [filteredJadwal]);

	const filteredJadwalByKelas = useMemo(() => {
		if (activeTabKelas === "Semua Kelas") return filteredJadwal;
		return filteredJadwal.filter((j) => j.kelas?.nama === activeTabKelas);
	}, [filteredJadwal, activeTabKelas]);

	// GROUPING: Gabungkan jadwal yang Mapel & Kelasnya sama
	const groupedJadwalByMapelKelas = useMemo(() => {
		const groups: Record<string, any> = {};
		filteredJadwalByKelas.forEach((jadwal) => {
			const key = `${jadwal.mapel.id}-${jadwal.kelas.id}`;
			if (!groups[key]) {
				groups[key] = {
					...jadwal,
					jurnal: [...(jadwal.jurnal || [])],
					hariList: [jadwal.hari],
				};
			} else {
				groups[key].jurnal = [...groups[key].jurnal, ...(jadwal.jurnal || [])];
				if (!groups[key].hariList.includes(jadwal.hari)) {
					groups[key].hariList.push(jadwal.hari);
				}
			}
		});
		return Object.values(groups);
	}, [filteredJadwalByKelas]);

	// Filter Jadwal khusus untuk Modal (Mengikuti Pilihan Dropdown Modal) & Digabung
	const modalFilteredJadwal = useMemo(() => {
		let filtered = filteredJadwal;
		if (modalKelasFilter.length > 0) {
			filtered = filteredJadwal.filter((j) => modalKelasFilter.includes(j.kelas?.nama));
		} else {
			filtered = [];
		}

		const groups: Record<string, any> = {};
		filtered.forEach((jadwal) => {
			const key = `${jadwal.mapel.id}-${jadwal.kelas.id}`;
			if (!groups[key]) {
				groups[key] = {
					...jadwal,
					hariList: [jadwal.hari],
					mergedIds: [jadwal.id],
				};
			} else {
				groups[key].mergedIds.push(jadwal.id);
				if (!groups[key].hariList.includes(jadwal.hari)) {
					groups[key].hariList.push(jadwal.hari);
				}
			}
		});
		return Object.values(groups);
	}, [filteredJadwal, modalKelasFilter]);

	const periodeText = useMemo(() => {
		if (!startDate || !endDate) return "Pilih tanggal mulai dan akhir";
		const format = (dateStr: string) => new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
		return `Periode: ${format(startDate)} - ${format(endDate)}`;
	}, [startDate, endDate]);

	useEffect(() => {
		if (activeJadwal && activeJadwal.jurnal && activeJadwal.jurnal.length > 0) {
			const sorted = [...activeJadwal.jurnal].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
			setStartDate(new Date(sorted[0].tanggal).toLocaleDateString("en-CA"));
			setEndDate(new Date(sorted[sorted.length - 1].tanggal).toLocaleDateString("en-CA"));
		}
	}, [activeJadwal]);

	const jurnalForPdf = useMemo(() => {
		if (!activeJadwal) return [];
		return [...activeJadwal.jurnal]
			.filter((j: any) => {
				if (!startDate || !endDate) return true;
				const d = new Date(j.tanggal).getTime();
				const s = new Date(startDate).getTime();
				const e = new Date(endDate);
				e.setHours(23, 59, 59, 999);
				return d >= s && d <= e.getTime();
			})
			.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
	}, [activeJadwal, startDate, endDate]);

	const sortedSiswa = useMemo(() => {
		if (!activeJadwal?.kelas?.riwayatSiswa) return [];
		return [...activeJadwal.kelas.riwayatSiswa].sort((a: any, b: any) => {
			const nameA = a.siswa?.user?.nama || "";
			const nameB = b.siswa?.user?.nama || "";
			return nameA.localeCompare(nameB);
		});
	}, [activeJadwal]);

	const jurnalTugas = useMemo(() => {
		let tugas = jurnalForPdf.filter((j: any) => j.tugas && j.tugas.trim() !== "" && j.tugas.trim() !== "-");
		return tugas.filter((t: any) => {
			return t.presensi?.some((p: any) => p.nilaiTugas !== null && p.nilaiTugas !== undefined);
		});
	}, [jurnalForPdf]);

	const alasanPdfData = useMemo(() => {
		const list: any[] = [];
		jurnalForPdf.forEach((j: any) => {
			const tgl = new Date(j.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
			const siswaWithAlasan: any[] = [];
			j.presensi?.forEach((p: any) => {
				const sInfo = activeJadwal?.kelas?.riwayatSiswa?.find((rs: any) => rs.siswa.id === p.siswaId)?.siswa;
				if (!sInfo) return;

				if (p.isDispensasi) {
					siswaWithAlasan.push({ nama: sInfo.user?.nama || "Siswa", info: `Dispensasi${p.alasan ? ` (${p.alasan})` : ""}` });
				} else if (p.status === "I") {
					siswaWithAlasan.push({ nama: sInfo.user?.nama || "Siswa", info: `Izin${p.alasanIzin ? ` (${p.alasanIzin})` : ""}` });
				} else if (p.status === "S") {
					siswaWithAlasan.push({ nama: sInfo.user?.nama || "Siswa", info: `Sakit${p.alasanIzin ? ` (${p.alasanIzin})` : ""}` });
				}
				if (p.isTerlambat) {
					siswaWithAlasan.push({ nama: sInfo.user?.nama || "Siswa", info: `Terlambat${p.alasanTerlambat ? ` (${p.alasanTerlambat})` : ""}` });
				}
			});
			if (siswaWithAlasan.length > 0) {
				list.push({ tanggal: tgl, details: siswaWithAlasan });
			}
		});
		return list;
	}, [jurnalForPdf, activeJadwal]);

	const getKelasStats = (totalSiswa: number, jurnalList: any[]) => {
		const totalPertemuan = jurnalList.length;
		if (totalPertemuan === 0 || totalSiswa === 0) return { totalPertemuan, rataKehadiran: 0 };
		let totalHadirSemua = 0;
		jurnalList.forEach((jurnal: any) => {
			const hadir = jurnal.presensi?.filter((p: any) => p.status === "H").length || 0;
			totalHadirSemua += hadir;
		});
		const maxPossibleHadir = totalSiswa * totalPertemuan;
		const rataKehadiran = maxPossibleHadir > 0 ? Math.round((totalHadirSemua / maxPossibleHadir) * 100) : 0;
		return { totalPertemuan, rataKehadiran };
	};

	const getRekapSiswa = (siswaId: string, jurnalList: any[]) => {
		const totalPertemuan = jurnalList.length;
		let H = 0, I = 0, S = 0, A = 0;
		let totalNilai = 0, countTugas = 0;

		jurnalList.forEach((jurnal) => {
			const absen = jurnal.presensi?.find((p: any) => p.siswaId === siswaId);
			if (absen) {
				if (absen.status === "H") H++;
				else if (absen.status === "I") I++;
				else if (absen.status === "S") S++;
				else if (absen.status === "A") A++;
				if (jurnal.tugas && absen.nilaiTugas !== null && absen.nilaiTugas !== undefined) {
					totalNilai += absen.nilaiTugas;
					countTugas++;
				}
			}
		});

		const persentase = totalPertemuan > 0 ? Math.round((H / totalPertemuan) * 100) : 0;
		const rataNilai = countTugas > 0 ? Math.round(totalNilai / countTugas) : 0;
		let statusText = "Kurang";
		let statusClass = styles.badgeKurang;
		if (persentase >= 90) {
			statusText = "Sangat Baik";
			statusClass = styles.badgeSangatBaik;
		} else if (persentase >= 75) {
			statusText = "Baik";
			statusClass = styles.badgeBaik;
		}
		return { H, I, S, A, totalHadir: H, totalPertemuan, persentase, statusText, statusClass, rataNilai, countTugas };
	};

	const MAX_ROWS = 15;
	const chunkArray = (arr: any[], size: number) => {
		if (!arr || arr.length === 0) return [[]];
		const res = [];
		for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
		return res;
	};

	const jurnalChunks = chunkArray(jurnalForPdf, MAX_ROWS);
	const siswaChunks = chunkArray(sortedSiswa, MAX_ROWS);

	const alasanChunks = chunkArray(alasanPdfData, 12);
	const pagesBabA = jurnalForPdf.length === 0 ? 1 : jurnalChunks.length;
	const pagesBabB = siswaChunks.length;
	const pagesBabC = alasanChunks.length === 0 ? 0 : alasanChunks.length;
	const pagesBabD = 1;
	const pagesBabE = jurnalTugas.length === 0 ? 0 : siswaChunks.length;
	const totalPdfPages = 1 + pagesBabA + pagesBabB + pagesBabC + pagesBabD + pagesBabE;

	const handleDownloadPdf = async () => {
		if (!startDate || !endDate) return alert("Pilih tanggal mulai dan akhir untuk dicetak.");
		if (new Date(startDate) > new Date(endDate)) return alert("Tanggal akhir tidak boleh mendahului tanggal mulai.");

		setIsDownloading(true);

		// SetTimeout memberikan waktu pada UI React untuk mere-render tombol "Memproses PDF..."
		setTimeout(async () => {
			try {
				const html2pdf = (await import("html2pdf.js")).default;
				const element = document.getElementById("pdf-portofolio-content");

				const opt = {
					margin: 0,
					filename: `Riwayat_Jurnal_${activeJadwal.tahunAjaran.nama}_${activeJadwal.mapel.nama}_${activeJadwal.kelas.nama}.pdf`,
					image: { type: "jpeg", quality: 1 },
					html2canvas: { scale: 2, useCORS: true },
					jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
					pagebreak: { mode: ['css'] }
				};

				await html2pdf().set(opt).from(element).save();
			} catch (error) {
				console.error("Gagal men-generate PDF:", error);
				alert("Terjadi kesalahan saat memproses PDF.");
			} finally {
				setIsDownloading(false);
				setIsPdfModalOpen(false);
			}
		}, 300);
	};

	const handleSelectAllJadwal = (isChecked: boolean) => {
		if (isChecked) {
			const allIds = modalFilteredJadwal.flatMap((j) => j.mergedIds);
			setSelectedJadwalIds(allIds);
		} else {
			setSelectedJadwalIds([]);
		}
	};

	const handleSelectJadwal = (mergedIds: string[], isChecked: boolean) => {
		setSelectedJadwalIds((prev) => {
			if (isChecked) {
				const newSet = new Set([...prev, ...mergedIds]);
				return Array.from(newSet);
			} else {
				return prev.filter((id) => !mergedIds.includes(id));
			}
		});
	};

	const handleMassDownloadPdf = async () => {
		if (!massStartDate || !massEndDate) return alert("Pilih tanggal mulai dan akhir untuk dicetak.");
		if (new Date(massStartDate) > new Date(massEndDate)) return alert("Tanggal akhir tidak boleh mendahului tanggal mulai.");
		if (selectedJadwalIds.length === 0) return alert("Pilih minimal satu mata pelajaran.");

		setIsDownloading(true);

		// Menunda sedikit fungsi html2pdf agar state "Memproses PDF..." merender dulu
		setTimeout(async () => {
			try {
				const html2pdf = (await import("html2pdf.js")).default;
				const element = document.getElementById("mass-pdf-content");

				const opt = {
					margin: 0,
					filename: `Ekspor_Massal_Jurnal_${modalKelasFilter.length > 2 ? 'Beberapa_Kelas' : modalKelasFilter.join('_').replace(/ /g, '_')}.pdf`,
					image: { type: "jpeg", quality: 1 },
					html2canvas: { scale: 2, useCORS: true },
					jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
					pagebreak: { mode: ['css'] }
				};

				await html2pdf().set(opt).from(element).save();
			} catch (error) {
				console.error("Gagal men-generate PDF massal:", error);
				alert("Terjadi kesalahan saat memproses PDF massal.");
			} finally {
				setIsDownloading(false);
				setIsMassPdfModalOpen(false);
			}
		}, 500);
	};

	return (
		<>
			{/* === MODAL PREVIEW & PILIH BULAN PDF (SINGLE) === */}
			{isPdfModalOpen && activeJadwal && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainerLarge} style={{ maxWidth: "600px", height: "auto", maxHeight: "90vh" }}>
						<div className={styles.modalHeader}>
							<div>
								<h3 className={styles.modalTitle}>Ekspor Riwayat Jurnal</h3>
								<p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
									Pilih periode bulan yang ingin Anda cetak ke dalam PDF.
								</p>
							</div>
							<button className={styles.modalCloseBtn} onClick={() => setIsPdfModalOpen(false)}>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modalBodyScroll} style={{ padding: "1.5rem 2rem", display: "block" }}>
							<h4 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "1rem", color: "#0f172a" }}>
								Filter Jangka Waktu Laporan:
							</h4>

							<div className={styles.datePickerWrapper}>
								<div style={{ flex: 1 }}>
									<label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>
										Tanggal Mulai
									</label>
									<input
										type="date"
										style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
										value={startDate}
										onChange={(e) => setStartDate(e.target.value)}
									/>
								</div>
								<div style={{ flex: 1 }}>
									<label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>
										Tanggal Selesai
									</label>
									<input
										type="date"
										style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
										value={endDate}
										onChange={(e) => setEndDate(e.target.value)}
									/>
								</div>
							</div>

							<div
								style={{
									backgroundColor: "#f8fafc",
									padding: "1rem",
									borderRadius: "0.5rem",
									border: "1px dashed #cbd5e1",
								}}
							>
								<p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
									<FileBarChart size={16} /> Total Jurnal Terpilih: <strong>{jurnalForPdf.length} Pertemuan</strong>
								</p>
							</div>

							{/* PERBAIKAN: Posisi mutlak dan di luar layar agar html2pdf bisa membaca (jangan display: none) */}
							<div style={{ position: "absolute", top: "-9999px", left: "-9999px", visibility: "hidden", zIndex: -1 }}>
								<div id="pdf-portofolio-content" style={{ width: "210mm", backgroundColor: "#fff", color: "#000", fontFamily: "Arial, sans-serif" }}>

									{/* --- HALAMAN 1: COVER --- */}
									<PageContainer>
										<div
											style={{
												flex: 1,
												display: "flex",
												flexDirection: "column",
												justifyContent: "center",
												alignItems: "center",
											}}
										>
											<h2 style={{ fontSize: "18pt", fontWeight: 800, marginBottom: "0.5rem" }}>
												RIWAYAT JURNAL MENGAJAR
											</h2>
											<h1
												style={{
													fontSize: "24pt",
													fontWeight: 900,
													color: "#0a2540",
													marginBottom: "0.5rem",
													textTransform: "uppercase",
													textAlign: "center"
												}}
											>
												{activeJadwal.mapel.nama}
											</h1>
											<p style={{ fontSize: "12pt", fontWeight: 600 }}>Tahun Akademik {activeJadwal.tahunAjaran.nama}</p>

											<p style={{ fontSize: "12pt", fontWeight: 600, marginTop: "0.5rem", color: "#dc2626" }}>
												{periodeText}
											</p>

											<div style={{ margin: "1.5rem 0", display: "flex", justifyContent: "center" }}>
												<img
													src="/logo.jpg"
													alt="Logo SMAN 2 Brebes"
													style={{ width: "160px", height: "160px", objectFit: "contain" }}
												/>
											</div>

											<div style={{ textAlign: "center" }}>
												<p style={{ fontSize: "11pt", marginBottom: "0.5rem" }}>
													<strong>GURU PENGAMPU:</strong>
												</p>
												<p style={{ fontSize: "14pt", fontWeight: 700, color: "#0a2540", margin: 0 }}>{user.nama}</p>
												<p style={{ fontSize: "11pt", marginTop: "0.5rem" }}>NIP: {user.username}</p>
											</div>

											<div
												style={{
													marginTop: "2rem",
													textAlign: "center",
													borderTop: "2px solid #0a2540",
													paddingTop: "1.5rem",
													width: "70%",
													margin: "2rem auto 0 auto",
												}}
											>
												<p style={{ fontSize: "14pt", fontWeight: 800 }}>KELAS: {activeJadwal.kelas.nama}</p>
												<p style={{ fontSize: "12pt" }}>SMA NEGERI 2 BREBES</p>
											</div>
										</div>
										<PageFooter current={1} total={totalPdfPages} />
									</PageContainer>

									{/* --- HALAMAN BAB A: JURNAL MENGAJAR --- */}
									{jurnalForPdf.length === 0 ? (
										<PageContainer>
											<KopSurat />
											<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>A. JURNAL MENGAJAR & CATATAN KBM</h3>
											<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
												<thead style={{ display: "table-header-group" }}>
													<tr style={{ backgroundColor: "#f1f5f9" }}>
														<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>Pert.</th>
														<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "20%" }}>Tanggal</th>
														<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "25%" }}>Topik Pembelajaran</th>
														<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "35%" }}>Catatan Evaluasi / Kendala</th>
														<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>Status</th>
													</tr>
												</thead>
												<tbody>
													<tr>
														<td colSpan={5} style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>
															Belum ada jurnal untuk periode terpilih.
														</td>
													</tr>
												</tbody>
											</table>
											<PageFooter current={2} total={totalPdfPages} />
										</PageContainer>
									) : (
										jurnalChunks.map((chunk, chunkIdx) => {
											const pageNum = 1 + (chunkIdx + 1);
											return (
												<div key={`A-${chunkIdx}`}>
													<PageContainer>
														<KopSurat />
														<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>
															A. JURNAL MENGAJAR & CATATAN KBM {chunkIdx > 0 ? "(Lanjutan)" : ""}
														</h3>
														<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
															<thead style={{ display: "table-header-group" }}>
																<tr style={{ backgroundColor: "#f1f5f9" }}>
																	<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>Pert.</th>
																	<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "20%" }}>Tanggal</th>
																	<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "25%" }}>Topik Pembelajaran</th>
																	<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "35%" }}>Catatan Evaluasi / Kendala</th>
																	<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>Status</th>
																</tr>
															</thead>
															<tbody>
																{chunk.map((jur: any, index: number) => {
																	const globalIdx = (chunkIdx * MAX_ROWS) + index + 1;
																	return (
																		<tr key={jur.id}>
																			<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{globalIdx}</td>
																			<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>
																				{new Date(jur.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
																			</td>
																			<td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{jur.materiBab || jur.topik || "-"}</td>
																			<td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{jur.catatan || "-"}</td>
																			<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>
																				{jur.status === "SUBMITTED" ? "Terkirim" : "Draft"}
																			</td>
																		</tr>
																	);
																})}
															</tbody>
														</table>
														<PageFooter current={pageNum} total={totalPdfPages} />
													</PageContainer>
												</div>
											);
										})
									)}

									{/* --- HALAMAN BAB B: REKAP KEHADIRAN --- */}
									{siswaChunks.map((chunk, chunkIdx) => {
										const pageNum = 1 + pagesBabA + (chunkIdx + 1);
										return (
											<div key={`B-${chunkIdx}`}>
												<PageContainer>
													<KopSurat />
													<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "5px" }}>
														B. REKAPITULASI KEHADIRAN SISWA {chunkIdx > 0 ? "(Lanjutan)" : ""}
													</h3>
													{chunkIdx === 0 && (
														<p style={{ fontSize: "9pt", marginBottom: "15px" }}>
															<em>*Berdasarkan periode {periodeText}</em>
														</p>
													)}
													<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
														<thead style={{ display: "table-header-group" }}>
															<tr style={{ backgroundColor: "#f1f5f9" }}>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>No.</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "35%" }}>Nama Siswa</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>NIS</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "7%", textAlign: "center" }}>H</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "7%", textAlign: "center" }}>I</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "7%", textAlign: "center" }}>S</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "7%", textAlign: "center" }}>A</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "17%", textAlign: "center" }}>% Hadir</th>
															</tr>
														</thead>
														<tbody>
															{chunk.map((rs: any, index: number) => {
																const globalIdx = (chunkIdx * MAX_ROWS) + index + 1;
																const rekap = getRekapSiswa(rs.siswa.id, jurnalForPdf);
																return (
																	<tr key={rs.siswa.id}>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{globalIdx}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px" }}>{rs.siswa.user?.nama}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px" }}>{rs.siswa.nis}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{rekap.H}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{rekap.I}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{rekap.S}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center", color: rekap.A > 0 ? "#ef4444" : "inherit" }}>
																			{rekap.A}
																		</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center", fontWeight: "bold" }}>{rekap.persentase}%</td>
																	</tr>
																);
															})}
														</tbody>
													</table>
													<PageFooter current={pageNum} total={totalPdfPages} />
												</PageContainer>
											</div>
										);
									})}

									{/* --- HALAMAN BAB C: CATATAN ALASAN --- */}
									{alasanChunks.length > 0 && (
										alasanChunks.map((chunk, chunkIdx) => {
											const pageNum = 1 + pagesBabA + pagesBabB + (chunkIdx + 1);
											return (
												<div key={`C-${chunkIdx}`}>
													<PageContainer>
														<KopSurat />
														<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>
															C. CATATAN ALASAN {chunkIdx > 0 ? "(Lanjutan)" : ""}
														</h3>
														<div style={{ fontSize: "10pt" }}>
															{chunk.map((item: any, idx: number) => (
																<div key={idx} style={{ marginBottom: "1rem" }}>
																	<p style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>{item.tanggal}:</p>
																	<ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
																		{item.details.map((d: any, dIdx: number) => (
																			<li key={dIdx} style={{ marginBottom: "0.25rem" }}>
																				<strong>{d.nama}</strong>, {d.info}
																			</li>
																		))}
																	</ul>
																</div>
															))}
														</div>
														<PageFooter current={pageNum} total={totalPdfPages} />
													</PageContainer>
												</div>
											);
										})
									)}

									{/* --- HALAMAN BAB D: ANALISA KBM --- */}
									{(() => {
										const pageNumD = 1 + pagesBabA + pagesBabB + pagesBabC + 1;
										const totalSiswaKls = activeJadwal.kelas.riwayatSiswa.length;
										const chartData = jurnalForPdf.map((j: any, i: number) => {
											const h = j.presensi?.filter((p: any) => p.status === "H").length || 0;
											const pct = totalSiswaKls > 0 ? Math.round((h / totalSiswaKls) * 100) : 0;
											let fillColor = "#0a2540";
											if (pct < 75) fillColor = "#ef4444";
											else if (pct < 90) fillColor = "#f59e0b";
											return { pertemuan: i + 1, pct, hadir: h, fillColor };
										});

										const statsPdf = getKelasStats(totalSiswaKls, jurnalForPdf);

										return (
											<div>
												<PageContainer>
													<KopSurat />
													<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>
														D. ANALISA HASIL KBM
													</h3>

													<div style={{ border: "1px solid #000", padding: "1rem", marginBottom: "1.5rem" }}>
														<p style={{ fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center", fontSize: "11pt" }}>
															GRAFIK TREN KEHADIRAN SISWA
														</p>

														<div
															style={{
																display: "flex",
																justifyContent: "space-around",
																alignItems: "flex-end",
																height: "140px",
																borderBottom: "1px solid #cbd5e1",
																paddingBottom: "0.5rem",
																margin: "0 2rem",
															}}
														>
															{chartData.length === 0 ? (
																<div style={{ color: "#64748b", fontSize: "10pt", alignSelf: "center" }}>
																	Belum ada data kehadiran.
																</div>
															) : (
																chartData.map((data: any, idx: number) => (
																	<div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "30px" }}>
																		<span style={{ fontSize: "8pt", fontWeight: "bold", marginBottom: "4px" }}>
																			{data.pct}%
																		</span>
																		<div style={{ height: "100px", width: "100%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "flex-end" }}>
																			<div style={{ width: "100%", height: `${data.pct}%`, backgroundColor: data.fillColor }}></div>
																		</div>
																		<span style={{ fontSize: "8pt", marginTop: "4px" }}>P-{data.pertemuan}</span>
																	</div>
																))
															)}
														</div>
													</div>

													<div style={{ border: "1px solid #000", padding: "1rem" }}>
														<p><strong>REKAPITULASI CAPAIAN KELAS:</strong></p>
														<p style={{ marginBottom: "1rem" }}>
															Rata-rata persentase kehadiran kelas {activeJadwal.kelas.nama} adalah{" "}
															<strong>{statsPdf.rataKehadiran}%</strong> selama{" "}
															<strong>{statsPdf.totalPertemuan} pertemuan</strong>.
														</p>

															{(() => {
																const notes = jurnalForPdf.filter((j: any) => j.catatan && j.catatan.trim() !== "" && j.catatan.trim() !== "-");
																if (notes.length === 0) return null;
																return (
																	<>
																		<p><strong>RANGKUMAN CATATAN EVALUASI:</strong></p>
																		<ul style={{ paddingLeft: "1.5rem", marginBottom: "2rem" }}>
																			{notes.map((n: any, i: number) => (
																				<li key={i} style={{ marginBottom: "0.5rem" }}>
																					<strong>Pertemuan ke-{i + 1} ({new Date(n.tanggal).toLocaleDateString("id-ID")}):</strong>{" "}
																					{n.catatan}
																				</li>
																			))}
																		</ul>
																	</>
																);
															})()}

														<div style={{ textAlign: "right", marginTop: "3rem", paddingRight: "10%" }}>
															<p>
																Brebes, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
															</p>
															<p style={{ marginBottom: "4rem" }}>Guru Pengampu,</p>
															<p><strong>{user.nama}</strong></p>
															<p>NIP: {user.username}</p>
														</div>
													</div>
													<PageFooter current={pageNumD} total={totalPdfPages} />
												</PageContainer>
											</div>
										);
									})()}

									{jurnalTugas.length > 0 && (
										siswaChunks.map((chunk, chunkIdx) => {
											const pageNum = 1 + pagesBabA + pagesBabB + pagesBabC + 1 + (chunkIdx + 1);
											const isLastPage = chunkIdx === siswaChunks.length - 1;
											return (
												<div key={`D-${chunkIdx}`}>
													<PageContainer isLast={isLastPage}>
														<KopSurat />
														<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>
															E. REKAPITULASI NILAI TUGAS {chunkIdx > 0 ? "(Lanjutan)" : ""}
														</h3>
														<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
															<thead style={{ display: "table-header-group" }}>
																<tr style={{ backgroundColor: "#f1f5f9" }}>
																	<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>No.</th>
																	<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "35%" }}>Nama Siswa</th>
																	<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>NIS</th>
																	{jurnalTugas.map((t: any) => (
																		<th key={t.id} style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{t.tugas}</th>
																	))}
																	<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "10%", textAlign: "center" }}>Rata-rata</th>
																</tr>
															</thead>
															<tbody>
																{chunk.map((rs: any, index: number) => {
																	const globalIdx = (chunkIdx * MAX_ROWS) + index + 1;
																	const rekap = getRekapSiswa(rs.siswa.id, jurnalForPdf);
																	return (
																		<tr key={rs.siswa.id}>
																			<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{globalIdx}</td>
																			<td style={{ border: "1px solid #cbd5e1", padding: "6px" }}>{rs.siswa.user?.nama}</td>
																			<td style={{ border: "1px solid #cbd5e1", padding: "6px" }}>{rs.siswa.nis}</td>
																			{jurnalTugas.map((t: any) => {
																				const absen = t.presensi?.find((p: any) => p.siswaId === rs.siswa.id);
																				const nilai = absen?.nilaiTugas;
																				return (
																					<td key={t.id} style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>
																						{nilai !== null && nilai !== undefined ? nilai : "-"}
																					</td>
																				);
																			})}
																			<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center", fontWeight: "bold" }}>
																				{rekap.countTugas > 0 ? rekap.rataNilai : "-"}
																			</td>
																		</tr>
																	);
																})}
															</tbody>
														</table>
														<PageFooter current={pageNum} total={totalPdfPages} />
													</PageContainer>
												</div>
											);
										})
									)}

								</div>
							</div>
						</div>

						<div className={styles.modalFooter}>
							<button className={styles.btnOutline} onClick={() => setIsPdfModalOpen(false)}>
								Batal
							</button>
							<button
								className={styles.btnPrimary}
								onClick={handleDownloadPdf}
								disabled={isDownloading || !startDate || !endDate}
							>
								{isDownloading ? (
									"Memproses PDF..."
								) : (
									<>
										<Printer size={16} /> Unduh PDF
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* === MODAL EKSPOR MASSAL === */}
			{isMassPdfModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainerLarge} style={{ maxWidth: "600px", height: "auto", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
						<div className={styles.modalHeader}>
							<div>
								<h3 className={styles.modalTitle}>Ekspor Laporan Massal</h3>
								<p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
									Pilih mata pelajaran dan rentang tanggal untuk diekspor ke satu file PDF.
								</p>
							</div>
							<button className={styles.modalCloseBtn} onClick={() => setIsMassPdfModalOpen(false)}>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modalBodyScroll} style={{ padding: "1.5rem 2rem", flex: 1, overflowY: "auto", display: "block" }}>

							<div className={styles.datePickerWrapper} style={{ marginBottom: "1.5rem" }}>
								<div style={{ flex: 1 }}>
									<label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>
										Tanggal Mulai
									</label>
									<input
										type="date"
										style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
										value={massStartDate}
										onChange={(e) => setMassStartDate(e.target.value)}
									/>
								</div>
								<div style={{ flex: 1 }}>
									<label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#64748b", marginBottom: "0.5rem" }}>
										Tanggal Akhir
									</label>
									<input
										type="date"
										style={{ width: "100%", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}
										value={massEndDate}
										onChange={(e) => setMassEndDate(e.target.value)}
									/>
								</div>
							</div>

							{/* Filter Kelas Berupa Checkbox */}
							<div style={{ marginBottom: "1.5rem" }}>
								<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
									<label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
										Filter Berdasarkan Kelas:
									</label>
									{activeTabKelas === "Semua Kelas" && (
										<label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", color: "#0a2540" }}>
											<input
												type="checkbox"
												checked={
													modalKelasFilter.length > 0 &&
													modalKelasFilter.length === kelasTabs.filter(t => t !== "Semua Kelas").length
												}
												onChange={(e) => {
													if (e.target.checked) {
														setModalKelasFilter(kelasTabs.filter(t => t !== "Semua Kelas"));
													} else {
														setModalKelasFilter([]);
													}
													setSelectedJadwalIds([]);
												}}
											/>
											Pilih Semua Kelas
										</label>
									)}
								</div>
								
								<div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
									{(activeTabKelas === "Semua Kelas" ? kelasTabs.filter(t => t !== "Semua Kelas") : [activeTabKelas]).map(tab => (
										<label key={tab} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", backgroundColor: "white", borderRadius: "0.375rem", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "0.875rem" }}>
											<input
												type="checkbox"
												checked={modalKelasFilter.includes(tab)}
												onChange={(e) => {
													if (e.target.checked) {
														setModalKelasFilter(prev => [...prev, tab]);
													} else {
														setModalKelasFilter(prev => prev.filter(t => t !== tab));
													}
													setSelectedJadwalIds([]); // Reset Checklist Mapel
												}}
											/>
											{tab}
										</label>
									))}
								</div>
							</div>

							<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
								<h4 style={{ fontSize: "1rem", fontWeight: "bold", color: "#0f172a", margin: 0 }}>
									Pilih Mata Pelajaran:
								</h4>
								<label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600, cursor: "pointer", color: "#0a2540" }}>
									<input
										type="checkbox"
										checked={
											selectedJadwalIds.length > 0 &&
											selectedJadwalIds.length === modalFilteredJadwal.flatMap((j) => j.mergedIds).length
										}
										onChange={(e) => handleSelectAllJadwal(e.target.checked)}
									/>
									Pilih Semua
								</label>
							</div>

							<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "300px", overflowY: "auto", padding: "0.5rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", border: "1px solid #cbd5e1" }}>
								{modalFilteredJadwal.length === 0 ? (
									<div style={{ padding: "1rem", textAlign: "center", color: "#64748b", fontSize: "0.875rem" }}>
										Tidak ada jadwal tersedia untuk kelas ini.
									</div>
								) : (
									modalFilteredJadwal.map(j => (
										<label key={j.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", backgroundColor: "white", borderRadius: "0.375rem", border: "1px solid #e2e8f0", cursor: "pointer", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
											<input
												type="checkbox"
												checked={j.mergedIds.every((id: string) => selectedJadwalIds.includes(id))}
												onChange={(e) => handleSelectJadwal(j.mergedIds, e.target.checked)}
											/>
											<div style={{ flex: 1 }}>
												<div style={{ fontWeight: 600, color: "#0a2540", fontSize: "0.95rem" }}>
													{j.mapel.nama} <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: 400 }}>({j.hariList.map((h: string) => ({ "1": "Senin", "2": "Selasa", "3": "Rabu", "4": "Kamis", "5": "Jumat", "6": "Sabtu", "7": "Minggu" }[String(h)] || h)).join(", ")})</span>
												</div>

												{/* Tampilkan Nama Kelas Jika Ada Kelas Terpilih */}
												{modalKelasFilter.length > 0 && (
													<div style={{ fontSize: "0.8rem", color: "#64748b" }}>Kelas: {j.kelas.nama}</div>
												)}
											</div>
										</label>
									))
								)}
							</div>
						</div>

						<div className={styles.modalFooter}>
							<button className={styles.btnOutline} onClick={() => setIsMassPdfModalOpen(false)}>
								Batal
							</button>
							<button
								className={styles.btnPrimary}
								onClick={handleMassDownloadPdf}
								disabled={isDownloading || !massStartDate || !massEndDate || selectedJadwalIds.length === 0}
							>
								{isDownloading ? (
									"Memproses PDF..."
								) : (
									<>
										<Printer size={16} /> Unduh PDF Massal
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* === MAIN CONTENT === */}
			<div className={styles.dashboardContainer}>
				{/* === VIEW 1: ARSIP LIST === */}
				{viewMode === "list" && (
					<div>
						<h1 className={styles.pageTitle}>Riwayat Mengajar</h1>
						<p className={styles.pageSubtitle}>
							Arsip jurnal dan presensi dari tahun ajaran dan semester sebelumnya.
						</p>

						<div className={styles.filterBox}>
							<div className={styles.filterGroup}>
								<label className={styles.filterLabel}>Tahun Ajaran / Semester</label>
								<select
									className={styles.filterSelect}
									value={selectedTahunId}
									onChange={(e) => setSelectedTahunId(e.target.value)}
								>
									{tahunAjaranList.map((t) => (
										<option key={t.id} value={t.id}>
											{t.nama}
										</option>
									))}
								</select>
							</div>
							<div style={{ display: "flex", gap: "0.5rem" }}>
								<button className={`${styles.btnPrimary} ${styles.btnFilter}`}>
									<Filter size={16} /> Terapkan Filter
								</button>
								<button
									className={`${styles.btnOutline} ${styles.btnFilter}`}
									style={{ borderColor: "#10b981", color: "#10b981" }}
									onClick={() => {
										// Inisialisasi Modal Massal
										setModalKelasFilter(activeTabKelas === "Semua Kelas" ? kelasTabs.filter(t => t !== "Semua Kelas") : [activeTabKelas]);
										setSelectedJadwalIds([]);
										setIsMassPdfModalOpen(true);
									}}
								>
									<Download size={16} /> Ekspor Laporan Massal
								</button>
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

						<div className={styles.cardGrid}>
							{groupedJadwalByMapelKelas.length === 0 ? (
								<div
									style={{
										gridColumn: "1 / -1",
										textAlign: "center",
										padding: "3rem",
										color: "#64748b",
										background: "white",
										borderRadius: "0.75rem",
										border: "1px dashed #cbd5e1",
									}}
								>
									Tidak ada riwayat kelas yang telah diselesaikan pada periode ini.
								</div>
							) : (
								groupedJadwalByMapelKelas.map((jadwal) => {
									const stats = getKelasStats(jadwal.kelas.riwayatSiswa.length, jadwal.jurnal);
									const ta = tahunAjaranList.find((t) => t.id === jadwal.tahunAjaranId)?.nama || "";

									return (
										<div key={jadwal.id} className={styles.riwayatCard}>
											<div className={styles.cardHeader}>
												<div className={styles.cardTitle}>{jadwal.mapel.nama}</div>
												<div className={styles.badgeSelesai}>Selesai</div>
											</div>
											<div className={styles.cardSubtitle}>{jadwal.kelas.nama}</div>
											<div className={styles.cardMeta} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
												<div>
													<Calendar size={12} /> {ta}
												</div>
												<div style={{ fontSize: "0.75rem", fontWeight: 600, color: "#3b82f6", background: "#eff6ff", padding: "2px 6px", borderRadius: "4px" }}>
													{jadwal.hariList.map((h: string) => ({ "1": "Senin", "2": "Selasa", "3": "Rabu", "4": "Kamis", "5": "Jumat", "6": "Sabtu", "7": "Minggu" }[String(h)] || h)).join(", ")}
												</div>
											</div>

											<div className={styles.cardStats}>
												<div className={styles.statRow}>
													<span>Total Pertemuan</span>
													<strong>{stats.totalPertemuan}</strong>
												</div>
												<div className={styles.statRow}>
													<span>Rata-rata Kehadiran</span>
													<strong className={styles.highlight}>{stats.rataKehadiran}%</strong>
												</div>
											</div>

											<button
												className={styles.btnOutline}
												style={{ width: "100%", justifyContent: "center" }}
												onClick={() => {
													setActiveJadwal(jadwal);
													setViewMode("detail");
												}}
											>
												<FolderOpen size={16} /> Buka Arsip
											</button>
										</div>
									);
								})
							)}
						</div>
					</div>
				)}

				{/* === VIEW 2: DETAIL STATISTIK === */}
				{viewMode === "detail" && activeJadwal && (
					<div>
						<div className={styles.detailHeaderWrapper}>
							<div className={styles.detailTitleBox}>
								<div className={styles.breadcrumb}>
									Riwayat &gt; <span>{activeJadwal.mapel.nama}</span>
								</div>
								<h1 className={styles.pageTitle}>{activeJadwal.mapel.nama}</h1>
								<p className={styles.pageSubtitle} style={{ marginBottom: 0 }}>
									{activeJadwal.kelas.nama} &bull; {activeJadwal.tahunAjaran.nama}
								</p>
							</div>
							<div className={styles.detailActionBox}>
								<button className={styles.btnOutline} onClick={() => setViewMode("list")}>
									<ArrowLeft size={16} /> Kembali
								</button>
								<button className={styles.btnPrimary} onClick={() => setIsPdfModalOpen(true)}>
									<Download size={16} /> Export Laporan PDF
								</button>
							</div>
						</div>

						{(() => {
							const stats = getKelasStats(activeJadwal.kelas.riwayatSiswa.length, activeJadwal.jurnal);
							return (
								<div className={styles.statsGrid}>
									<div className={styles.statBox}>
										<div className={styles.statBoxHeader}>
											Rata-Rata Kehadiran <UsersRound size={16} color="#f59e0b" />
										</div>
										<div className={styles.statBoxValue}>
											{stats.rataKehadiran}% <span className={styles.statBadge}>+2%</span>
										</div>
									</div>
									<div className={styles.statBox}>
										<div className={styles.statBoxHeader}>
											Total Pertemuan <Calendar size={16} color="#3b82f6" />
										</div>
										<div className={styles.statBoxValue}>
											{stats.totalPertemuan} <span className={styles.statBoxSub}>Sesi</span>
										</div>
									</div>
									<div className={styles.statBox}>
										<div className={styles.statBoxHeader}>
											Ketepatan Waktu Rata-Rata <Clock size={16} color="#ef4444" />
										</div>
										<div className={styles.statBoxValue}>
											88% <span className={styles.statBoxSub}>Tepat</span>
										</div>
									</div>
									<div className={styles.statBox}>
										<div className={styles.statBoxHeader}>
											Capaian Materi <CheckCircle2 size={16} color="#10b981" />
										</div>
										<div className={styles.statBoxValue}>
											100% <span className={styles.statBoxSub}>Selesai</span>
										</div>
									</div>
								</div>
							);
						})()}

						<div className={styles.tableContainer}>
							<div
								style={{
									padding: "1.5rem 1.5rem 0 1.5rem",
									background: "#ffffff",
									borderBottom: "1px solid #e2e8f0",
								}}
							>
								<div className={styles.tabsContainer}>
									<button
										className={`${styles.tabBtn} ${activeTab === "rekap" ? styles.tabActive : ""}`}
										onClick={() => setActiveTab("rekap")}
									>
										Rekap Presensi Siswa
									</button>
									<button
										className={`${styles.tabBtn} ${activeTab === "jurnal" ? styles.tabActive : ""}`}
										onClick={() => setActiveTab("jurnal")}
									>
										Jurnal Mengajar
									</button>
									<button
										className={`${styles.tabBtn} ${activeTab === "analisa" ? styles.tabActive : ""}`}
										onClick={() => setActiveTab("analisa")}
									>
										Analisa Hasil
									</button>
									<button
										className={`${styles.tabBtn} ${activeTab === "tugas" ? styles.tabActive : ""}`}
										onClick={() => setActiveTab("tugas")}
									>
										Tugas Harian
									</button>
									<button
										className={`${styles.tabBtn} ${activeTab === "terlambat" ? styles.tabActive : ""}`}
										onClick={() => setActiveTab("terlambat")}
									>
										Siswa Terlambat
									</button>
								</div>
							</div>

							{/* --- TAB 1: REKAP SISWA --- */}
							{activeTab === "rekap" && (
								<>
									<div style={{ overflowX: "auto", width: "100%" }}>
										<table className={styles.tableStyle}>
											<thead>
												<tr>
													<th style={{ width: "25%" }}>Nama Siswa</th>
													<th style={{ width: "15%" }}>NIS</th>
													<th style={{ width: "20%" }}>Detail Kehadiran (H/I/S/A)</th>
													<th style={{ width: "15%" }}>Persentase</th>
													<th style={{ width: "10%", textAlign: "center" }}>Nilai Tugas</th>
													<th style={{ width: "15%" }}>Status</th>
												</tr>
											</thead>
											<tbody>
												{(() => {
													const sortedSiswa = [...activeJadwal.kelas.riwayatSiswa].sort((a: any, b: any) => {
														const nameA = a.siswa?.user?.nama || "";
														const nameB = b.siswa?.user?.nama || "";
														return nameA.localeCompare(nameB);
													});

													const totalItems = sortedSiswa.length;
													const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
													const startIndex = (currentPageRekap - 1) * itemsPerPage;
													const paginatedSiswa = sortedSiswa.slice(startIndex, startIndex + itemsPerPage);

													return paginatedSiswa.map((rs: any) => {
														const siswa = rs.siswa;
														const rekap = getRekapSiswa(siswa.id, activeJadwal.jurnal);

														let barColor = "#0f172a";
														if (rekap.persentase < 90 && rekap.persentase >= 75) barColor = "#f59e0b";

														return (
															<tr key={siswa.id}>
																<td style={{ fontWeight: 700, color: "#0f172a" }}>{siswa.user?.nama}</td>
																<td>{siswa.nis}</td>
																<td style={{ fontWeight: 600 }}>
																	<span style={{ color: "#10b981" }}>H: {rekap.H}</span> &nbsp;|&nbsp;
																	<span style={{ color: "#f59e0b" }}>I: {rekap.I}</span> &nbsp;|&nbsp;
																	<span style={{ color: "#f59e0b" }}>S: {rekap.S}</span> &nbsp;|&nbsp;
																	<span style={{ color: "#ef4444" }}>A: {rekap.A}</span>
																</td>
																<td>
																	<div className={styles.progressWrapper}>
																		<div className={styles.progressTrack}>
																			<div
																				className={styles.progressBar}
																				style={{ width: `${rekap.persentase}%`, backgroundColor: barColor }}
																			></div>
																		</div>
																		<span className={styles.progressText}>{rekap.persentase}%</span>
																	</div>
																</td>
																<td style={{ textAlign: "center", fontWeight: 600 }}>
																	{rekap.countTugas > 0 ? rekap.rataNilai : "-"}
																</td>
																<td>
																	<span className={`${styles.badgeStatus} ${rekap.statusClass}`}>{rekap.statusText}</span>
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
								</>
							)}

							{/* --- TAB: TUGAS HARIAN --- */}
							{activeTab === "tugas" && (
								<div className={styles.jurnalListContainer}>
									{(() => {
										const jurnalTugas = activeJadwal.jurnal?.filter((j: any) => j.tugas && j.tugas.trim() !== "") || [];
										if (jurnalTugas.length === 0) {
											return (
												<div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
													Belum ada tugas yang direkam untuk kelas ini.
												</div>
											);
										}
										const sortedTugas = [...jurnalTugas].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
										const totalItems = sortedTugas.length;
										const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
										const startIndex = (currentPageTugas - 1) * itemsPerPage;
										const paginatedTugas = sortedTugas.slice(startIndex, startIndex + itemsPerPage);

										return (
											<>
												{paginatedTugas.map((jurnalItem: any, index: number) => {
													const tglFormatted = new Date(jurnalItem.tanggal).toLocaleDateString("id-ID", {
														weekday: "long",
														year: "numeric",
														month: "long",
														day: "numeric",
													});

													return (
														<div key={jurnalItem.id} className={styles.jurnalLogCard}>
															<div className={styles.jurnalLogHeader}>
																<div className={styles.jurnalLogTitle}>Tugas {startIndex + index + 1}: {jurnalItem.tugas}</div>
																<div className={styles.jurnalLogDate}>
																	<Calendar size={14} /> {tglFormatted}
																</div>
															</div>

															<div className={styles.jurnalLogBody}>
																<div style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
																	<strong style={{ color: "#0f172a" }}>Topik Pembelajaran:</strong>
																	<span style={{ color: "#334155" }}>{jurnalItem.materiBab || "-"}</span>
																</div>
															</div>
														</div>
													);
												})}
												{/* PAGINATION UI TUGAS */}
												<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
													<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
														Menampilkan {jurnalTugas.length > 0 ? (currentPageTugas - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPageTugas * itemsPerPage, jurnalTugas.length)} dari {jurnalTugas.length} data
													</span>
													<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
														<button
															disabled={currentPageTugas === 1}
															onClick={() => setCurrentPageTugas(currentPageTugas - 1)}
															style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageTugas === 1 ? "#f1f5f9" : "white", color: currentPageTugas === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageTugas === 1 ? "not-allowed" : "pointer" }}
														>
															Prev
														</button>
														<button
															disabled={currentPageTugas >= Math.ceil(jurnalTugas.length / itemsPerPage) || jurnalTugas.length === 0}
															onClick={() => setCurrentPageTugas(currentPageTugas + 1)}
															style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPageTugas >= Math.ceil(jurnalTugas.length / itemsPerPage) || jurnalTugas.length === 0 ? "#f1f5f9" : "white", color: currentPageTugas >= Math.ceil(jurnalTugas.length / itemsPerPage) || jurnalTugas.length === 0 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPageTugas >= Math.ceil(jurnalTugas.length / itemsPerPage) || jurnalTugas.length === 0 ? "not-allowed" : "pointer" }}
														>
															Next
														</button>
													</div>
												</div>
											</>
										);
									})()}
								</div>
							)}

							{/* --- TAB 5: SISWA TERLAMBAT --- */}
							{activeTab === "terlambat" && (
								<div style={{ padding: "1.5rem" }}>
									<div style={{ marginBottom: "1rem", color: "#64748b", fontSize: "0.875rem" }}>
										Menampilkan data siswa yang terlambat lebih dari <strong>{LATE_THRESHOLD}</strong> kali.
									</div>
									<div style={{ overflowX: "auto", width: "100%" }}>
										<table className={styles.tableStyle}>
											<thead>
												<tr>
													<th style={{ width: "5%" }}>No</th>
													<th style={{ width: "25%" }}>Nama Siswa</th>
													<th style={{ width: "15%" }}>NIS</th>
													<th style={{ width: "15%", textAlign: "center" }}>Jumlah Terlambat</th>
													<th style={{ width: "40%" }}>Detail (Tanggal & Alasan)</th>
												</tr>
											</thead>
											<tbody>
												{(() => {
													const terlambatData: any[] = [];
													activeJadwal.kelas.riwayatSiswa.forEach((rs: any) => {
														const details: any[] = [];
														activeJadwal.jurnal.forEach((j: any) => {
															const p = j.presensi?.find((pr: any) => pr.siswaId === rs.siswa.id);
															if (p && p.isTerlambat) {
																details.push({
																	tanggal: j.tanggal,
																	alasan: p.alasanTerlambat || "-"
																});
															}
														});
														if (details.length > LATE_THRESHOLD) {
															terlambatData.push({
																siswa: rs.siswa,
																count: details.length,
																details
															});
														}
													});

													terlambatData.sort((a, b) => b.count - a.count); // urut terbanyak

													if (terlambatData.length === 0) {
														return (
															<tr>
																<td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#64748b", fontStyle: "italic" }}>
																	Tidak ada siswa yang terlambat lebih dari {LATE_THRESHOLD} kali.
																</td>
															</tr>
														);
													}

													return terlambatData.map((td: any, idx: number) => (
														<tr key={td.siswa.id}>
															<td style={{ textAlign: "center", fontWeight: 600 }}>{idx + 1}</td>
															<td style={{ fontWeight: 700, color: "#0f172a" }}>{td.siswa.user?.nama}</td>
															<td>{td.siswa.nis}</td>
															<td style={{ textAlign: "center", fontWeight: "bold", color: "#ef4444" }}>{td.count} kali</td>
															<td>
																<ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: "0.85rem", color: "#64748b" }}>
																	{td.details.map((d: any, i: number) => (
																		<li key={i}>
																			<strong>{new Date(d.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}:</strong> {d.alasan}
																		</li>
																	))}
																</ul>
															</td>
														</tr>
													));
												})()}
											</tbody>
										</table>
									</div>
								</div>
							)}

							{/* --- TAB 2: JURNAL MENGAJAR --- */}
							{activeTab === "jurnal" && (
								<div className={styles.jurnalListContainer}>
									{!activeJadwal.jurnal || activeJadwal.jurnal.length === 0 ? (
										<div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
											Belum ada rekam jejak jurnal untuk kelas ini.
										</div>
									) : (
										(() => {
											const sortedJurnal = [...activeJadwal.jurnal].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
											const totalItems = sortedJurnal.length;
											const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
											const startIndex = (currentPageJurnal - 1) * itemsPerPage;
											const paginatedJurnal = sortedJurnal.slice(startIndex, startIndex + itemsPerPage);

											return (
												<>
													{paginatedJurnal.map((jurnalItem: any, index: number) => {
														const tglFormatted = new Date(jurnalItem.tanggal).toLocaleDateString("id-ID", {
															weekday: "long",
															year: "numeric",
															month: "long",
															day: "numeric",
														});

														const totalKls = activeJadwal.kelas.riwayatSiswa.length;
														const h = jurnalItem.presensi?.filter((p: any) => p.status === "H").length || 0;
														const is =
															jurnalItem.presensi?.filter((p: any) => p.status === "I" || p.status === "S").length || 0;
														const a = totalKls - h - is;

														return (
															<div key={jurnalItem.id} className={styles.jurnalLogCard}>
																<div className={styles.jurnalLogHeader}>
																	<div className={styles.jurnalLogTitle}>Pertemuan Ke-{startIndex + index + 1}</div>
																	<div className={styles.jurnalLogDate}>
																		<Calendar size={14} /> {tglFormatted}
																	</div>
																</div>

																<div className={styles.jurnalLogBody}>
																	<div className={styles.jurnalLogSection}>
																		<strong>Topik Materi</strong>
																		<p>{jurnalItem.materiBab || jurnalItem.topik}</p>
																	</div>

																	<div className={styles.jurnalLogSection}>
																		<strong>Catatan Evaluasi / Kendala KBM:</strong>
																		<p>
																			{jurnalItem.catatan ? (
																				jurnalItem.catatan
																			) : (
																				<span style={{ color: "#94a3b8", fontStyle: "italic" }}>
																					Tidak ada catatan tambahan untuk pertemuan ini.
																				</span>
																			)}
																		</p>
																	</div>

																	<div className={styles.jurnalLogStats}>
																		<span style={{ color: "#10b981" }}>Hadir: {h} Siswa</span>
																		<span style={{ color: "#f59e0b" }}>Izin/Sakit: {is} Siswa</span>
																		<span style={{ color: "#ef4444" }}>Alpha: {a} Siswa</span>
																	</div>
																</div>
															</div>
														);
													})}
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
												</>
											);
										})()
									)}
								</div>
							)}

							{/* --- TAB 3: ANALISA HASIL --- */}
							{activeTab === "analisa" &&
								(() => {
									const jurnalSorted = [...activeJadwal.jurnal].sort(
										(a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
									);
									const totalSiswaKls = activeJadwal.kelas.riwayatSiswa.length;

									const chartData = jurnalSorted.map((j, i) => {
										const h = j.presensi?.filter((p: any) => p.status === "H").length || 0;
										const pct = totalSiswaKls > 0 ? Math.round((h / totalSiswaKls) * 100) : 0;
										let fillColor = styles.barFill;
										if (pct < 75) fillColor = styles.barFillDanger;
										else if (pct < 90) fillColor = styles.barFillWarning;
										return { pertemuan: i + 1, pct, hadir: h, fillColor };
									});

									const warningStudents = activeJadwal.kelas.riwayatSiswa
										.map((rs: any) => {
											const rekap = getRekapSiswa(rs.siswa.id, activeJadwal.jurnal);
											return { ...rs.siswa, ...rekap };
										})
										.filter((s: any) => s.persentase < 80)
										.sort((a: any, b: any) => a.persentase - b.persentase);

									const notesData = jurnalSorted
										.map((j, i) => ({
											pertemuan: i + 1,
											tanggal: new Date(j.tanggal).toLocaleDateString("id-ID", {
												day: "numeric",
												month: "long",
												year: "numeric",
											}),
											catatan: j.catatan,
										}))
										.filter((n) => n.catatan && n.catatan.trim() !== "");

									return (
										<div className={styles.analisaContainer}>
											<div className={styles.chartCard}>
												<div className={styles.chartHeader}>
													<div>
														<div className={styles.chartTitle}>Grafik Tren Kehadiran</div>
														<div className={styles.chartSubtitle}>
															Persentase siswa hadir dari pertemuan pertama hingga terakhir.
														</div>
													</div>
												</div>
												<div className={styles.barChart}>
													{chartData.map((data, idx) => (
														<div key={idx} className={styles.barCol} title={`Hadir: ${data.hadir} Siswa`}>
															<div className={styles.barValue}>{data.pct}%</div>
															<div className={styles.barTrack}>
																<div
																	className={styles.barFill}
																	style={{
																		height: `${data.pct}%`,
																		backgroundColor:
																			data.pct < 75 ? "#ef4444" : data.pct < 90 ? "#f59e0b" : "#3b82f6",
																	}}
																></div>
															</div>
															<div className={styles.barLabel}>P-{data.pertemuan}</div>
														</div>
													))}
												</div>
												{chartData.length === 0 && (
													<div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
														Belum ada data kehadiran.
													</div>
												)}
											</div>

											<div className={styles.analisaGrid}>
												<div className={styles.noteSummaryCard}>
													<div className={styles.chartTitle}>Rangkuman Evaluasi & Kendala KBM</div>
													<div className={styles.chartSubtitle}>Kumpulan catatan pengajar selama satu semester.</div>

													<div className={styles.noteList}>
														{notesData.length === 0 ? (
															<div
																style={{
																	padding: "2rem",
																	textAlign: "center",
																	color: "#94a3b8",
																	fontStyle: "italic",
																	border: "1px dashed #cbd5e1",
																	borderRadius: "0.5rem",
																}}
															>
																Tidak ada catatan KBM yang direkam pada semester ini.
															</div>
														) : (
															notesData.map((note, idx) => (
																<div key={idx} className={styles.noteItem}>
																	<div className={styles.noteMeta}>
																		Pertemuan {note.pertemuan} &bull; {note.tanggal}
																	</div>
																	<p className={styles.noteText}>{note.catatan}</p>
																</div>
															))
														)}
													</div>
												</div>

												<div className={styles.warningCard}>
													<div className={styles.warningHeader}>
														<AlertTriangle size={20} /> Sistem Peringatan Dini
													</div>
													<div className={styles.chartSubtitle} style={{ marginBottom: "1.5rem", color: "#b91c1c" }}>
														Siswa dengan total kehadiran di bawah <strong>80%</strong>.
													</div>

													<div className={styles.warningList}>
														{warningStudents.length === 0 ? (
															<div
																style={{
																	textAlign: "center",
																	padding: "1rem",
																	color: "#047857",
																	fontWeight: 600,
																	background: "#d1fae5",
																	borderRadius: "0.5rem",
																}}
															>
																<CheckCircle2 size={16} style={{ display: "inline", marginBottom: "-3px" }} /> Aman!
																Tidak ada siswa berisiko.
															</div>
														) : (
															warningStudents.map((siswa: any) => (
																<div key={siswa.id} className={styles.warningItem}>
																	<div>
																		<div className={styles.warningName}>{siswa.user?.nama}</div>
																		<div className={styles.warningNis}>NIS: {siswa.nis}</div>
																	</div>
																	<div className={styles.warningStat}>
																		<div className={styles.warningPct}>{siswa.persentase}%</div>
																		<div className={styles.warningAbsen}>
																			Hadir {siswa.totalHadir}/{siswa.totalPertemuan}
																		</div>
																	</div>
																</div>
															))
														)}
													</div>
												</div>
											</div>
										</div>
									);
								})()}
						</div>
					</div>
				)}
			</div>

			{/* === AREA TERSEMBUNYI UNTUK EKSPOR MASSAL PDF === */}
			<div style={{ position: "absolute", top: "-9999px", left: "-9999px", visibility: "hidden", zIndex: -1 }}>
				<div id="mass-pdf-content" style={{ width: "210mm", backgroundColor: "#fff", color: "#000", fontFamily: "Arial, sans-serif" }}>
					{selectedJadwalIds.map((jadwalId, index) => {
						const jadwal = jadwalSemua.find((j) => j.id === jadwalId);
						if (!jadwal) return null;

						const mJurnalForPdf = [...jadwal.jurnal]
							.filter((j: any) => {
								if (!massStartDate || !massEndDate) return true;
								const d = new Date(j.tanggal).getTime();
								const s = new Date(massStartDate).getTime();
								const e = new Date(massEndDate);
								e.setHours(23, 59, 59, 999);
								return d >= s && d <= e.getTime();
							})
							.sort((a: any, b: any) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

						const mSortedSiswa = [...(jadwal.kelas?.riwayatSiswa || [])].sort((a: any, b: any) => (a.siswa?.user?.nama || "").localeCompare(b.siswa?.user?.nama || ""));
						let mJurnalTugas = mJurnalForPdf.filter((j: any) => j.tugas && j.tugas.trim() !== "" && j.tugas.trim() !== "-");
						mJurnalTugas = mJurnalTugas.filter((t: any) => {
							return t.presensi?.some((p: any) => p.nilaiTugas !== null && p.nilaiTugas !== undefined);
						});

						const format = (dateStr: string) => new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
						const mPeriodeText = (!massStartDate || !massEndDate) ? "Semua Periode" : `Periode: ${format(massStartDate)} - ${format(massEndDate)}`;

						const mJurnalChunks = chunkArray(mJurnalForPdf, MAX_ROWS);
						const mSiswaChunks = chunkArray(mSortedSiswa, MAX_ROWS);

						const mPagesBabA = mJurnalForPdf.length === 0 ? 1 : mJurnalChunks.length;
						const mPagesBabB = mSiswaChunks.length;
						const mPagesBabC = 1;
						const mPagesBabD = mJurnalTugas.length === 0 ? 0 : mSiswaChunks.length;
						const mTotalPdfPages = 1 + mPagesBabA + mPagesBabB + mPagesBabC + mPagesBabD;

						// Memastikan halaman terakhir dari satu mata pelajaran akan menyebabkan Page Break ke jadwal berikutnya
						const isLastJadwal = index === selectedJadwalIds.length - 1;

						return (
							<div key={jadwal.id}>
								{/* HALAMAN 1: COVER */}
								<PageContainer>
									<div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
										<h2 style={{ fontSize: "18pt", fontWeight: 800, marginBottom: "0.5rem" }}>RIWAYAT JURNAL MENGAJAR</h2>
										<h1 style={{ fontSize: "24pt", fontWeight: 900, color: "#0a2540", marginBottom: "0.5rem", textTransform: "uppercase", textAlign: "center" }}>{jadwal.mapel.nama}</h1>
										<p style={{ fontSize: "12pt", fontWeight: 600 }}>Tahun Akademik {jadwal.tahunAjaran.nama}</p>
										<p style={{ fontSize: "12pt", fontWeight: 600, marginTop: "0.5rem", color: "#dc2626" }}>{mPeriodeText}</p>
										<div style={{ margin: "1.5rem 0", display: "flex", justifyContent: "center" }}>
											<img src="/logo.jpg" alt="Logo SMAN 2 Brebes" style={{ width: "160px", height: "160px", objectFit: "contain" }} />
										</div>
										<div style={{ textAlign: "center" }}>
											<p style={{ fontSize: "11pt", marginBottom: "0.5rem" }}><strong>GURU PENGAMPU:</strong></p>
											<p style={{ fontSize: "14pt", fontWeight: 700, color: "#0a2540", margin: 0 }}>{user.nama}</p>
											<p style={{ fontSize: "11pt", marginTop: "0.5rem" }}>NIP: {user.username}</p>
										</div>
										<div style={{ marginTop: "2rem", textAlign: "center", borderTop: "2px solid #0a2540", paddingTop: "1.5rem", width: "70%", margin: "2rem auto 0 auto" }}>
											<p style={{ fontSize: "14pt", fontWeight: 800 }}>KELAS: {jadwal.kelas.nama}</p>
											<p style={{ fontSize: "12pt" }}>SMA NEGERI 2 BREBES</p>
										</div>
									</div>
									<PageFooter current={1} total={mTotalPdfPages} />
								</PageContainer>

								{/* BAB A: JURNAL */}
								{mJurnalForPdf.length === 0 ? (
									<PageContainer>
										<KopSurat />
										<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>A. JURNAL MENGAJAR & CATATAN KBM</h3>
										<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
											<thead style={{ display: "table-header-group" }}>
												<tr style={{ backgroundColor: "#f1f5f9" }}>
													<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>Pert.</th>
													<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "20%" }}>Tanggal</th>
													<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "25%" }}>Topik Pembelajaran</th>
													<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "35%" }}>Catatan Evaluasi / Kendala</th>
													<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>Status</th>
												</tr>
											</thead>
											<tbody>
												<tr>
													<td colSpan={5} style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>Belum ada jurnal untuk periode terpilih.</td>
												</tr>
											</tbody>
										</table>
										<PageFooter current={2} total={mTotalPdfPages} />
									</PageContainer>
								) : (
									mJurnalChunks.map((chunk, chunkIdx) => {
										const pageNum = 1 + (chunkIdx + 1);
										return (
											<div key={`A-${chunkIdx}`}>
												<PageContainer>
													<KopSurat />
													<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>A. JURNAL MENGAJAR & CATATAN KBM {chunkIdx > 0 ? "(Lanjutan)" : ""}</h3>
													<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
														<thead style={{ display: "table-header-group" }}>
															<tr style={{ backgroundColor: "#f1f5f9" }}>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>Pert.</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "20%" }}>Tanggal</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "25%" }}>Topik Pembelajaran</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "35%" }}>Catatan Evaluasi / Kendala</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>Status</th>
															</tr>
														</thead>
														<tbody>
															{chunk.map((jur: any, i: number) => {
																const globalIdx = (chunkIdx * MAX_ROWS) + i + 1;
																return (
																	<tr key={jur.id}>
																		<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{globalIdx}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{new Date(jur.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{jur.materiBab || jur.topik || "-"}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{jur.catatan || "-"}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{jur.status === "SUBMITTED" ? "Terkirim" : "Draft"}</td>
																	</tr>
																);
															})}
														</tbody>
													</table>
													<PageFooter current={pageNum} total={mTotalPdfPages} />
												</PageContainer>
											</div>
										);
									})
								)}

								{/* BAB B: REKAP KEHADIRAN */}
								{mSiswaChunks.map((chunk, chunkIdx) => {
									const pageNum = 1 + mPagesBabA + (chunkIdx + 1);
									return (
										<div key={`B-${chunkIdx}`}>
											<PageContainer>
												<KopSurat />
												<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "5px" }}>B. REKAPITULASI KEHADIRAN SISWA {chunkIdx > 0 ? "(Lanjutan)" : ""}</h3>
												{chunkIdx === 0 && <p style={{ fontSize: "9pt", marginBottom: "15px" }}><em>*Berdasarkan {mPeriodeText}</em></p>}
												<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
													<thead style={{ display: "table-header-group" }}>
														<tr style={{ backgroundColor: "#f1f5f9" }}>
															<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>No.</th>
															<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "35%" }}>Nama Siswa</th>
															<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>NIS</th>
															<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "7%", textAlign: "center" }}>H</th>
															<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "7%", textAlign: "center" }}>I</th>
															<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "7%", textAlign: "center" }}>S</th>
															<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "7%", textAlign: "center" }}>A</th>
															<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "17%", textAlign: "center" }}>% Hadir</th>
														</tr>
													</thead>
													<tbody>
														{chunk.map((rs: any, i: number) => {
															const globalIdx = (chunkIdx * MAX_ROWS) + i + 1;
															const rekap = getRekapSiswa(rs.siswa.id, mJurnalForPdf);
															return (
																<tr key={rs.siswa.id}>
																	<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{globalIdx}</td>
																	<td style={{ border: "1px solid #cbd5e1", padding: "6px" }}>{rs.siswa.user?.nama}</td>
																	<td style={{ border: "1px solid #cbd5e1", padding: "6px" }}>{rs.siswa.nis}</td>
																	<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{rekap.H}</td>
																	<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{rekap.I}</td>
																	<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{rekap.S}</td>
																	<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center", color: rekap.A > 0 ? "#ef4444" : "inherit" }}>{rekap.A}</td>
																	<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center", fontWeight: "bold" }}>{rekap.persentase}%</td>
																</tr>
															);
														})}
													</tbody>
												</table>
												<PageFooter current={pageNum} total={mTotalPdfPages} />
											</PageContainer>
										</div>
									);
								})}

								{/* BAB C: ANALISA */}
								{(() => {
									const pageNumC = 1 + mPagesBabA + mPagesBabB + 1;
									const totalSiswaKls = jadwal.kelas.riwayatSiswa.length;
									const chartData = mJurnalForPdf.map((j: any, i: number) => {
										const h = j.presensi?.filter((p: any) => p.status === "H").length || 0;
										const pct = totalSiswaKls > 0 ? Math.round((h / totalSiswaKls) * 100) : 0;
										let fillColor = "#0a2540";
										if (pct < 75) fillColor = "#ef4444";
										else if (pct < 90) fillColor = "#f59e0b";
										return { pertemuan: i + 1, pct, hadir: h, fillColor };
									});
									const statsPdf = getKelasStats(totalSiswaKls, mJurnalForPdf);

									return (
										<div>
											<PageContainer>
												<KopSurat />
												<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>C. ANALISA HASIL KBM</h3>
												<div style={{ border: "1px solid #000", padding: "1rem", marginBottom: "1.5rem" }}>
													<p style={{ fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center", fontSize: "11pt" }}>GRAFIK TREN KEHADIRAN SISWA</p>
													<div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "140px", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.5rem", margin: "0 2rem" }}>
														{chartData.length === 0 ? (
															<div style={{ color: "#64748b", fontSize: "10pt", alignSelf: "center" }}>Belum ada data kehadiran.</div>
														) : (
															chartData.map((data: any, idx: number) => (
																<div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "30px" }}>
																	<span style={{ fontSize: "8pt", fontWeight: "bold", marginBottom: "4px" }}>{data.pct}%</span>
																	<div style={{ height: "100px", width: "100%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "flex-end" }}>
																		<div style={{ width: "100%", height: `${data.pct}%`, backgroundColor: data.fillColor }}></div>
																	</div>
																	<span style={{ fontSize: "8pt", marginTop: "4px" }}>P-{data.pertemuan}</span>
																</div>
															))
														)}
													</div>
												</div>
												<div style={{ border: "1px solid #000", padding: "1rem" }}>
													<p><strong>REKAPITULASI CAPAIAN KELAS:</strong></p>
													<p style={{ marginBottom: "1rem" }}>Rata-rata persentase kehadiran kelas {jadwal.kelas.nama} adalah <strong>{statsPdf.rataKehadiran}%</strong> selama <strong>{statsPdf.totalPertemuan} pertemuan</strong>.</p>
														{(() => {
															const notes = mJurnalForPdf.filter((j: any) => j.catatan && j.catatan.trim() !== "" && j.catatan.trim() !== "-");
															if (notes.length === 0) return null;
															return (
																<>
																	<p><strong>RANGKUMAN CATATAN EVALUASI:</strong></p>
																	<ul style={{ paddingLeft: "1.5rem", marginBottom: "2rem" }}>
																		{notes.map((n: any, i: number) => (
																			<li key={i} style={{ marginBottom: "0.5rem" }}>
																				<strong>Pertemuan ke-{i + 1} ({new Date(n.tanggal).toLocaleDateString("id-ID")}):</strong> {n.catatan}
																			</li>
																		))}
																	</ul>
																</>
															);
														})()}
													<div style={{ textAlign: "right", marginTop: "3rem", paddingRight: "10%" }}>
														<p>Brebes, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
														<p style={{ marginBottom: "4rem" }}>Guru Pengampu,</p>
														<p><strong>{user.nama}</strong></p>
														<p>NIP: {user.username}</p>
													</div>
												</div>
												<PageFooter current={pageNumC} total={mTotalPdfPages} />
											</PageContainer>
										</div>
									);
								})()}

								{mJurnalTugas.length > 0 && (
									mSiswaChunks.map((chunk, chunkIdx) => {
										const pageNum = 1 + mPagesBabA + mPagesBabB + 1 + (chunkIdx + 1);
										const isLastPage = isLastJadwal && chunkIdx === mSiswaChunks.length - 1;
										return (
											<div key={`D-${chunkIdx}`}>
												<PageContainer isLast={isLastPage}>
													<KopSurat />
													<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px" }}>D. REKAPITULASI NILAI TUGAS {chunkIdx > 0 ? "(Lanjutan)" : ""}</h3>
													<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9pt" }}>
														<thead style={{ display: "table-header-group" }}>
															<tr style={{ backgroundColor: "#f1f5f9" }}>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>No.</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "35%" }}>Nama Siswa</th>
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>NIS</th>
																{mJurnalTugas.map((t: any) => (
																	<th key={t.id} style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{t.tugas}</th>
																))}
																<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "10%", textAlign: "center" }}>Rata-rata</th>
															</tr>
														</thead>
														<tbody>
															{chunk.map((rs: any, i: number) => {
																const globalIdx = (chunkIdx * MAX_ROWS) + i + 1;
																const rekap = getRekapSiswa(rs.siswa.id, mJurnalForPdf);
																return (
																	<tr key={rs.siswa.id}>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{globalIdx}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px" }}>{rs.siswa.user?.nama}</td>
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px" }}>{rs.siswa.nis}</td>
																		{mJurnalTugas.map((t: any) => {
																			const absen = t.presensi?.find((p: any) => p.siswaId === rs.siswa.id);
																			const nilai = absen?.nilaiTugas;
																			return <td key={t.id} style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center" }}>{nilai !== null && nilai !== undefined ? nilai : "-"}</td>;
																		})}
																		<td style={{ border: "1px solid #cbd5e1", padding: "6px", textAlign: "center", fontWeight: "bold" }}>{rekap.countTugas > 0 ? rekap.rataNilai : "-"}</td>
																	</tr>
																);
															})}
														</tbody>
													</table>
													<PageFooter current={pageNum} total={mTotalPdfPages} />
												</PageContainer>
											</div>
										);
									})
								)}
							</div>
						);
					})}
				</div>
			</div>
		</>
	);
}