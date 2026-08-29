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
	const [currentTime, setCurrentTime] = useState<Date | null>(null);

	// Logika hari ini untuk default tab
	const daysStr = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
	const todayStr = useMemo(() => daysStr[new Date().getDay()], []);
	const [selectedHari, setSelectedHari] = useState<string>("Semua");

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

	// Menghitung hari-hari apa saja yang tersedia di jadwal (unik dan diurutkan)
	const availableDays = useMemo(() => {
		const uniqueDays = Array.from(new Set(groupedJadwal.map((j) => j.hari)));
		const hariOrder: Record<string, number> = { Senin: 1, Selasa: 2, Rabu: 3, Kamis: 4, Jumat: 5, Sabtu: 6, Minggu: 7 };
		return uniqueDays.sort((a, b) => (hariOrder[a] || 99) - (hariOrder[b] || 99));
	}, [groupedJadwal]);

	// Set default tab ke hari ini jika hari ini ada jadwal
	useEffect(() => {
		if (availableDays.includes(todayStr)) {
			setSelectedHari(todayStr);
		} else {
			setSelectedHari("Semua");
		}
	}, [availableDays, todayStr]);

	// Menyaring jadwal berdasarkan hari terpilih
	const filteredJadwal = useMemo(() => {
		if (selectedHari === "Semua") return groupedJadwal;
		return groupedJadwal.filter((j) => j.hari === selectedHari);
	}, [groupedJadwal, selectedHari]);

	// --- 2. TIMER & PENGECEKAN SESI AKTIF REAL-TIME ---
	useEffect(() => {
		// Jalankan Timer 1 detik
		setCurrentTime(new Date());

		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);

		return () => clearInterval(interval);
	}, []);

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
		<>
			
			

			
			<>
				

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
							<div className={styles.cardBox}>
								<div className={styles.cardHeader}>
									<h3 className={styles.cardTitle}>Jadwal Mengajar Keseluruhan</h3>
									<span className={styles.badgeCount}>{filteredJadwal.length} Jadwal</span>
								</div>

								{/* TABS NAVIGASI HARI */}
								<div style={{ padding: "0 1.25rem 1rem 1.25rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", borderBottom: "1px solid #f1f5f9" }}>
									<div style={{ display: "flex", background: "#f1f5f9", padding: "4px", borderRadius: "8px", gap: "4px", flexWrap: "wrap" }}>
										<button
											onClick={() => setSelectedHari("Semua")}
											style={{
												padding: "6px 14px",
												fontSize: "0.75rem",
												fontWeight: "bold",
												borderRadius: "6px",
												cursor: "pointer",
												border: "none",
												transition: "all 0.2s",
												backgroundColor: selectedHari === "Semua" ? "#ffffff" : "transparent",
												color: selectedHari === "Semua" ? "#1e293b" : "#64748b",
												boxShadow: selectedHari === "Semua" ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
											}}
										>
											Semua
										</button>
										{availableDays.map((hari) => (
											<button
												key={hari}
												onClick={() => setSelectedHari(hari)}
												style={{
													padding: "6px 14px",
													fontSize: "0.75rem",
													fontWeight: "bold",
													borderRadius: "6px",
													cursor: "pointer",
													border: "none",
													transition: "all 0.2s",
													backgroundColor: selectedHari === hari ? "#ffffff" : "transparent",
													color: selectedHari === hari ? "#1e293b" : "#64748b",
													boxShadow: selectedHari === hari ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
												}}
											>
												{hari}
											</button>
										))}
									</div>
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
											{filteredJadwal.length === 0 ? (
												<tr>
													<td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
														Belum ada jadwal mengajar yang diatur untuk {selectedHari === "Semua" ? "hari apapun" : `hari ${selectedHari}`}.
													</td>
												</tr>
											) : (
												filteredJadwal.map((jadwal, i) => (
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
			</>
		</>
	);
}
