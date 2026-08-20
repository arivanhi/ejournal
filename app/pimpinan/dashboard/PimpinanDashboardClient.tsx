"use client";

import { useState, useEffect } from "react";
import {
	LayoutDashboard,
	Users,
	Clock,
	BookOpen,
	FileBarChart,
	Bell,
	Settings,
	LogOut,
	Download,
	UserX,
	AlertTriangle,
	CheckCircle2,
	Search,
	X,
	Printer,
} from "lucide-react";
import styles from "./pimpinan.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";

function chunkArray<T>(arr: T[], size: number): T[][] {
	const chunks = [];
	for (let i = 0; i < arr.length; i += size) {
		chunks.push(arr.slice(i, i + size));
	}
	return chunks;
}

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
				<p style={{ margin: "2px 0", fontSize: "10pt", color: "#000" }}>Jl. Jend. A. Yani 77 Brebes 52212 Telp. (0283) 671060</p>
				<p style={{ margin: 0, fontSize: "10pt", color: "#000" }}>Website: sman2brebes.sch.id - Email: smadabes@gmail.com</p>
			</div>
			<div style={{ width: "120px" }}></div>
		</div>
		<div style={{ borderBottom: "1px solid black" }}></div>
	</div>
);


export default function PimpinanDashboardClient({
	user,
	tahunAjaran,
	stats,
	tingkatAbsensi,
	peringatanJamKosong,
	riwayatJurnal,
	dataKehadiranSiswa = [],
}: any) {
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 15;

	const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	const filteredJurnal = riwayatJurnal.filter((jurnal: any) => {
		const namaGuru = jurnal?.jadwal?.guru?.user?.nama?.toLowerCase() || "";
		const namaKelas = jurnal?.jadwal?.kelas?.nama?.toLowerCase() || "";
		const keyword = searchTerm.toLowerCase();
		return namaGuru.includes(keyword) || namaKelas.includes(keyword);
	});

	const totalPagesWeb = Math.max(1, Math.ceil(filteredJurnal.length / itemsPerPage));
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentItems = filteredJurnal.slice(startIndex, startIndex + itemsPerPage);

	const handlePageChange = (page: number) => setCurrentPage(page);

	const todayObj = new Date();
	const todayFormatted = todayObj.toLocaleDateString("id-ID", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	const safeTahun = tahunAjaran?.nama ? tahunAjaran.nama.replace(/\//g, "-") : "Unknown";
	const dayStr = String(todayObj.getDate()).padStart(2, "0");
	const monthStr = String(todayObj.getMonth() + 1).padStart(2, "0");
	const yearStr = todayObj.getFullYear();
	const pdfFilename = `${dayStr}_${monthStr}_${yearStr}_rekap_harian_(${safeTahun}).pdf`;

	const classNames = Array.from(new Set(dataKehadiranSiswa.map((s: any) => s.kelas))).sort() as string[];
	const [activeClassTab, setActiveClassTab] = useState<string>("");

	useEffect(() => {
		if (classNames.length > 0 && !classNames.includes(activeClassTab)) {
			setActiveClassTab(classNames[0]);
		}
	}, [classNames, activeClassTab]);

	const filteredAbsenByClass = dataKehadiranSiswa.filter((s: any) => s.kelas === activeClassTab);

	// --- FUNGSI FORMAT JAM SESI DARI JADWAL ---
	const formatJamSesi = (jadwal: any) => {
		let jamStart = jadwal?.waktuMulai?.trim() || "";
		let jamEnd = jadwal?.waktuSelesai?.trim() || "";

		if (jamStart === "-") jamStart = "";
		if (jamEnd === "-") jamEnd = "";

		if (jamStart && jamEnd && jamStart !== jamEnd) {
			return `Jam ke ${jamStart}-${jamEnd}`;
		} else if (jamStart) {
			return `Jam ke ${jamStart}`;
		} else if (jamEnd) {
			return `Jam ke ${jamEnd}`;
		}
		return "-";
	};

	// --- LOGIKA PERHITUNGAN HALAMAN MANUAL (CHUNKING) ---
	const MAX_ROWS = 25;

	const peringatanChunks = chunkArray(peringatanJamKosong, MAX_ROWS);
	if (peringatanChunks.length === 0) peringatanChunks.push([]);

	const kehadiranChunks = chunkArray(dataKehadiranSiswa, MAX_ROWS);
	if (kehadiranChunks.length === 0) kehadiranChunks.push([]);

	const jurnalChunks = chunkArray(riwayatJurnal, MAX_ROWS);
	if (jurnalChunks.length === 0) jurnalChunks.push([]);

	const totalPdfPages = 1 + peringatanChunks.length + kehadiranChunks.length + jurnalChunks.length;

	const handleDownloadPdf = async () => {
		setIsDownloading(true);
		try {
			const html2pdf = (await import("html2pdf.js")).default;
			const element = document.getElementById("pdf-harian-container");

			const opt = {
				margin: 0, // KUNCI: Diset 0 agar mengikuti padding <PageContainer>
				filename: pdfFilename,
				image: { type: "jpeg", quality: 1 },
				html2canvas: { scale: 2, useCORS: true },
				jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				pagebreak: { mode: ['css'] } // Mematuhi instruksi PageBreak manual
			};

			await html2pdf().set(opt).from(element).save();
		} catch (error) {
			console.error("Gagal men-generate PDF:", error);
			alert("Terjadi kesalahan saat memproses laporan PDF.");
		} finally {
			setIsDownloading(false);
			setIsPdfModalOpen(false);
		}
	};

	return (
		<>
			{/* ================================================================= */}
			{/* AREA TERSEMBUNYI UNTUK CETAK PDF (SISTEM PAGINATION MANUAL)       */}
			{/* ================================================================= */}
			<div style={{ display: "none" }}>
				<div id="pdf-harian-container" style={{ width: "100%", backgroundColor: "#fff", color: "#000", fontFamily: "Arial, sans-serif" }}>

					{/* PAGE 1: SUMMARY */}
					<PageContainer isLast={false}>
						<KopSurat />
						<div style={{ textAlign: "center", marginBottom: "20px" }}>
							<h2 style={{ margin: 0, fontSize: "14pt", fontWeight: "bold", textTransform: "uppercase" }}>
								REKAP LAPORAN HARI INI
							</h2>
							<p style={{ margin: "5px 0", fontSize: "11pt" }}>
								Tanggal: {todayFormatted} | Tahun Ajaran: {tahunAjaran?.nama}
							</p>
						</div>

						<div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
							<div style={{ flex: 1, border: "1px solid #000", padding: "10px", textAlign: "center" }}>
								<p style={{ margin: 0, fontSize: "10pt", fontWeight: "bold" }}>TOTAL SISWA ABSEN</p>
								<h3 style={{ margin: "5px 0 0 0", fontSize: "16pt" }}>{stats.totalSiswaAbsen} Siswa</h3>
							</div>
							<div style={{ flex: 1, border: "1px solid #000", padding: "10px", textAlign: "center" }}>
								<p style={{ margin: 0, fontSize: "10pt", fontWeight: "bold" }}>JAM KOSONG</p>
								<h3 style={{ margin: "5px 0 0 0", fontSize: "16pt" }}>{stats.jamKosongCount} Sesi</h3>
							</div>
							<div style={{ flex: 1, border: "1px solid #000", padding: "10px", textAlign: "center" }}>
								<p style={{ margin: 0, fontSize: "10pt", fontWeight: "bold" }}>JURNAL TERKUMPUL</p>
								<h3 style={{ margin: "5px 0 0 0", fontSize: "16pt" }}>
									{stats.jurnalTerkumpul} / {stats.totalJadwalTarget}
								</h3>
							</div>
						</div>
						<PageFooter current={1} total={totalPdfPages} />
					</PageContainer>
					<div className="html2pdf__page-break"></div>

					{/* A. Daftar Kelas Jam Kosong */}
					{peringatanChunks.map((chunk: any[], chunkIdx: number) => {
						const pageNum = 1 + (chunkIdx + 1);
						return (
							<div key={`peringatan-${chunkIdx}`}>
								<PageContainer isLast={false}>
									<KopSurat />
									<h3 style={{ fontSize: "12pt", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "5px", marginBottom: "10px", marginTop: "10px" }}>
										A. Daftar Kelas Jam Kosong (Tidak Terisi Jurnal) {chunkIdx > 0 ? "(Lanjutan)" : ""}
									</h3>
									<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", border: "1px solid #000" }}>
										<thead style={{ display: "table-header-group" }}>
											<tr style={{ backgroundColor: "#f1f5f9" }}>
												<th style={{ border: "1px solid #000", padding: "6px", width: "5%", textAlign: "center" }}>No</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "30%" }}>Nama Guru Pengampu</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "35%" }}>Mata Pelajaran</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "15%", textAlign: "center" }}>Kelas</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "15%", textAlign: "center" }}>Jam Ke-</th>
											</tr>
										</thead>
										<tbody>
											{chunk.length === 0 ? (
												<tr>
													<td colSpan={5} style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
														Tidak ada jam kosong hari ini.
													</td>
												</tr>
											) : (
												chunk.map((alert: any, i: number) => (
													<tr key={i}>
														<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{chunkIdx * MAX_ROWS + i + 1}</td>
														<td style={{ border: "1px solid #000", padding: "6px" }}>{alert.guru}</td>
														<td style={{ border: "1px solid #000", padding: "6px" }}>{alert.mapel}</td>
														<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{alert.kelas}</td>
														<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{alert.jam}</td>
													</tr>
												))
											)}
										</tbody>
									</table>
									<PageFooter current={pageNum} total={totalPdfPages} />
								</PageContainer>
								<div className="html2pdf__page-break"></div>
							</div>
						);
					})}

					{/* B. Daftar Kehadiran Siswa */}
					{kehadiranChunks.map((chunk: any[], chunkIdx: number) => {
						const pageNum = 1 + peringatanChunks.length + (chunkIdx + 1);
						return (
							<div key={`kehadiran-${chunkIdx}`}>
								<PageContainer isLast={false}>
									<KopSurat />
									<h3 style={{ fontSize: "12pt", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "5px", marginBottom: "10px", marginTop: "10px" }}>
										B. Daftar Kehadiran Siswa (Semua Status) {chunkIdx > 0 ? "(Lanjutan)" : ""}
									</h3>
									<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", border: "1px solid #000" }}>
										<thead style={{ display: "table-header-group" }}>
											<tr style={{ backgroundColor: "#f1f5f9" }}>
												<th style={{ border: "1px solid #000", padding: "6px", width: "5%", textAlign: "center" }}>No</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "40%" }}>Nama Siswa</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "20%", textAlign: "center" }}>Kelas</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "20%", textAlign: "center" }}>Status</th>
											</tr>
										</thead>
										<tbody>
											{chunk.length === 0 ? (
												<tr>
													<td colSpan={4} style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
														Belum ada data kehadiran siswa hari ini.
													</td>
												</tr>
											) : (
												chunk.map((siswa: any, i: number) => (
													<tr key={i}>
														<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{chunkIdx * MAX_ROWS + i + 1}</td>
														<td style={{ border: "1px solid #000", padding: "6px" }}>{siswa.nama}</td>
														<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{siswa.kelas}</td>
														<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
															{siswa.status === "H" ? "Hadir" : siswa.status === "S" ? "Sakit" : siswa.status === "I" ? "Izin" : "Alpa"}
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
									<PageFooter current={pageNum} total={totalPdfPages} />
								</PageContainer>
								<div className="html2pdf__page-break"></div>
							</div>
						);
					})}

					{/* C. Riwayat Jurnal Guru Masuk */}
					{jurnalChunks.map((chunk: any[], chunkIdx: number) => {
						const pageNum = 1 + peringatanChunks.length + kehadiranChunks.length + (chunkIdx + 1);
						const isLastPage = chunkIdx === jurnalChunks.length - 1;
						return (
							<div key={`jurnal-${chunkIdx}`}>
								<PageContainer isLast={isLastPage}>
									<KopSurat />
									<h3 style={{ fontSize: "12pt", fontWeight: "bold", borderBottom: "1px solid #000", paddingBottom: "5px", marginBottom: "10px", marginTop: "10px" }}>
										C. Riwayat Jurnal Guru Masuk {chunkIdx > 0 ? "(Lanjutan)" : ""}
									</h3>
									<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", border: "1px solid #000" }}>
										<thead style={{ display: "table-header-group" }}>
											<tr style={{ backgroundColor: "#f1f5f9" }}>
												<th style={{ border: "1px solid #000", padding: "6px", width: "5%", textAlign: "center" }}>No</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "30%" }}>Nama Guru</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "25%" }}>Mata Pelajaran</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "20%", textAlign: "center" }}>Kelas (Jam Ke)</th>
												<th style={{ border: "1px solid #000", padding: "6px", width: "20%", textAlign: "center" }}>Waktu Submit</th>
											</tr>
										</thead>
										<tbody>
											{chunk.length === 0 ? (
												<tr>
													<td colSpan={5} style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
														Belum ada jurnal yang masuk hari ini.
													</td>
												</tr>
											) : (
												chunk.map((jurnal: any, i: number) => (
													<tr key={i}>
														<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{chunkIdx * MAX_ROWS + i + 1}</td>
														<td style={{ border: "1px solid #000", padding: "6px" }}>{jurnal.jadwal.guru.user.nama}</td>
														<td style={{ border: "1px solid #000", padding: "6px" }}>{jurnal.jadwal.mapel.nama}</td>
														<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
															{jurnal.jadwal.kelas.nama} ({formatJamSesi(jurnal.jadwal)})
														</td>
														<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
															{new Date(jurnal.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>

									{isLastPage && (
										<div style={{ textAlign: "right", marginTop: "40px" }}>
											<p style={{ margin: 0, fontSize: "11pt" }}>Brebes, {todayFormatted}</p>
											<p style={{ margin: "5px 0 50px 0", fontSize: "11pt" }}>Kepala Sekolah SMAN 2 Brebes</p>
											<p style={{ margin: 0, fontSize: "11pt", fontWeight: "bold" }}>{user.nama}</p>
											<p style={{ margin: 0, fontSize: "11pt" }}>NIP: {user.username}</p>
										</div>
									)}
									<PageFooter current={pageNum} total={totalPdfPages} />
								</PageContainer>
								{!isLastPage && <div className="html2pdf__page-break"></div>}
							</div>
						);
					})}
				</div>
			</div>

			{/* === MODAL PREVIEW & PDF === */}
			{isPdfModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainerLarge} style={{ maxWidth: "600px", height: "auto" }}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Ekspor Laporan Harian</h3>
							<button className={styles.modalCloseBtn} onClick={() => setIsPdfModalOpen(false)}>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody} style={{ padding: "2rem", textAlign: "center" }}>
							<FileBarChart size={48} color="#3b82f6" style={{ margin: "0 auto 1rem auto" }} />
							<p style={{ fontSize: "1rem", color: "#334155", marginBottom: "0.5rem" }}>
								Laporan harian (PDF A4 Portrait) akan memuat data:
							</p>
							<ul style={{ textAlign: "left", display: "inline-block", color: "#475569", fontSize: "0.875rem" }}>
								<li>Daftar Kelas dengan Jam Kosong</li>
								<li>Daftar Kehadiran Siswa (Semua Status)</li>
								<li>Riwayat Lengkap Jurnal Masuk Hari Ini</li>
							</ul>
						</div>
						<div className={styles.modalFooter}>
							<button className={styles.btnOutline} onClick={() => setIsPdfModalOpen(false)}>
								Batal
							</button>
							<button className={styles.btnPrimary} onClick={handleDownloadPdf} disabled={isDownloading}>
								{isDownloading ? (
									"Memproses PDF..."
								) : (
									<>
										<Printer size={16} style={{ marginRight: "0.5rem" }} /> Unduh PDF Laporan
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* === MAIN CONTENT (WEB UI) === */}
			<div className={styles.dashboardContainer}>
				<div className={styles.sectionHeader}>
					<div>
						<h2 className={styles.sectionTitle}>Ringkasan Hari Ini</h2>
						<p className={styles.sectionDate}>{todayFormatted}</p>
					</div>
					<div className={styles.headerButtons}>
						<button className={styles.btnPrimary} onClick={() => setIsPdfModalOpen(true)}>
							<Download size={16} /> Ekspor Laporan Harian
						</button>
					</div>
				</div>

				<div className={styles.summaryGrid}>
					<div className={styles.summaryCard}>
						<div className={styles.cardTop}>
							<div className={styles.iconWrapperRed}>
								<UserX size={20} />
							</div>
							<span className={styles.badgeRed}>Terpantau</span>
						</div>
						<div className={styles.cardLabel}>TOTAL SISWA ABSEN</div>
						<div className={styles.cardValueBox}>
							<span className={styles.cardValue}>{stats.totalSiswaAbsen}</span>
							<span className={styles.cardUnit}>Siswa</span>
						</div>
						<div className={styles.cardDesc}>
							Terbanyak di kelas {tingkatAbsensi[0]?.kelas || "-"} ({tingkatAbsensi[0]?.jumlah || 0} siswa)
						</div>
					</div>

					<div className={styles.summaryCard}>
						<div className={styles.cardTop}>
							<div className={styles.iconWrapperYellow}>
								<Clock size={20} />
							</div>
							<span className={styles.badgeBlue}>Sedang Berlangsung</span>
						</div>
						<div className={styles.cardLabel}>JAM KOSONG (BELUM DIISI)</div>
						<div className={styles.cardValueBox}>
							<span className={styles.cardValue}>{stats.jamKosongCount}</span>
							<span className={styles.cardUnit}>Sesi KBM</span>
						</div>
						<div className={styles.cardDesc}>Membutuhkan perhatian segera</div>
					</div>

					<div className={styles.summaryCard}>
						<div className={styles.cardTop}>
							<div className={styles.iconWrapperBlue}>
								<BookOpen size={20} />
							</div>
							<span className={styles.badgeBlue}>
								Progress{" "}
								{stats.totalJadwalTarget > 0
									? Math.round((stats.jurnalTerkumpul / stats.totalJadwalTarget) * 100)
									: 0}
								%
							</span>
						</div>
						<div className={styles.cardLabel}>JURNAL GURU TERKUMPUL</div>
						<div className={styles.cardValueBox}>
							<span className={styles.cardValue}>{stats.jurnalTerkumpul}</span>
							<span className={styles.cardUnit}>/ {stats.totalJadwalTarget} Total</span>
						</div>
						<div className={styles.progressTrack}>
							<div
								className={styles.progressBar}
								style={{
									width: `${stats.totalJadwalTarget > 0 ? (stats.jurnalTerkumpul / stats.totalJadwalTarget) * 100 : 0}%`,
								}}
							></div>
						</div>
					</div>
				</div>

				<div className={styles.twoColGrid}>
					<div className={styles.boxCard}>
						<div className={styles.boxHeader}>
							<div className={styles.boxTitle}>
								<AlertTriangle size={20} color="#f59e0b" /> Peringatan Jam Kosong
							</div>
							<Link href="/pimpinan/monitoring" className={styles.linkA}>
								Lihat Semua
							</Link>
						</div>
						<div className={styles.alertList}>
							{peringatanJamKosong.length === 0 ? (
								<div className={styles.emptyText}>Semua kelas terpantau aman.</div>
							) : (
								peringatanJamKosong.map((alert: any, i: number) => (
									<div key={i} className={styles.alertItem}>
										<div className={styles.alertJamBox}>
											Jam
											<br />
											<strong>{alert.jam}</strong>
										</div>
										<div className={styles.alertInfo}>
											<div className={styles.alertClass}>
												{alert.kelas} - {alert.mapel}
											</div>
											<div className={styles.alertTeacher}>Guru: {alert.guru}</div>
										</div>
										<div
											className={`${styles.statusBadge} ${alert.status.includes("Tugas") ? styles.badgeYellowOutline : styles.badgeRedOutline}`}
										>
											{alert.status}
										</div>
									</div>
								))
							)}
						</div>
					</div>

					<div className={styles.boxCard}>
						<div className={styles.boxHeader}>
							<div className={styles.boxTitle} style={{ color: "#0f172a" }}>
								📈 Tingkat Absensi Tertinggi
							</div>
							<Link href="/pimpinan/kehadiran" className={styles.linkA}>
								Lihat Semua
							</Link>
						</div>
						<div className={styles.barChartContainer}>
							{tingkatAbsensi.length === 0 ? (
								<div className={styles.emptyText}>Belum ada data absensi hari ini.</div>
							) : (
								tingkatAbsensi.map((absen: any, i: number) => (
									<div key={i} className={styles.barItem}>
										<div className={styles.barLabels}>
											<span className={styles.barClassName}>{absen.kelas}</span>
											<span className={styles.barValueRed}>
												{absen.jumlah} Siswa ({absen.persentase}%)
											</span>
										</div>
										<div className={styles.barTrack}>
											<div className={styles.barFillRed} style={{ width: `${absen.persentase}%` }}></div>
										</div>
									</div>
								))
							)}
						</div>
						<p className={styles.chartFootnote}>Berdasarkan data presensi jurnal terkirim hari ini.</p>
					</div>
				</div>

				<div className={styles.boxCard} style={{ marginTop: "1.5rem" }}>
					<div className={styles.boxHeader}>
						<div className={styles.boxTitle} style={{ color: "#0f172a", fontSize: "1.1rem" }}>
							<Users
								size={20}
								color="#3b82f6"
								style={{ marginRight: "0.5rem", display: "inline-block", verticalAlign: "text-bottom" }}
							/>
							Tabel Kehadiran Siswa Hari Ini
						</div>
					</div>

					{classNames.length === 0 ? (
						<div className={styles.emptyText} style={{ padding: "2rem", textAlign: "center" }}>
							Belum ada data kehadiran siswa yang dilaporkan hari ini.
						</div>
					) : (
						<>
							<div
								style={{
									display: "flex",
									gap: "0.5rem",
									borderBottom: "1px solid #e2e8f0",
									paddingBottom: "1rem",
									marginBottom: "1rem",
									overflowX: "auto",
									scrollbarWidth: "none",
								}}
							>
								{classNames.map((cls) => (
									<button
										key={cls}
										onClick={() => setActiveClassTab(cls)}
										style={{
											padding: "0.5rem 1rem",
											borderRadius: "0.5rem",
											backgroundColor: activeClassTab === cls ? "#0b1c36" : "#f8fafc",
											color: activeClassTab === cls ? "#ffffff" : "#475569",
											fontWeight: activeClassTab === cls ? "600" : "500",
											border: activeClassTab === cls ? "1px solid #0b1c36" : "1px solid #e2e8f0",
											cursor: "pointer",
											whiteSpace: "nowrap",
											transition: "all 0.2s ease",
										}}
									>
										{cls}
									</button>
								))}
							</div>

							<div className={styles.tableWrapper}>
								<div style={{ overflowX: "auto", width: "100%" }}>
									<table className={styles.dataTable}>
										<thead>
											<tr>
												<th style={{ width: "5%" }}>NO</th>
												<th style={{ width: "40%" }}>NAMA SISWA</th>
												<th style={{ width: "35%" }}>MATA PELAJARAN (JURNAL)</th>
												<th style={{ width: "20%", textAlign: "center" }}>STATUS</th>
											</tr>
										</thead>
										<tbody>
											{filteredAbsenByClass.map((siswa: any, idx: number) => (
												<tr key={idx}>
													<td style={{ textAlign: "center" }}>{idx + 1}</td>
													<td style={{ fontWeight: 500 }}>{siswa.nama}</td>
													<td style={{ color: "#64748b" }}>{siswa.mapel}</td>
													<td style={{ textAlign: "center" }}>
														<span
															style={{
																padding: "0.35rem 0.85rem",
																borderRadius: "9999px",
																fontSize: "0.8rem",
																fontWeight: 600,
																display: "inline-block",
																backgroundColor:
																	siswa.status === "H"
																		? "#dcfce7"
																		: siswa.status === "S"
																			? "#fef3c7"
																			: siswa.status === "I"
																				? "#e0f2fe"
																				: "#fee2e2",
																color:
																	siswa.status === "H"
																		? "#16a34a"
																		: siswa.status === "S"
																			? "#d97706"
																			: siswa.status === "I"
																				? "#0284c7"
																				: "#dc2626",
																border: `1px solid ${siswa.status === "H" ? "#bbf7d0" : siswa.status === "S" ? "#fde68a" : siswa.status === "I" ? "#bae6fd" : "#fecaca"}`,
															}}
														>
															{siswa.status === "H"
																? "Hadir"
																: siswa.status === "S"
																	? "Sakit"
																	: siswa.status === "I"
																		? "Izin"
																		: "Alpa"}
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</>
					)}
				</div>

				<div className={styles.boxCard} style={{ marginTop: "1.5rem" }}>
					<div className={styles.boxHeader}>
						<div className={styles.boxTitle} style={{ color: "#0f172a", fontSize: "1.25rem" }}>
							Riwayat Jurnal Guru Masuk Hari Ini
						</div>
						<div className={styles.tableToolbar}>
							<div className={styles.searchBox}>
								<Search size={16} className={styles.searchIcon} />
								<input
									type="text"
									placeholder="Cari nama guru atau kelas..."
									className={styles.searchInput}
									value={searchTerm}
									onChange={(e) => {
										setSearchTerm(e.target.value);
										setCurrentPage(1);
									}}
								/>
							</div>
						</div>
					</div>

					<div className={styles.tableWrapper}>
						<div style={{ overflowX: "auto", width: "100%" }}>
							<table className={styles.dataTable}>
								<thead>
									<tr>
										<th>NAMA GURU</th>
										<th>MATA PELAJARAN</th>
										<th>KELAS (SESI)</th>
										<th>STATUS JURNAL</th>
										<th>WAKTU SUBMIT</th>
									</tr>
								</thead>
								<tbody>
									{currentItems.length === 0 ? (
										<tr>
											<td colSpan={5} className={styles.emptyText} style={{ textAlign: "center", padding: "2rem" }}>
												Belum ada jurnal yang masuk.
											</td>
										</tr>
									) : (
										currentItems.map((jurnal: any) => (
											<tr key={jurnal.id}>
												<td>
													<div className={styles.guruProfile}>
														<div className={styles.guruInitials}>
															{jurnal.jadwal.guru.user.nama.substring(0, 2).toUpperCase()}
														</div>
														<span style={{ fontWeight: 600, color: "#1e293b" }}>{jurnal.jadwal.guru.user.nama}</span>
													</div>
												</td>
												<td style={{ color: "#64748b" }}>{jurnal.jadwal.mapel.nama}</td>
												<td>
													{jurnal.jadwal.kelas.nama}{" "}
													<span className={styles.badgeSesi}>{formatJamSesi(jurnal.jadwal)}</span>
												</td>
												<td>
													<span className={styles.badgeGreen}>
														<CheckCircle2 size={12} /> Lengkap
													</span>
												</td>
												<td style={{ color: "#64748b" }}>
													{new Date(jurnal.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}{" "}
													WIB
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</div>

					<div className={styles.pagination}>
						<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
							Menampilkan {filteredJurnal.length === 0 ? 0 : startIndex + 1}-
							{Math.min(startIndex + itemsPerPage, filteredJurnal.length)} dari {filteredJurnal.length} data
						</span>
						<div className={styles.pageButtons}>
							<button
								className={styles.pageBtn}
								disabled={currentPage === 1}
								onClick={() => handlePageChange(currentPage - 1)}
							>
								Prev
							</button>
							{Array.from({ length: totalPagesWeb }, (_, i) => i + 1).map((page) => (
								<button
									key={page}
									className={`${styles.pageBtn} ${currentPage === page ? styles.pageActive : ""}`}
									onClick={() => handlePageChange(page)}
								>
									{page}
								</button>
							))}
							<button
								className={styles.pageBtn}
								disabled={currentPage === totalPagesWeb || filteredJurnal.length === 0}
								onClick={() => handlePageChange(currentPage + 1)}
							>
								Next
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}