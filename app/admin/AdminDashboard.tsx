"use client";

// 1. Tambahkan import Database dan Calendar untuk ikon baru
import { Users, GraduationCap, CalendarCheck, Settings, BookCopy, ArrowRight, Database, Calendar } from "lucide-react";
// 2. Import Link dari Next.js untuk hyperlink
import Link from "next/link";
import styles from "./adminDashboard.module.css";

interface AdminDashboardProps {
	stats: {
		siswa: number;
		guru: number;
		sesi: number;
		aktivitas: Array<{
			id: string;
			title: string;
			desc: string;
			time: string;
		}>;
	};
}

export default function AdminDashboard({ stats }: AdminDashboardProps) {
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
					<div className={styles.statValue}>{stats.siswa.toLocaleString("id-ID")}</div>
				</div>

				<div className={styles.statCard}>
					<div className={styles.statHeader}>
						<div className={`${styles.iconWrapper} ${styles.iconYellow}`}>
							<GraduationCap size={20} />
						</div>
						<span className={styles.statLabel}>Total Guru</span>
					</div>
					<div className={styles.statValue}>{stats.guru.toLocaleString("id-ID")}</div>
				</div>

				<div className={styles.statCard}>
					<div className={styles.statHeader}>
						<div className={`${styles.iconWrapper} ${styles.iconIndigo}`}>
							<CalendarCheck size={20} />
						</div>
						<span className={styles.statLabel}>Sesi Aktif Hari Ini</span>
					</div>
					<div className={styles.statValue}>{stats.sesi.toLocaleString("id-ID")}</div>
				</div>
			</div>

			<div className={styles.bottomGrid}>
				<div>
					<h3 className={styles.sectionTitle}>Akses Cepat</h3>
					<div className={styles.quickAccessGrid}>
						{/* 1. Akses Cepat: Manajemen Role */}
						<Link href="/admin/role" style={{ textDecoration: "none" }}>
							<div className={styles.accessCard}>
								<div className={styles.accessHeader}>
									<div className={styles.accessIcon}>
										<Settings size={18} />
									</div>
									<ArrowRight size={18} className={styles.arrowIcon} />
								</div>
								<h4 className={styles.accessTitle}>Manajemen Role</h4>
								<p className={styles.accessDesc}>
									Atur hak akses, berikan izin administratif, dan kelola peran pengguna.
								</p>
							</div>
						</Link>

						{/* 2. Akses Cepat: Manajemen Mapel */}
						<Link href="/admin/mapel" style={{ textDecoration: "none" }}>
							<div className={styles.accessCard}>
								<div className={styles.accessHeader}>
									<div className={styles.accessIcon}>
										<BookCopy size={18} />
									</div>
									<ArrowRight size={18} className={styles.arrowIcon} />
								</div>
								<h4 className={styles.accessTitle}>Manajemen Mapel</h4>
								<p className={styles.accessDesc}>Atur kurikulum, alokasikan guru ke mata pelajaran, dan kelas.</p>
							</div>
						</Link>

						{/* 3. Akses Cepat: Jadwal Pelajaran (Baru) */}
						<Link href="/admin/jadwal" style={{ textDecoration: "none" }}>
							<div className={styles.accessCard}>
								<div className={styles.accessHeader}>
									<div className={styles.accessIcon}>
										<Calendar size={18} />
									</div>
									<ArrowRight size={18} className={styles.arrowIcon} />
								</div>
								<h4 className={styles.accessTitle}>Jadwal Pelajaran</h4>
								<p className={styles.accessDesc}>
									Kelola jadwal mengajar, jam pelajaran, dan penempatan kelas yang sistematis.
								</p>
							</div>
						</Link>

						{/* 4. Akses Cepat: Data Master (Baru) */}
						<Link href="/admin/master" style={{ textDecoration: "none" }}>
							<div className={styles.accessCard}>
								<div className={styles.accessHeader}>
									<div className={styles.accessIcon}>
										<Database size={18} />
									</div>
									<ArrowRight size={18} className={styles.arrowIcon} />
								</div>
								<h4 className={styles.accessTitle}>Data Master</h4>
								<p className={styles.accessDesc}>
									Kelola data inti sekolah seperti profil siswa, data guru, dan rombongan belajar.
								</p>
							</div>
						</Link>
					</div>
				</div>

				<div>
					<h3 className={styles.sectionTitle}>Aktivitas Terkini</h3>
					<div className={styles.activityCard}>
						<div className={styles.timeline}>
							{stats.aktivitas.length > 0 ? (
								stats.aktivitas.map((act, index) => (
									<div key={act.id} className={styles.timelineItem}>
										<div className={`${styles.timelineDot} ${index !== 0 ? styles.timelineDotInactive : ""}`}></div>
										<div className={styles.activityTitle}>{act.title}</div>
										<div className={styles.activityDesc}>{act.desc}</div>
										<div className={styles.activityTime}>{act.time}</div>
									</div>
								))
							) : (
								<p style={{ fontSize: "0.8rem", color: "#6b7280" }}>Belum ada aktivitas terekam.</p>
							)}
						</div>

						<button className={styles.btnFullLog}>Lihat Semua Log</button>
					</div>
				</div>
			</div>
		</div>
	);
}
