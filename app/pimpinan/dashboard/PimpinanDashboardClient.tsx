"use client";

import { useState } from "react";
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

export default function PimpinanDashboardClient({
	user,
	tahunAjaran,
	stats,
	tingkatAbsensi,
	peringatanJamKosong,
	riwayatJurnal,
	dataSiswaAbsen,
}: any) {
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// State Modal Download PDF Harian
	const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	const filteredJurnal = riwayatJurnal.filter((jurnal: any) => {
		const namaGuru = jurnal?.jadwal?.guru?.user?.nama?.toLowerCase() || "";
		const namaKelas = jurnal?.jadwal?.kelas?.nama?.toLowerCase() || "";
		const keyword = searchTerm.toLowerCase();
		return namaGuru.includes(keyword) || namaKelas.includes(keyword);
	});

	const totalPages = Math.max(1, Math.ceil(filteredJurnal.length / itemsPerPage));
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentItems = filteredJurnal.slice(startIndex, startIndex + itemsPerPage);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const todayObj = new Date();
	const todayFormatted = todayObj.toLocaleDateString("id-ID", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	// Nama File Export
	const safeTahun = tahunAjaran?.nama ? tahunAjaran.nama.replace(/\//g, "-") : "Unknown";
	const dayStr = String(todayObj.getDate()).padStart(2, "0");
	const monthStr = String(todayObj.getMonth() + 1).padStart(2, "0");
	const yearStr = todayObj.getFullYear();
	const pdfFilename = `${dayStr}_${monthStr}_${yearStr}_rekap_harian_(${safeTahun}).pdf`;

	// --- FUNGSI EXPORT PDF HARIAN ---
	const handleDownloadPdf = async () => {
		setIsDownloading(true);
		try {
			const html2pdf = (await import("html2pdf.js")).default;
			const element = document.getElementById("pdf-harian-container");

			const opt = {
				margin: 0,
				filename: pdfFilename,
				image: { type: "jpeg", quality: 1 },
				html2canvas: { scale: 2, useCORS: true },
				jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
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

	// KOMPONEN KOP SURAT (Agar bisa dipanggil berulang di setiap halaman)
	const pdfHeader = (
		<div
			style={{
				position: "relative",
				textAlign: "center",
				borderBottom: "3px solid #000",
				paddingBottom: "15px",
				marginBottom: "15px",
				paddingTop: "10px",
			}}
		>
			<img
				src="/logo.jpg"
				alt="Logo SMAN 2 Brebes"
				style={{
					position: "absolute",
					left: "10px",
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
					fontSize: "18pt",
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
	);

	return (
		<div className={styles.layoutWrapper}>
			{/* === CONTAINER TERSEMBUNYI UNTUK EXPORT PDF A4 POTRAIT === */}
			<div style={{ display: "none" }}>
				<div
					id="pdf-harian-container"
					style={{
						width: "210mm",
						minHeight: "297mm",
						padding: "15mm",
						boxSizing: "border-box",
						backgroundColor: "#fff",
						color: "#000",
						fontFamily: "Arial, sans-serif",
					}}
				>
					{/* HALAMAN 1: KOP SURAT & RINGKASAN */}
					{pdfHeader}

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

					{/* DAFTAR JAM KOSONG */}
					<h3
						style={{
							fontSize: "12pt",
							fontWeight: "bold",
							borderBottom: "1px solid #000",
							paddingBottom: "5px",
							marginBottom: "10px",
							marginTop: "20px",
						}}
					>
						A. Daftar Kelas Jam Kosong (Tidak Terisi Jurnal)
					</h3>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "10pt",
							border: "1px solid #000",
							marginBottom: "20px",
						}}
					>
						<thead>
							<tr style={{ backgroundColor: "#f1f5f9" }}>
								<th style={{ border: "1px solid #000", padding: "6px", width: "5%", textAlign: "center" }}>No</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "30%" }}>Nama Guru Pengampu</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "35%" }}>Mata Pelajaran</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "15%", textAlign: "center" }}>Kelas</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "15%", textAlign: "center" }}>
									Sesi Ke-
								</th>
							</tr>
						</thead>
						<tbody>
							{peringatanJamKosong.length === 0 ? (
								<tr>
									<td colSpan={5} style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
										Tidak ada jam kosong hari ini.
									</td>
								</tr>
							) : (
								peringatanJamKosong.map((alert: any, i: number) => (
									<tr key={i}>
										<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{i + 1}</td>
										<td style={{ border: "1px solid #000", padding: "6px" }}>{alert.guru}</td>
										<td style={{ border: "1px solid #000", padding: "6px" }}>{alert.mapel}</td>
										<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{alert.kelas}</td>
										<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{alert.jam}</td>
									</tr>
								))
							)}
						</tbody>
					</table>

					{/* HALAMAN 2: DAFTAR SISWA ABSEN */}
					<div className="html2pdf__page-break"></div>
					{pdfHeader}
					<h3
						style={{
							fontSize: "12pt",
							fontWeight: "bold",
							borderBottom: "1px solid #000",
							paddingBottom: "5px",
							marginBottom: "10px",
							marginTop: "10px",
						}}
					>
						B. Daftar Kehadrian Siswa (Sakit/Izin/Alpa)
					</h3>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "10pt",
							border: "1px solid #000",
							marginBottom: "20px",
						}}
					>
						<thead>
							<tr style={{ backgroundColor: "#f1f5f9" }}>
								<th style={{ border: "1px solid #000", padding: "6px", width: "5%", textAlign: "center" }}>No</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "40%" }}>Nama Siswa</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "20%", textAlign: "center" }}>Kelas</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "20%", textAlign: "center" }}>
									Status Absen
								</th>
							</tr>
						</thead>
						<tbody>
							{!dataSiswaAbsen || dataSiswaAbsen.length === 0 ? (
								<tr>
									<td colSpan={4} style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
										Belum ada data siswa absen terekam hari ini.
									</td>
								</tr>
							) : (
								dataSiswaAbsen.map((siswa: any, i: number) => (
									<tr key={i}>
										<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{i + 1}</td>
										<td style={{ border: "1px solid #000", padding: "6px" }}>{siswa.nama}</td>
										<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{siswa.kelas}</td>
										<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
											{siswa.status === "S" ? "Sakit" : siswa.status === "I" ? "Izin" : "Alpa"}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>

					{/* HALAMAN 3: RIWAYAT JURNAL TERKUMPUL */}
					<div className="html2pdf__page-break"></div>
					{pdfHeader}
					<h3
						style={{
							fontSize: "12pt",
							fontWeight: "bold",
							borderBottom: "1px solid #000",
							paddingBottom: "5px",
							marginBottom: "10px",
							marginTop: "10px",
						}}
					>
						C. Riwayat Jurnal Guru Masuk
					</h3>
					<table
						style={{
							width: "100%",
							borderCollapse: "collapse",
							fontSize: "10pt",
							border: "1px solid #000",
							marginBottom: "20px",
						}}
					>
						<thead>
							<tr style={{ backgroundColor: "#f1f5f9" }}>
								<th style={{ border: "1px solid #000", padding: "6px", width: "5%", textAlign: "center" }}>No</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "30%" }}>Nama Guru</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "25%" }}>Mata Pelajaran</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "20%", textAlign: "center" }}>
									Kelas (Sesi)
								</th>
								<th style={{ border: "1px solid #000", padding: "6px", width: "20%", textAlign: "center" }}>
									Waktu Submit
								</th>
							</tr>
						</thead>
						<tbody>
							{riwayatJurnal.length === 0 ? (
								<tr>
									<td colSpan={5} style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
										Belum ada jurnal yang masuk hari ini.
									</td>
								</tr>
							) : (
								riwayatJurnal.map((jurnal: any, i: number) => (
									<tr key={i}>
										<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{i + 1}</td>
										<td style={{ border: "1px solid #000", padding: "6px" }}>{jurnal.jadwal.guru.user.nama}</td>
										<td style={{ border: "1px solid #000", padding: "6px" }}>{jurnal.jadwal.mapel.nama}</td>
										<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
											{jurnal.jadwal.kelas.nama} ({jurnal.waktuMulai})
										</td>
										<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
											{new Date(jurnal.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>

					{/* TTD Pimpinan */}
					<div style={{ textAlign: "right", marginTop: "40px" }}>
						<p style={{ margin: 0, fontSize: "11pt" }}>Brebes, {todayFormatted}</p>
						<p style={{ margin: "5px 0 50px 0", fontSize: "11pt" }}>Kepala Sekolah SMAN 2 Brebes</p>
						<p style={{ margin: 0, fontSize: "11pt", fontWeight: "bold" }}>{user.nama}</p>
						<p style={{ margin: 0, fontSize: "11pt" }}>NIP: {user.username}</p>
					</div>
				</div>
			</div>

			{/* === MODAL PREVIEW PDF (UI) === */}
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
								<li>Daftar Siswa Absen (Sakit/Izin/Alpa)</li>
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

			{/* SIDEBAR PIMPINAN */}
			<aside className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<div className={styles.logoWrapper}>
						<img src="/logo.jpg" alt="Logo SMAN 2 Brebes" className={styles.logoImage} />
					</div>
					<div>
						<div className={styles.schoolName}>SMAN 2 Brebes</div>
						<div className={styles.portalName}>Dashboard Pimpinan</div>
					</div>
				</div>

				<nav className={styles.menuContainer}>
					<Link href="/pimpinan/dashboard" className={`${styles.menuItem} ${styles.menuItemActive}`}>
						<LayoutDashboard size={18} /> Dashboard
					</Link>
					<Link href="/pimpinan/kehadiran" className={styles.menuItem}>
						<Users size={18} /> Kehadiran Siswa
					</Link>
					<Link href="/pimpinan/monitoring" className={styles.menuItem}>
						<Clock size={18} /> Monitoring KBM
					</Link>
					<Link href="/pimpinan/jurnal" className={styles.menuItem}>
						<BookOpen size={18} /> Jurnal Mengajar
					</Link>
					<Link href="/pimpinan/report" className={styles.menuItem}>
						<FileBarChart size={18} /> Laporan Rekapitulasi
					</Link>
					<Link href="/pimpinan/setelan" className={styles.menuItem} style={{ marginBottom: "0.5rem" }}>
						<Settings size={18} /> Setelan
					</Link>
				</nav>

				<div className={styles.sidebarFooter}>
					<button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
						<LogOut size={18} /> Keluar
					</button>
				</div>
			</aside>

			{/* MAIN CONTENT */}
			<main className={styles.mainContent}>
				{/* TOPBAR */}
				<header className={styles.topbar}>
					<div>
						<h1 className={styles.topbarTitle}>E-Journal & Presensi</h1>
					</div>
					<div className={styles.topbarActions}>
						<Bell size={20} className={styles.iconAction} />
						<Settings size={20} className={styles.iconAction} />
						<div className={styles.profileSection}>
							<div className={styles.profileInfo}>
								<span className={styles.profileName}>{user.nama}</span>
								<span className={styles.profileRole}>
									{user.role === "KEPSEK" ? "Kepala Sekolah" : "Wakil Kepala Sekolah"}
								</span>
							</div>
						</div>
					</div>
				</header>

				<div className={styles.dashboardContainer}>
					{/* SECTION: RINGKASAN HARI INI */}
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

					{/* SUMMARY CARDS */}
					<div className={styles.summaryGrid}>
						{/* Card 1: Absen */}
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

						{/* Card 2: Jam Kosong */}
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

						{/* Card 3: Jurnal Terkumpul */}
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

					{/* ALERTS & CHART ROW */}
					<div className={styles.twoColGrid}>
						{/* Peringatan Jam Kosong */}
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
												<strong>{alert.jam.split(":")[0]}</strong>
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

						{/* Tingkat Absensi Tertinggi */}
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
							<p className={styles.chartFootnote}>Berdasarkan data presensi sesi 1-3 hari ini.</p>
						</div>
					</div>

					{/* TABLE: RIWAYAT JURNAL GURU */}
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
													{jurnal.jadwal.kelas.nama} <span className={styles.badgeSesi}>{jurnal.waktuMulai}</span>
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

						{/* Paginasi Real */}
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
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
									disabled={currentPage === totalPages || filteredJurnal.length === 0}
									onClick={() => handlePageChange(currentPage + 1)}
								>
									Next
								</button>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
