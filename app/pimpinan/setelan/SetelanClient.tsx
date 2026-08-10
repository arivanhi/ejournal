"use client";

import { useState } from "react";
import {
	LayoutDashboard,
	Users,
	Clock,
	BookOpen,
	FileBarChart,
	Settings,
	LogOut,
	CheckCircle2,
	AlertTriangle,
	UserCog,
	ShieldCheck,
	Bell,
	HelpCircle,
	Check,
	Save,
} from "lucide-react";
import styles from "./setelan.module.css";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { updateProfilAction, updatePasswordAction } from "./actions";
import { useRouter } from "next/navigation";

export default function SetelanClient({ user }: { user: any }) {
	const router = useRouter();
	const { update } = useSession();
	const [toasts, setToasts] = useState<any[]>([]);

	// States untuk Form Profil
	const [nama, setNama] = useState(user.nama || "");
	const [npp, setNpp] = useState(user.username || ""); // Mengambil username sebagai NPP default
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
	const handleSimpanProfil = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoadingProfil(true);
		// Memanggil fungsi dari actions tanpa guruId
		const res = await updateProfilAction(user.id, { nama, npp });
		setLoadingProfil(false);

		if (res.success) {
			// Sinkronisasi Sesi Browser
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
		<>
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

			{/* SIDEBAR PIMPINAN */}
			

			
			<>
				

				<div className={styles.dashboardContainer}>
					<h1 className={styles.pageTitle}>Setelan Akun</h1>
					<p className={styles.pageSubtitle}>Kelola informasi profil dan keamanan akun Anda di sini.</p>

					<div className={styles.settingsGrid}>
						{/* KOTAK 1: PROFIL DASAR (Active Edit) */}
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
										<label className={styles.formLabel}>Nomor Induk / Username</label>
										<input
											type="text"
											className={styles.formInput}
											value={npp}
											onChange={(e) => setNpp(e.target.value)}
											required
										/>
										<small style={{ color: "#64748b", fontSize: "0.75rem" }}>
											*Perhatian: Mengubah data ini akan mengubah Username yang Anda gunakan untuk login.
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
										<input
											type="text"
											disabled
											className={styles.formInput}
											value={user.role === "KEPSEK" ? "Kepala Sekolah" : "Wakil Kepala Sekolah"}
										/>
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
			</>
		</>
	);
}
