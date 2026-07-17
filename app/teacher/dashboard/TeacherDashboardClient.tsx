"use client";

import { useState, useEffect } from "react";
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
	GraduationCap,
	MapPin,
	Clock,
	UsersRound,
	AlertTriangle,
	ArrowRight,
} from "lucide-react";
import styles from "./teacher.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface DashboardProps {
	user: { nama: string; role: string };
	isWaliKelas: boolean;
	dataWaliKelas: { namaKelas: string; jumlahSiswa: number; izinHariIni: number } | null;
	jadwalKeseluruhan: {
		id: string;
		hari: string;
		waktuMulai: string;
		waktuSelesai: string;
		mapelKode: string;
		mapelNama: string;
		kelasNama: string;
		ruang: string;
	}[];
	stats: { jamMingguIni: number; kehadiran: number | null };
	jurnalBelumTerisi: { id: string; kelasNama: string; tanggal: string } | null;
	aktivitasTerkini: { id: string; judul: string; waktu: string }[];
}

export default function TeacherDashboardClient({
	user,
	isWaliKelas,
	dataWaliKelas,
	jadwalKeseluruhan,
	stats,
	jurnalBelumTerisi,
	aktivitasTerkini,
}: DashboardProps) {
	// State untuk menyimpan jadwal yang sedang berlangsung SAAT INI
	const [activeSession, setActiveSession] = useState<any | null>(null);

	// Fungsi pengecekan Real-time
	useEffect(() => {
		const checkActiveSession = () => {
			const now = new Date();
			const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
			const currentDay = days[now.getDay()];

			// Konversi waktu sekarang ke total menit untuk perbandingan akurat
			const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();

			const ongoing = jadwalKeseluruhan.find((j) => {
				// 1. Cek apakah Harinya sama
				if (j.hari.toLowerCase() !== currentDay.toLowerCase()) return false;

				// 2. Cek apakah rentang waktunya cocok
				// Format DB Anda: "07:00 - 08:30" di field waktuMulai
				const timeParts = j.waktuMulai.split(" - ");
				if (timeParts.length !== 2) return false;

				const [startHour, startMin] = timeParts[0].split(":");
				const [endHour, endMin] = timeParts[1].split(":");

				const startTotal = parseInt(startHour) * 60 + parseInt(startMin);
				const endTotal = parseInt(endHour) * 60 + parseInt(endMin);

				// TRUE jika waktu sekarang berada di antara jam mulai dan jam selesai
				return currentMinutesTotal >= startTotal && currentMinutesTotal <= endTotal;
			});

			setActiveSession(ongoing || null);
		};

		// Jalankan sekali saat render pertama
		checkActiveSession();
		// Update pengecekan setiap 1 menit (60000 ms) agar selalu sinkron
		const interval = setInterval(checkActiveSession, 60000);
		return () => clearInterval(interval);
	}, [jadwalKeseluruhan]);

	const todayFormatted = new Date()
		.toLocaleDateString("id-ID", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		})
		.toUpperCase();

	return (
		<div className={styles.layoutWrapper}>
			{/* SIDEBAR (Sama Seperti Sebelumnya) */}
			<aside className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<div
						className={styles.logoWrapper}
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "40px",
							height: "40px",
							borderRadius: "50%",
							backgroundColor: "white",
							overflow: "hidden",
						}}
					>
						<img
							src="/logo.jpg"
							alt="Logo SMAN 2 Brebes"
							className={styles.logoImage}
							style={{ width: "100%", height: "100%", objectFit: "cover" }}
						/>
					</div>
					<div>
						<div className={styles.schoolName}>
							SMAN 2<br />
							Brebes
						</div>
						<div className={styles.portalName}>Teacher Portal</div>
					</div>
				</div>

				<nav className={styles.menuContainer}>
					<Link href="/teacher/dashboard" className={`${styles.menuItem} ${styles.menuItemActive}`}>
						<LayoutDashboard size={18} /> Dashboard
					</Link>
					<Link href="/teacher/jurnal" className={styles.menuItem}>
						<BookOpen size={18} /> Jurnal Mengajar
					</Link>
					<Link href="/teacher/presensi" className={styles.menuItem}>
						<QrCode size={18} /> Presensi QR
					</Link>
					<Link href="/teacher/riwayat" className={styles.menuItem}>
						<History size={18} /> Riwayat
					</Link>
					{isWaliKelas && (
						<>
							<div className={styles.menuSection}>MENU WALI KELAS</div>
							<Link href="/teacher/data-siswa" className={styles.menuItem}>
								<Users size={18} /> Data Siswa
							</Link>
							<Link href="/teacher/setelan" className={styles.menuItem}>
								<Settings size={18} /> Setelan
							</Link>
						</>
					)}
				</nav>

				<div className={styles.sidebarFooter}>
					<button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
						<LogOut size={18} /> Keluar
					</button>
				</div>
			</aside>

			{/* MAIN CONTENT */}
			<main className={styles.mainContent}>
				<header className={styles.topbar}>
					<h1 className={styles.greeting}>Selamat Pagi, {user.nama}!</h1>
					<div className={styles.topbarActions}>
						<Bell size={20} style={{ cursor: "pointer" }} />
						<HelpCircle size={20} style={{ cursor: "pointer" }} />
						<div className={styles.profileAvatar}>
							<div style={{ width: "100%", height: "100%", backgroundColor: "#dbeafe" }}></div>
						</div>
					</div>
				</header>

				<div className={styles.dashboardContainer}>
					<div className={styles.heroBanner}>
						<div>
							<span className={styles.heroDate}>{todayFormatted}</span>
							<h2 className={styles.heroQuote}>
								"Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan, Anda dapat mengubah
								dunia."
							</h2>
							<div className={styles.heroAuthor}>- Nelson Mandela</div>
						</div>
						<GraduationCap className={styles.heroLogoBg} />
					</div>

					{isWaliKelas && dataWaliKelas && (
						<div className={styles.homeroomCard}>
							<div className={styles.homeroomInfo}>
								<div className={styles.homeroomIcon}>
									<Users size={24} />
								</div>
								<div>
									<div className={styles.homeroomTitle}>Informasi Wali Kelas</div>
									<div className={styles.homeroomSubtitle}>Wali Kelas: {dataWaliKelas.namaKelas}</div>
								</div>
							</div>
							<div className={styles.homeroomStats}>
								<div className={styles.statBlock}>
									<div className={styles.statNumber}>{dataWaliKelas.jumlahSiswa}</div>
									<div className={styles.statLabel}>Siswa Terdaftar</div>
								</div>
								<div className={styles.statDivider}></div>
								<div className={styles.statBlock}>
									<div className={styles.statNumber} style={{ color: "#059669" }}>
										{dataWaliKelas.izinHariIni}
									</div>
									<div className={styles.statLabel}>Izin Hari Ini</div>
								</div>
							</div>
						</div>
					)}

					<div className={styles.gridLayout}>
						{/* KIRI: Kontainer Tabel & Live Session */}
						<div>
							{/* --- BANNER SESI AKTIF (Hanya Muncul Jika Jam Cocok) --- */}
							{activeSession && (
								<div className={styles.activeSessionCard}>
									<div className={styles.activeSessionInfo}>
										<div className={styles.activeIndicator}>
											<div className={styles.pulseDot}></div>
											<div className={styles.activeLabel}>LIVE</div>
										</div>
										<div className={styles.activeDetails}>
											<h3>
												{activeSession.mapelNama} - {activeSession.kelasNama}
											</h3>
											<div className={styles.activeMeta}>
												<span>
													<Clock size={16} /> {activeSession.waktuMulai}
												</span>
												<span>
													<MapPin size={16} /> {activeSession.ruang}
												</span>
											</div>
										</div>
									</div>
									{/* Tombol akan mengarah ke halaman form pembuatan jurnal (Tugas kita selanjutnya) */}
									<Link href={`/teacher/jurnal?jadwalId=${activeSession.id}`} className={styles.btnActionActive}>
										Buat Jurnal Sesi Ini <ArrowRight size={16} />
									</Link>
								</div>
							)}

							<div className={styles.cardBox}>
								<div className={styles.cardHeader}>
									<h3 className={styles.cardTitle}>Jadwal Mengajar Keseluruhan</h3>
									<span className={styles.badgeCount}>{jadwalKeseluruhan.length} Sesi</span>
								</div>

								<div className={styles.tableContainer}>
									<table className={styles.jadwalTable}>
										<thead>
											<tr>
												<th>No</th>
												<th>Kode Mapel</th>
												<th>Mata Pelajaran</th>
												<th>Kelas</th>
												<th>Waktu & Ruang</th>
											</tr>
										</thead>
										<tbody>
											{jadwalKeseluruhan.length === 0 ? (
												<tr>
													<td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
														Belum ada jadwal mengajar yang diatur.
													</td>
												</tr>
											) : (
												jadwalKeseluruhan.map((jadwal, i) => (
													<tr key={jadwal.id}>
														<td style={{ fontWeight: 500 }}>{i + 1}</td>
														<td style={{ color: "#64748b" }}>{jadwal.mapelKode || "-"}</td>
														<td style={{ fontWeight: 600 }}>{jadwal.mapelNama}</td>
														<td style={{ fontWeight: 600, color: "#0a2540" }}>{jadwal.kelasNama}</td>
														<td>
															<div>
																<span className={styles.badgeHari}>{jadwal.hari.toUpperCase()}</span>
																<div style={{ fontWeight: 600, color: "#1e293b" }}>{jadwal.waktuMulai}</div>
																<div className={styles.textRuang}>
																	<MapPin size={12} /> {jadwal.ruang}
																</div>
															</div>
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>
							</div>
						</div>

						{/* KANAN: Metrics, Alerts, Timeline */}
						<div className={styles.rightCol}>
							<div className={styles.metricsGrid}>
								<div className={styles.metricCard}>
									<Clock size={24} className={styles.metricIcon} />
									<div className={styles.metricValue}>{stats.jamMingguIni}</div>
									<div className={styles.metricLabel}>Jam Minggu Ini</div>
								</div>
								<div className={styles.metricCard}>
									<UsersRound size={24} className={styles.metricIcon} />
									{stats.kehadiran !== null ? (
										<>
											<div className={styles.metricValue}>{stats.kehadiran}%</div>
											<div className={styles.metricLabel}>Kehadiran</div>
										</>
									) : (
										<div className={styles.metricTextSmall}>Belum pernah melakukan KBM</div>
									)}
								</div>
							</div>

							{jurnalBelumTerisi && (
								<div className={styles.alertCard}>
									<div className={styles.alertHeader}>
										<AlertTriangle size={16} /> Jurnal Belum Terisi
									</div>
									<div className={styles.alertBody}>
										Anda memiliki jurnal mengajar yang belum diisi untuk kelas{" "}
										<strong>{jurnalBelumTerisi.kelasNama}</strong> ({jurnalBelumTerisi.tanggal}).
									</div>
									<Link href="/teacher/jurnal" className={styles.alertLink}>
										Isi Jurnal Sekarang
									</Link>
								</div>
							)}

							<div className={styles.cardBox} style={{ padding: "1.25rem" }}>
								<h3 className={styles.cardTitle} style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
									Aktivitas Terkini
								</h3>
								{aktivitasTerkini.length === 0 ? (
									<div style={{ fontSize: "0.875rem", color: "#9ca3af", textAlign: "center", padding: "1rem 0" }}>
										Belum ada aktivitas terkini.
									</div>
								) : (
									<div className={styles.timelineContainer}>
										{aktivitasTerkini.map((aktivitas, index) => (
											<div key={aktivitas.id} className={styles.timelineItem}>
												<div className={index === 0 ? styles.timelineDot : styles.timelineDotDull}></div>
												<div className={styles.timelineTitle}>{aktivitas.judul}</div>
												<div className={styles.timelineTime}>{aktivitas.waktu}</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
