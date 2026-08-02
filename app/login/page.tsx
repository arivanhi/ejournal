"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User, BookOpen, Calendar, FileText } from "lucide-react";
import styles from "./login.module.css";

export default function LoginPage() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		const res = await signIn("credentials", {
			username,
			password,
			redirect: false,
		});

		if (res?.error) {
			setError("Username atau Password salah.");
			setLoading(false);
		} else {
			// Setelah signIn berhasil, ambil session untuk mengecek Role-nya
			const session = await getSession();

			if (session?.user?.role === "ADMIN_TU") {
				router.push("/admin");
			} else if (session?.user?.role === "KEPSEK" || session?.user?.role === "WAKA") {
				// Arahkan Pimpinan ke dashboard khusus Pimpinan
				router.push("/pimpinan/dashboard");
			} else if (session?.user?.role === "GURU" || session?.user?.role === "WALI_KELAS") {
				router.push("/teacher/dashboard");
			} else if (session?.user?.role === "SISWA") {
				router.push("/siswa/dashboard");
			} else {
				// Fallback jika role tidak dikenali
				router.push("/");
			}
			router.refresh();
		}
	};

	return (
		<div className={styles.pageContainer}>
			{/* Panel Kiri */}
			<div className={styles.leftPanel}>
				<div className={styles.logoContainer}>
					<img src="/logo.jpg" alt="Logo" style={{ height: "5rem", width: "5rem", objectFit: "contain" }} />
				</div>
				<h1 className={styles.brandTitle}>
					SMART E-Journal
					<br />
					SMAN 2 Brebes
				</h1>
				<p className={styles.brandSubtitle}>Sistem Monitoring Akademik Terintegarsi</p>

				<div className={styles.badgeContainer}>
					<span className={styles.badge}>
						<BookOpen size={16} /> Bimbingan Siswa
					</span>
					<span className={styles.badge}>
						<Calendar size={16} /> Jadwal Mengajar
					</span>
					<span className={styles.badge}>
						<FileText size={16} /> Dokumen Sekolah
					</span>
				</div>
			</div>

			{/* Panel Kanan */}
			<div className={styles.rightPanel}>
				<div className={styles.formContainer}>
					<p className={styles.preTitle}>Masuk ke Akun Anda</p>
					<h2 className={styles.welcomeTitle}>Selamat Datang 👋</h2>
					<p className={styles.welcomeSubtitle}>Gunakan NPP, NIP, atau NISN untuk mengakses dashboard Anda.</p>

					<form onSubmit={handleLogin}>
						{error && <div className={styles.errorAlert}>{error}</div>}

						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>NPP / NIP / NISN</label>
							<div className={styles.inputWrapper}>
								<input
									type="text"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									className={styles.inputField}
									placeholder="Masukkan kredensial Anda"
									required
								/>
								<div className={styles.iconRight}>
									<User size={20} />
								</div>
							</div>
						</div>

						<div className={styles.inputGroup}>
							<label className={styles.inputLabel}>PASSWORD</label>
							<div className={styles.inputWrapper}>
								<input
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									className={styles.inputField}
									placeholder="••••••••"
									required
								/>
								<button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.iconRight}>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>

						<button type="submit" disabled={loading} className={styles.submitBtn}>
							{loading ? "Memproses..." : "Masuk \u2192"}
						</button>
					</form>

					<div className={styles.footer}>
						<p className={styles.footerTitle}>SMAN 2 Brebes</p>
						<p className={styles.footerText}>
							Hubungi admin jika mengalami kendala masuk.
							<br />
							<a href="mailto:support@sman2brebes.sch.id" className={styles.footerLink}>
								support@sman2brebes.sch.id
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
