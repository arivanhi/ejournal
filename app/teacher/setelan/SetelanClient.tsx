"use client";

import { useState } from "react";
import {
	LayoutDashboard,
	BookOpen,
	QrCode,
	History,
	Users,
	Settings,
	LogOut,
	CheckCircle2,
	AlertTriangle,
	UserCog,
	ShieldCheck,
	Save,
	Bell,
	HelpCircle,
} from "lucide-react";
import styles from "./setelan.module.css";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { updateProfilAction, updatePasswordAction } from "./actions";
import { useRouter } from "next/navigation";

export default function SetelanClient({ user, guru, isWaliKelas }: { user: any; guru: any; isWaliKelas: boolean }) {
	const router = useRouter();
	const { update } = useSession(); // <--- Tambahkan baris ini
	const [toasts, setToasts] = useState<any[]>([]);

	// States untuk Form Profil
	const [nama, setNama] = useState(user.nama || "");
	const [npp, setNpp] = useState(guru.npp || "");
	const [loadingProfil, setLoadingProfil] = useState(false);

	// States untuk Form Password
	const [passwordLama, setPasswordLama] = useState("");
	const [passwordBaru, setPasswordBaru] = useState("");
	const [konfirmasiPassword, setKonfirmasiPassword] = useState("");
	const [loadingPassword, setLoadingPassword] = useState(false);

	const showToast = (message: string, type: "success" | "error" = "success") => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
	};

	// Handler Submit Profil
	// Handler Submit Profil
	const handleSimpanProfil = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoadingProfil(true);
		const res = await updateProfilAction(user.id, guru.id, { nama, npp });
		setLoadingProfil(false);

		if (res.success) {
			// SINKRONISASI SESI TANPA LOGOUT
			// Ini akan memperbarui data 'name' di dalam cookie browser secara real-time
			await update({ name: nama });

			showToast("Profil berhasil diperbarui!", "success");
			router.refresh();
		} else {
			showToast(res.message, "error");
		}
	};

	// Handler Submit Password
	const handleSimpanPassword = async (e: React.FormEvent) => {
		e.preventDefault();

		if (passwordBaru !== konfirmasiPassword) {
			showToast("Password Baru dan Konfirmasi Password tidak cocok!", "error");
			return;
		}
		if (passwordBaru.length < 6) {
			showToast("Password baru minimal 6 karakter.", "error");
			return;
		}

		setLoadingPassword(true);
		const res = await updatePasswordAction(user.id, passwordLama, passwordBaru);
		setLoadingPassword(false);

		if (res.success) {
			showToast(res.message, "success");
			setPasswordLama("");
			setPasswordBaru("");
			setKonfirmasiPassword("");
		} else {
			showToast(res.message, "error");
		}
	};

	return (
		<div className={styles.layoutWrapper}>
			{/* TOAST NOTIFICATION */}
			<div className={styles.toastContainer}>
				{toasts.map((toast) => (
					<div key={toast.id} className={`${styles.toast} ${toast.type === "error" ? styles.toastError : ""}`}>
						{toast.type === "success" ? (
							<CheckCircle2 size={20} color="#10b981" />
						) : (
							<AlertTriangle size={20} color="#ef4444" />
						)}
						<span className={styles.toastText}>{toast.message}</span>
					</div>
				))}
			</div>

			{/* === SIDEBAR === */}
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
							<Link href="/teacher/setelan" className={`${styles.menuItem} ${styles.menuItemActive}`}>
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
					<h1 className={styles.pageTitle}>Setelan Akun</h1>
					<p className={styles.pageSubtitle}>Kelola informasi profil dan keamanan akun Anda di sini.</p>

					<div className={styles.settingsGrid}>
						{/* KOTAK 1: PROFIL DASAR */}
						<div className={styles.settingsCard}>
							<div className={styles.cardHeader}>
								<div className={styles.cardTitle}>
									<UserCog size={20} color="#3b82f6" /> Informasi Profil
								</div>
								<div className={styles.cardSubtitle}>
									Perbarui nama lengkap dan NIP/NPP Anda jika terdapat kesalahan.
								</div>
							</div>
							<form onSubmit={handleSimpanProfil}>
								<div className={styles.cardBody}>
									<div className={styles.formGroup}>
										<label className={styles.formLabel}>Nomor Pokok Pegawai (NIP/NPP)</label>
										<input
											type="text"
											required
											className={styles.formInput}
											value={npp}
											onChange={(e) => setNpp(e.target.value)}
										/>
										<small style={{ color: "#64748b", fontSize: "0.75rem" }}>
											*Perhatian: Mengubah NPP akan mengubah Username yang Anda gunakan untuk login.
										</small>
									</div>
									<div className={styles.formGroup}>
										<label className={styles.formLabel}>Nama Lengkap (Sesuai Gelar)</label>
										<input
											type="text"
											required
											className={styles.formInput}
											value={nama}
											onChange={(e) => setNama(e.target.value)}
										/>
									</div>
									<div className={styles.formGroup}>
										<label className={styles.formLabel}>Hak Akses (Role)</label>
										<input type="text" disabled className={styles.formInput} value={user.role.replace("_", " ")} />
									</div>
								</div>
								<div className={styles.cardFooter}>
									<button type="submit" className={styles.btnPrimary} disabled={loadingProfil}>
										<Save size={16} /> {loadingProfil ? "Menyimpan..." : "Simpan Profil"}
									</button>
								</div>
							</form>
						</div>

						{/* KOTAK 2: GANTI PASSWORD */}
						<div className={styles.settingsCard}>
							<div className={styles.cardHeader}>
								<div className={styles.cardTitle}>
									<ShieldCheck size={20} color="#10b981" /> Keamanan Akun
								</div>
								<div className={styles.cardSubtitle}>
									Pastikan akun Anda aman dengan memperbarui password secara berkala.
								</div>
							</div>
							<form onSubmit={handleSimpanPassword}>
								<div className={styles.cardBody}>
									<div className={styles.formGroup}>
										<label className={styles.formLabel}>Password Lama</label>
										<input
											type="password"
											required
											className={styles.formInput}
											placeholder="Masukkan password saat ini..."
											value={passwordLama}
											onChange={(e) => setPasswordLama(e.target.value)}
										/>
									</div>
									<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "0.5rem" }}>
										<div className={styles.formGroup}>
											<label className={styles.formLabel}>Password Baru</label>
											<input
												type="password"
												required
												className={styles.formInput}
												placeholder="Minimal 6 karakter"
												value={passwordBaru}
												onChange={(e) => setPasswordBaru(e.target.value)}
											/>
										</div>
										<div className={styles.formGroup}>
											<label className={styles.formLabel}>Konfirmasi Password Baru</label>
											<input
												type="password"
												required
												className={styles.formInput}
												placeholder="Ketik ulang password baru..."
												value={konfirmasiPassword}
												onChange={(e) => setKonfirmasiPassword(e.target.value)}
											/>
										</div>
									</div>
								</div>
								<div className={styles.cardFooter}>
									<button type="submit" className={styles.btnPrimary} disabled={loadingPassword}>
										<ShieldCheck size={16} /> {loadingPassword ? "Memproses..." : "Ganti Password"}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
