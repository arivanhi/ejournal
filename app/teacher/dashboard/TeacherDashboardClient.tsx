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
	const [activeSession, setActiveSession] = useState<any | null>(null);
	const [currentTime, setCurrentTime] = useState<Date | null>(null);

	// --- 1. LOGIKA PENGGABUNGAN JADWAL BERURUTAN (GROUPING) ---
	const groupedJadwal = useMemo(() => {
		const grouped: any[] = [];
		const hariOrder: Record<string, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 7 };

		// Urutkan jadwal berdasarkan Hari -> Kelas -> Mapel -> Waktu/Jam
		const sortedJadwal = [...jadwalKeseluruhan].sort((a, b) => {
			if (hariOrder[a.hari] !== hariOrder[b.hari]) return (hariOrder[a.hari] || 99) - (hariOrder[b.hari] || 99);
			if (a.kelasNama !== b.kelasNama) return a.kelasNama.localeCompare(b.kelasNama);
			if (a.mapelNama !== b.mapelNama) return a.mapelNama.localeCompare(b.mapelNama);

			const jamA = parseInt(a.waktuMulai);
			const jamB = parseInt(b.waktuMulai);
			return (isNaN(jamA) ? 0 : jamA) - (isNaN(jamB) ? 0 : jamB);
		});

		sortedJadwal.forEach((curr) => {
			const last = grouped[grouped.length - 1];
			const currJam = parseInt(curr.waktuMulai); // Ambil angka Sesi (misal "2")

			// Jika jadwal ini adalah lanjutan dari jadwal sebelumnya di kelas dan mapel yang sama
			if (
				last &&
				last.hari === curr.hari &&
				last.kelasNama === curr.kelasNama &&
				last.mapelNama === curr.mapelNama &&
				!isNaN(currJam)
			) {
				const lastJams = last.jams;
				if (lastJams && lastJams.length > 0) {
					const lastJamVal = lastJams[lastJams.length - 1];
					// Cek apakah sesinya berurutan persis (misal setelah 2 adalah 3)
					if (currJam === lastJamVal + 1) {
						last.jams.push(currJam);
						// Ubah tampilan menjadi rentang (Contoh: Jam 2-4)
						last.displayJam =
							last.jams.length > 1 ? `Jam ${last.jams[0]}-${last.jams[last.jams.length - 1]}` : `Jam ${last.jams[0]}`;
						return; // Abaikan iterasi ini karena sudah digabung
					}
				}
			}

			// Jika tidak berurutan atau beda mapel, buat baris baru
			grouped.push({
				...curr,
				jams: isNaN(currJam) ? [] : [currJam], // Simpan array sesi
				displayJam: isNaN(currJam) ? curr.waktuMulai : `Jam ${currJam}`, // Fallback untuk data lama (07:00 - 08:30)
			});
		});

		return grouped;
	}, [jadwalKeseluruhan]);

	// --- 2. TIMER & PENGECEKAN SESI AKTIF REAL-TIME ---
	useEffect(() => {
		// Map durasi standar Jam ke-1 sampai ke-10 (dalam menit) untuk cek "Sesi Aktif"
		const JAM_MAP = [
			{ jam: 1, start: 7 * 60 + 0, end: 7 * 60 + 45 }, // 07:00 - 07:45
			{ jam: 2, start: 7 * 60 + 45, end: 8 * 60 + 30 }, // 07:45 - 08:30
			{ jam: 3, start: 8 * 60 + 30, end: 9 * 60 + 15 }, // 08:30 - 09:15
			{ jam: 4, start: 9 * 60 + 15, end: 10 * 60 + 0 }, // 09:15 - 10:00
			{ jam: 5, start: 10 * 60 + 30, end: 11 * 60 + 15 }, // 10:30 - 11:15
			{ jam: 6, start: 11 * 60 + 15, end: 12 * 60 + 0 }, // 11:15 - 12:00
			{ jam: 7, start: 13 * 60 + 0, end: 13 * 60 + 45 }, // 13:00 - 13:45
			{ jam: 8, start: 13 * 60 + 45, end: 14 * 60 + 30 }, // 13:45 - 14:30
			{ jam: 9, start: 14 * 60 + 30, end: 15 * 60 + 15 }, // 14:30 - 15:15
			{ jam: 10, start: 15 * 60 + 15, end: 16 * 60 + 0 }, // 15:15 - 16:00
		];

		const checkActiveSession = (now: Date) => {
			const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
			const currentDay = days[now.getDay()];
			const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();

			const ongoing = groupedJadwal.find((j) => {
				if (j.hari.toLowerCase() !== currentDay.toLowerCase()) return false;

				// Logika 1: Jika menggunakan data rentang sesi baru (misal Jam 2-4)
				if (j.jams && j.jams.length > 0) {
					const firstJam = JAM_MAP.find((m) => m.jam === j.jams[0]);
					const lastJam = JAM_MAP.find((m) => m.jam === j.jams[j.jams.length - 1]);
					if (firstJam && lastJam) {
						return currentMinutesTotal >= firstJam.start && currentMinutesTotal <= lastJam.end;
					}
				}

				// Logika 2: Jika masih menggunakan format lama (07:00 - 08:30)
				if (j.waktuMulai && j.waktuMulai.includes("-")) {
					const timeParts = j.waktuMulai.split(" - ");
					if (timeParts.length === 2) {
						const [startHour, startMin] = timeParts[0].split(":");
						const [endHour, endMin] = timeParts[1].split(":");
						const startTotal = parseInt(startHour) * 60 + parseInt(startMin);
						const endTotal = parseInt(endHour) * 60 + parseInt(endMin);
						return currentMinutesTotal >= startTotal && currentMinutesTotal <= endTotal;
					}
				}

				return false;
			});

			setActiveSession(ongoing || null);
		};

		// Jalankan Timer 1 detik
		setCurrentTime(new Date());
		checkActiveSession(new Date());

		const interval = setInterval(() => {
			const now = new Date();
			setCurrentTime(now);
			// Cek jadwal aktif setiap menit (detik 0)
			if (now.getSeconds() === 0) {
				checkActiveSession(now);
			}
		}, 1000);

		return () => clearInterval(interval);
	}, [groupedJadwal]);

	// Format Tanggal dan Jam untuk Hero Banner
	const todayFormatted =
		currentTime
			?.toLocaleDateString("id-ID", {
				weekday: "long",
				day: "numeric",
				month: "long",
				year: "numeric",
			})
			.toUpperCase() || "MEMUAT TANGGAL...";

	const timeFormatted =
		currentTime?.toLocaleTimeString("id-ID", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		}) + " WIB" || "MEMUAT JAM...";

	return (
		<div className={styles.layoutWrapper}>
			{/* SIDEBAR */}
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
						</>
					)}
					<Link href="/teacher/setelan" className={styles.menuItem}>
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
							{/* Tambahan Widget Jam Real-Time */}
							<div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "0.75rem" }}>
								<span className={styles.heroDate} style={{ margin: 0 }}>
									{todayFormatted}
								</span>
								<span
									style={{
										backgroundColor: "rgba(255,255,255,0.2)",
										padding: "4px 12px",
										borderRadius: "99px",
										fontSize: "0.875rem",
										fontWeight: 600,
										display: "flex",
										alignItems: "center",
										gap: "6px",
									}}
								>
									<Clock size={14} /> {timeFormatted}
								</span>
							</div>
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
							{/* BANNER SESI AKTIF (Hanya Muncul Jika Jam Cocok) */}
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
													<Clock size={16} /> {activeSession.displayJam} {/* Menampilkan "Jam 2-4" */}
												</span>
												<span>
													<MapPin size={16} /> {activeSession.ruang}
												</span>
											</div>
										</div>
									</div>
									<Link href={`/teacher/jurnal?jadwalId=${activeSession.id}`} className={styles.btnActionActive}>
										Buat Jurnal Sesi Ini <ArrowRight size={16} />
									</Link>
								</div>
							)}

							<div className={styles.cardBox}>
								<div className={styles.cardHeader}>
									<h3 className={styles.cardTitle}>Jadwal Mengajar Keseluruhan</h3>
									<span className={styles.badgeCount}>{groupedJadwal.length} Jadwal</span>
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
											{groupedJadwal.length === 0 ? (
												<tr>
													<td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
														Belum ada jadwal mengajar yang diatur.
													</td>
												</tr>
											) : (
												groupedJadwal.map((jadwal, i) => (
													<tr key={`${jadwal.id}-${i}`}>
														<td style={{ fontWeight: 500 }}>{i + 1}</td>
														<td style={{ color: "#64748b" }}>{jadwal.mapelKode || "-"}</td>
														<td style={{ fontWeight: 600 }}>{jadwal.mapelNama}</td>
														<td style={{ fontWeight: 600, color: "#0a2540" }}>{jadwal.kelasNama}</td>
														<td>
															<div>
																<span className={styles.badgeHari}>{jadwal.hari.toUpperCase()}</span>
																<div style={{ fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
																	{jadwal.displayJam} {/* Render Hasil Penggabungan (Misal: Jam 2-4) */}
																</div>
																<div className={styles.textRuang} style={{ marginTop: "2px" }}>
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
									<div className={styles.metricLabel}>Sesi Minggu Ini</div>
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
