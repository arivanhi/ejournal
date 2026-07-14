import { Users, GraduationCap, CalendarCheck, Settings, BookCopy, ArrowRight } from "lucide-react";
import styles from "./adminDashboard.module.css";

export default function AdminDashboard() {
	return (
		<div className={styles.dashboardContainer}>
			<div>
				<h1 className={styles.pageTitle}>Ringkasan Dashboard</h1>
				<p className={styles.pageSubtitle}>Statistik utama dan aksi administratif cepat untuk SMAN 2 Brebes.</p>
			</div>

			<div className={styles.statsGrid}>
				<div className={styles.statCard}>
					<div className={styles.statHeader}>
						<div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
							<Users size={20} />
						</div>
						<span className={styles.statLabel}>Total Siswa</span>
					</div>
					{/* Angka statis sementara, nanti di-fetch dari database Prisma */}
					<div className={styles.statValue}>1.248</div>
				</div>

				<div className={styles.statCard}>
					<div className={styles.statHeader}>
						<div className={`${styles.iconWrapper} ${styles.iconYellow}`}>
							<GraduationCap size={20} />
						</div>
						<span className={styles.statLabel}>Total Guru</span>
					</div>
					<div className={styles.statValue}>86</div>
				</div>

				<div className={styles.statCard}>
					<div className={styles.statHeader}>
						<div className={`${styles.iconWrapper} ${styles.iconIndigo}`}>
							<CalendarCheck size={20} />
						</div>
						<span className={styles.statLabel}>Sesi Aktif Hari Ini</span>
					</div>
					<div className={styles.statValue}>42</div>
				</div>
			</div>

			<div className={styles.bottomGrid}>
				<div>
					<h3 className={styles.sectionTitle}>Akses Cepat</h3>
					<div className={styles.quickAccessGrid}>
						<div className={styles.accessCard}>
							<div className={styles.accessHeader}>
								<div className={styles.accessIcon}>
									<Settings size={18} />
								</div>
								<ArrowRight size={18} className={styles.arrowIcon} />
							</div>
							<h4 className={styles.accessTitle}>Manajemen Role</h4>
							<p className={styles.accessDesc}>
								Atur hak akses, berikan izin administratif, dan kelola peran pengguna di seluruh sistem.
							</p>
						</div>

						<div className={styles.accessCard}>
							<div className={styles.accessHeader}>
								<div className={styles.accessIcon}>
									<BookCopy size={18} />
								</div>
								<ArrowRight size={18} className={styles.arrowIcon} />
							</div>
							<h4 className={styles.accessTitle}>Manajemen Mapel</h4>
							<p className={styles.accessDesc}>
								Atur kurikulum, alokasikan guru ke mata pelajaran, dan kelola penjadwalan akademik.
							</p>
						</div>
					</div>
				</div>

				<div>
					<h3 className={styles.sectionTitle}>Aktivitas Terkini</h3>
					<div className={styles.activityCard}>
						<div className={styles.timeline}>
							<div className={styles.timelineItem}>
								<div className={styles.timelineDot}></div>
								<div className={styles.activityTitle}>Peran Diperbarui</div>
								<div className={styles.activityDesc}>Budi Santoso ditugaskan sebagai Wali Kelas X-MIPA 1.</div>
								<div className={styles.activityTime}>10 menit yang lalu</div>
							</div>

							<div className={styles.timelineItem}>
								<div className={`${styles.timelineDot} ${styles.timelineDotInactive}`}></div>
								<div className={styles.activityTitle}>Mata Pelajaran Ditambahkan</div>
								<div className={styles.activityDesc}>Modul kurikulum baru 'Fisika Lanjutan' ditambahkan ke sistem.</div>
								<div className={styles.activityTime}>2 jam yang lalu</div>
							</div>

							<div className={styles.timelineItem}>
								<div className={`${styles.timelineDot} ${styles.timelineDotInactive}`}></div>
								<div className={styles.activityTitle}>Pencadangan Sistem</div>
								<div className={styles.activityDesc}>Pencadangan database otomatis berhasil diselesaikan.</div>
								<div className={styles.activityTime}>Kemarin, 23:00</div>
							</div>
						</div>

						<button className={styles.btnFullLog}>Lihat Semua Log</button>
					</div>
				</div>
			</div>
		</div>
	);
}
