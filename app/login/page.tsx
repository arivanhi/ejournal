"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, User } from "lucide-react";
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
			router.push("/");
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
					E-Journal & Presensi
					<br />
					SMAN 2 Brebes
				</h1>
				<p className={styles.brandSubtitle}>Sistem Akademik Digital</p>

				<div className={styles.badgeContainer}>
					<span className={styles.badge}>🎓 Bimbingan Siswa</span>
					<span className={styles.badge}>📅 Jadwal Mengajar</span>
					<span className={styles.badge}>📄 Dokumen Sekolah</span>
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
