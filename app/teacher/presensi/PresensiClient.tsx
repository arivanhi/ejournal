"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
	X,
	Beaker,
	Clock,
	MapPin,
	UsersRound,
	Info,
	CalendarDays,
	ArrowLeft,
	CheckCircle2,
	AlertTriangle,
} from "lucide-react";
import styles from "./presensi.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";

// Perhatikan kita memanggil aktifkanPresensiQR untuk merefresh token secara real!
import { tutupPresensiQR, aktifkanPresensiQR } from "../jurnal/actions";

type ModalConfig = {
	isOpen: boolean;
	title: string;
	message: string;
	withInput?: boolean;
	onConfirm: (val?: string) => void;
} | null;

type ToastConfig = { id: number; message: string; type: "success" | "error" };

export default function PresensiClient({
	activeSessions,
	user,
	isWaliKelas,
}: {
	activeSessions: any[];
	user: any;
	isWaliKelas: boolean;
}) {
	const router = useRouter();

	const [modalInputValue, setModalInputValue] = useState("");
	const [selectedSession, setSelectedSession] = useState<any>(null);
	const [modal, setModal] = useState<ModalConfig>(null);
	const [toasts, setToasts] = useState<ToastConfig[]>([]);
	const [loading, setLoading] = useState(false);

	// Fungsi Toast
	const showToast = (message: string, type: "success" | "error" = "success") => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 3500);
	};

	// Tentukan View Mode saat render
	let viewMode = "empty";
	if (activeSessions.length > 0 && !selectedSession) viewMode = "list";
	if (activeSessions.length > 0 && selectedSession) viewMode = "detail";

	// Auto-polling data siswa/scan setiap 10 detik
	useEffect(() => {
		const pollInterval = setInterval(() => {
			router.refresh();
		}, 10000);
		return () => clearInterval(pollInterval);
	}, [router]);

	// Timer UI & Logika Update QR Server-side (Setiap 60 detik)
	const [timeLeft, setTimeLeft] = useState(60);
	useEffect(() => {
		if (viewMode !== "detail" || !selectedSession) return;

		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					// Waktunya merombak token QR di Database secara senyap!
					aktifkanPresensiQR(selectedSession.id).then(() => {
						router.refresh();
					});
					return 60; // Kembalikan ke 60 detik
				}
				return prev - 1;
			});
		}, 1000);
		return () => clearInterval(timer);
	}, [viewMode, selectedSession, router]);

	// Update state internal jika ada perubahan dari server
	useEffect(() => {
		if (selectedSession) {
			const updated = activeSessions.find((s) => s.id === selectedSession.id);
			if (updated) setSelectedSession(updated);
			else setSelectedSession(null);
		}
	}, [activeSessions]);

	// --- FUNGSI AKSI ---
	const formatWaktu = (mulai: string, selesai: string) => {
		if (mulai.includes("-")) return `${mulai} WIB`;
		return `${mulai} - ${selesai} WIB`;
	};

	const handleTutupPresensi = async (catatanKBM: string) => {
		if (!selectedSession) return;
		setLoading(true);
		// Panggil actions dengan parameter catatanKBM
		const res = await tutupPresensiQR(selectedSession.id, catatanKBM);
		setLoading(false);
		setModal(null);

		if (res.success) {
			showToast("Sesi presensi ditutup & Catatan disimpan.", "success");
			setSelectedSession(null);
			router.refresh();
		} else {
			showToast("Gagal menutup presensi: " + res.message, "error");
		}
	};

	const triggerModalTutup = () => {
		setModalInputValue("");
		setModal({
			isOpen: true,
			title: "Tutup Sesi Presensi?",
			message:
				"Siswa tidak akan bisa lagi menggunakan pemindaian QR. Tambahkan catatan kejadian atau evaluasi KBM hari ini (Opsional):",
			withInput: true,
			onConfirm: (val?: string) => handleTutupPresensi(val || ""),
		});
	};

	const todayFormatted = new Date().toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

	// --- KALKULASI STATISTIK ---
	let totalSiswa = 0;
	let presentCount = 0;
	let percentage = 0;
	let missingStudents: any[] = [];
	let recentScans: any[] = [];

	if (selectedSession) {
		const riwayatSiswaList = selectedSession.jadwal.kelas.riwayatSiswa || [];
		totalSiswa = riwayatSiswaList.length;

		const presensiHadir = selectedSession.presensi.filter((p: any) => p.status === "H");
		presentCount = presensiHadir.length;
		percentage = totalSiswa > 0 ? Math.round((presentCount / totalSiswa) * 100) : 0;

		const hadirIds = presensiHadir.map((p: any) => p.siswaId);
		missingStudents = riwayatSiswaList.filter((rs: any) => !hadirIds.includes(rs.siswa.id)).map((rs: any) => rs.siswa);
		recentScans = selectedSession.presensi.slice(0, 5);
	}

	return (
		<div className={styles.layoutWrapper}>
			{/* === TOAST NOTIFICATION CONTAINER === */}
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

			{/* === MODAL KONFIRMASI === */}
			{modal && modal.isOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContent}>
						<div className={styles.modalTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
							<AlertTriangle size={24} color="#f59e0b" /> {modal.title}
						</div>
						<div className={styles.modalMessage}>{modal.message}</div>

						{/* FORM CATATAN */}
						{modal.withInput && (
							<div style={{ marginBottom: "1.5rem" }}>
								<textarea
									style={{
										minHeight: "80px",
										width: "100%",
										padding: "0.75rem",
										borderRadius: "0.5rem",
										border: "1px solid #cbd5e1",
										outline: "none",
									}}
									placeholder="Ketik catatan di sini (opsional)..."
									value={modalInputValue}
									onChange={(e) => setModalInputValue(e.target.value)}
								/>
							</div>
						)}

						<div className={styles.modalActions}>
							<button
								className={styles.btnOutlineFull}
								style={{ backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" }}
								onClick={() => setModal(null)}
								disabled={loading}
							>
								Batal
							</button>
							<button
								className={styles.btnDanger}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => modal.onConfirm(modalInputValue)}
								disabled={loading}
							>
								{loading ? "Memproses..." : "Ya, Tutup Presensi"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* === SIDEBAR KIRI === */}
			<aside className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<div className={styles.logoWrapper}>
						<img src="/logo.jpg" alt="Logo" className={styles.logoImage} />
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
					<Link href="/teacher/dashboard" className={styles.menuItem}>
						<LayoutDashboard size={18} /> Dashboard
					</Link>
					<Link href="/teacher/jurnal" className={styles.menuItem}>
						<BookOpen size={18} /> Jurnal Mengajar
					</Link>
					<Link href="/teacher/presensi" className={`${styles.menuItem} ${styles.menuItemActive}`}>
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

			{/* === MAIN CONTENT === */}
			<main className={styles.mainContent}>
				<header className={styles.topbar}>
					<h1 className={styles.greeting}>E-Journal & Presensi</h1>
					<div className={styles.topbarActions}>
						<Bell size={20} style={{ cursor: "pointer" }} />
						<HelpCircle size={20} style={{ cursor: "pointer" }} />
						<div className={styles.profileAvatar}></div>
					</div>
				</header>

				<div className={styles.dashboardContainer}>
					{/* === STATE 1: EMPTY STATE === */}
					{viewMode === "empty" && (
						<div className={styles.emptyStateWrapper}>
							<div className={styles.emptyStateCard}>
								<div className={styles.emptyIconCircle}>
									<QrCode size={48} />
								</div>
								<h2 className={styles.emptyTitle}>Belum Ada Sesi Presensi Aktif</h2>
								<p className={styles.emptyDesc}>
									Silakan buka sesi presensi QR melalui menu Jurnal Mengajar untuk mulai mendata kehadiran siswa hari
									ini.
								</p>
								<Link href="/teacher/jurnal" className={styles.btnPrimary}>
									<BookOpen size={16} /> Buka Menu Jurnal
								</Link>
							</div>
						</div>
					)}

					{/* === STATE 2: LIST CARDS === */}
					{viewMode === "list" && (
						<div>
							<h1 className={styles.pageTitle}>Daftar Presensi QR Aktif</h1>
							<p className={styles.pageSubtitle}>
								Pilih kelas yang sedang berlangsung untuk menampilkan kode QR presensi bagi siswa.
							</p>

							<div className={styles.cardGrid}>
								{activeSessions.map((session) => (
									<div key={session.id} className={styles.qrCard}>
										<div className={styles.qrCardHeader}>
											<div className={styles.badgeActive}>
												<div className={styles.pulseDot}></div> Sesi Aktif
											</div>
											<div className={styles.iconTop}>
												<Beaker size={18} />
											</div>
										</div>
										<h3 className={styles.qrCardTitle}>
											{session.jadwal.mapel.nama} {session.jadwal.kelas.nama}
										</h3>
										<div className={styles.qrCardInfo}>
											<div className={styles.qrCardInfoItem}>
												<MapPin size={14} /> {session.jadwal.ruang || "Ruang Kelas"}
											</div>
											<div className={styles.qrCardInfoItem}>
												<Clock size={14} /> {formatWaktu(session.jadwal.waktuMulai, session.jadwal.waktuSelesai)}
											</div>
											<div className={styles.qrCardInfoItem}>
												<UsersRound size={14} /> {session.jadwal.kelas.riwayatSiswa?.length || 0} Siswa Terdaftar
											</div>
										</div>
										<button
											className={`${styles.btnPrimary} ${styles.btnFull}`}
											onClick={() => setSelectedSession(session)}
										>
											<QrCode size={16} /> Tampilkan QR
										</button>
									</div>
								))}
							</div>
						</div>
					)}

					{/* === STATE 3: LIVE DETAIL DASHBOARD === */}
					{viewMode === "detail" && selectedSession && (
						<div>
							{/* TOMBOL KEMBALI */}
							<button className={styles.btnBack} onClick={() => setSelectedSession(null)}>
								<ArrowLeft size={16} /> Kembali ke Daftar QR Aktif
							</button>

							<div className={styles.headerDetail}>
								<div>
									<div className={styles.detailTitleGroup}>
										<h1 className={styles.detailTitle}>
											{selectedSession.jadwal.mapel.nama} {selectedSession.jadwal.kelas.nama}
										</h1>
										<div className={styles.badgeProgress}>
											<span style={{ color: "#10b981" }}>((•))</span> Sesi Sedang Berlangsung
										</div>
									</div>
									<div className={styles.detailMeta}>
										<span>
											<Clock size={14} />{" "}
											{formatWaktu(selectedSession.jadwal.waktuMulai, selectedSession.jadwal.waktuSelesai)}
										</span>
										<span>
											<MapPin size={14} /> {selectedSession.jadwal.ruang || "Ruang Kelas"}
										</span>
										<span>
											<CalendarDays size={14} /> {todayFormatted}
										</span>
									</div>
								</div>
								<button className={styles.btnDanger} onClick={triggerModalTutup}>
									<X size={16} /> Tutup Presensi
								</button>
							</div>

							<div className={styles.liveLayout}>
								{/* KIRI: QR DISPLAY */}
								<div className={styles.qrDisplayBox}>
									<h2 className={styles.qrInstructionTitle}>Scan untuk Presensi</h2>
									<p className={styles.qrInstructionSub}>Siswa harus memindai kode ini menggunakan aplikasi SISKA.</p>

									<div className={styles.qrImageContainer}>
										<img
											src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(selectedSession.qrToken)}&margin=10`}
											alt="QR Presensi"
											className={styles.qrImage}
										/>
									</div>

									<div className={styles.progressContainer}>
										<div className={styles.progressHeader}>
											<span>
												<RefreshCcw
													size={14}
													style={{ display: "inline", marginRight: "0.35rem", verticalAlign: "text-bottom" }}
												/>{" "}
												Diperbarui Otomatis Dalam
											</span>
											<span style={{ fontWeight: 800, fontSize: "1rem" }}>
												00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
											</span>
										</div>
										<div className={styles.progressTrack}>
											<div className={styles.progressBar} style={{ width: `${(timeLeft / 60) * 100}%` }}></div>
										</div>
									</div>

									<div className={styles.manualCodeBox}>
										<div className={styles.manualCodeLabel}>Kode Entri Manual</div>
										<div className={styles.manualCodeValue}>
											{/* Kita mengambil indeks ke-2 karena susunan tokennya: QR_ID_KODEMANUAL_WAKTU */}
											{selectedSession.qrToken.split("_")[2] || "KODE-EROR"}
										</div>
									</div>
								</div>

								{/* KANAN: STATS & RECENT SCANS */}
								<div className={styles.sideColumn}>
									{/* Stat Card */}
									<div className={styles.sideCard}>
										<h3 className={styles.sideCardTitle}>Statistik Real-time</h3>
										<div className={styles.statRow}>
											<div className={styles.circleStat}>{percentage}%</div>
											<div className={styles.statNumbers}>
												<div className={styles.statFraction}>
													{presentCount} <small>/ {totalSiswa}</small>
												</div>
												<div className={styles.statLabel}>Siswa Hadir</div>
											</div>
										</div>

										{missingStudents.length > 0 && (
											<div className={styles.alertBox}>
												<div className={styles.alertHeader}>
													<Info size={14} /> Belum Hadir ({missingStudents.length})
												</div>
												<ul className={styles.alertList}>
													{missingStudents.slice(0, 3).map((s: any) => (
														<li key={s.id}>{s.user?.nama || "Nama Siswa"}</li>
													))}
													{missingStudents.length > 3 && <li>...</li>}
												</ul>
											</div>
										)}
									</div>

									{/* Recent Scans */}
									<div className={styles.sideCard}>
										<h3 className={styles.sideCardTitle}>
											Pindai Terbaru <span className={styles.badgeLive}>Langsung</span>
										</h3>
										<div className={styles.scanList}>
											{recentScans.length === 0 ? (
												<div style={{ color: "#94a3b8", fontSize: "0.875rem", textAlign: "center", padding: "1rem 0" }}>
													Belum ada presensi.
												</div>
											) : (
												recentScans.map((scan: any) => {
													const s = selectedSession.jadwal.kelas.riwayatSiswa.find(
														(rs: any) => rs.siswaId === scan.siswaId,
													)?.siswa;
													const name = s?.user?.nama || "Siswa";
													const initials = name.substring(0, 2).toUpperCase();
													const scanTimeStr = new Date(scan.waktuScan).toLocaleTimeString("id-ID", {
														hour: "2-digit",
														minute: "2-digit",
														second: "2-digit",
													});

													const diffSeconds = Math.floor(
														(new Date().getTime() - new Date(scan.waktuScan).getTime()) / 1000,
													);
													let timeSub = "Baru saja";
													if (diffSeconds > 60) timeSub = `${Math.floor(diffSeconds / 60)} mnt lalu`;

													return (
														<div key={scan.id} className={styles.scanItem}>
															<div className={styles.scanAvatar}>{initials}</div>
															<div className={styles.scanInfo}>
																<div className={styles.scanName}>{name}</div>
																<div className={styles.scanNis}>NIS: {s?.nis || "-"}</div>
															</div>
															<div style={{ textAlign: "right" }}>
																<div className={styles.scanTime}>{scanTimeStr}</div>
																<span className={styles.scanTimeSub}>{timeSub}</span>
															</div>
														</div>
													);
												})
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}

// Custom Icon
function RefreshCcw(props: any) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width={props.size}
			height={props.size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
			<path d="M3 3v5h5" />
		</svg>
	);
}
