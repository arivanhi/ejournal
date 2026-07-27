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
}: any) {
	// State untuk Pencarian dan Paginasi
	const [searchTerm, setSearchTerm] = useState("");
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 10;

	// Logika Pencarian
	const filteredJurnal = riwayatJurnal.filter((jurnal: any) => {
		const namaGuru = jurnal?.jadwal?.guru?.user?.nama?.toLowerCase() || "";
		const namaKelas = jurnal?.jadwal?.kelas?.nama?.toLowerCase() || "";
		const keyword = searchTerm.toLowerCase();
		return namaGuru.includes(keyword) || namaKelas.includes(keyword);
	});

	// Logika Paginasi
	const totalPages = Math.max(1, Math.ceil(filteredJurnal.length / itemsPerPage));
	const startIndex = (currentPage - 1) * itemsPerPage;
	const currentItems = filteredJurnal.slice(startIndex, startIndex + itemsPerPage);

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
	};

	const todayFormatted = new Date().toLocaleDateString("id-ID", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	return (
		<div className={styles.layoutWrapper}>
			{/* SIDEBAR */}
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
							<button className={styles.btnPrimary}>
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
								<span className={styles.badgeRed}>+12% dari kemarin</span>
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
								Riwayat Jurnal Guru
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
											setCurrentPage(1); // Reset ke halaman 1 saat mengetik
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
												Data tidak ditemukan.
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

								{/* Mapping Angka Paginasi */}
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
