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
	ArrowLeft,
	Beaker,
	CheckCircle2,
	Clock,
	MapPin,
	Download,
	Save,
	Send,
	X,
} from "lucide-react"; // <-- Tambahkan 'X' di akhir
import styles from "./jurnal.module.css";
import Link from "next/link";
import { bukaAtauBuatJurnalAction, aktifkanPresensiQR, simpanJurnalAction } from "./actions";

export default function JurnalClient({ jadwalHariIni }: { jadwalHariIni: any[] }) {
	// State Machine: "list" | "form" | "presensi"
	const [viewMode, setViewMode] = useState<"list" | "form" | "presensi">("list");
	const [loading, setLoading] = useState(false);

	// Active Data
	const [activeJurnal, setActiveJurnal] = useState<any>(null);

	// Form State
	const [materi, setMateri] = useState("");
	const [tujuan, setTujuan] = useState("");
	const [catatan, setCatatan] = useState("");

	const todayFormatted = new Date().toLocaleDateString("id-ID", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});

	// --- LOGIKA BERPINDAH TAMPILAN ---
	const handleBukaJurnal = async (jadwalId: string) => {
		setLoading(true);
		const res = await bukaAtauBuatJurnalAction(jadwalId);
		setLoading(false);

		if (res.success && res.data) {
			setActiveJurnal(res.data);
			setMateri(res.data.materiBab || "");
			setCatatan(res.data.catatan || "");
			setViewMode("form");
		} else {
			alert("Gagal memuat jurnal");
		}
	};

	const handleBukaPresensiQR = async () => {
		setLoading(true);
		const res = await aktifkanPresensiQR(activeJurnal.id);
		setLoading(false);

		if (res.success) {
			// Update state lokal agar tombol "Lihat Detail" aktif
			setActiveJurnal({ ...activeJurnal, qrToken: res.token });
			alert("QR Presensi berhasil diaktifkan! Siswa kini dapat melakukan scan.");
		}
	};

	const handleSimpanJurnal = async (status: "DRAFT" | "SUBMITTED") => {
		setLoading(true);
		await simpanJurnalAction(activeJurnal.id, materi, tujuan, catatan, status);
		setLoading(false);
		alert(status === "SUBMITTED" ? "Jurnal berhasil dikirim!" : "Draft disimpan.");
		if (status === "SUBMITTED") setViewMode("list");
	};

	// === RENDER 1: DAFTAR KELAS HARI INI ===
	if (viewMode === "list") {
		return (
			<div className={styles.pageContainer} style={{ maxWidth: "none", padding: 0 }}>
				{/* Asumsikan Layout Sidebar dibungkus di luar (layout.tsx). Kita fokus konten utama */}
				<div style={{ padding: "2rem" }}>
					<div className={styles.pageHeader}>
						<div>
							<h1 className={styles.pageTitle}>Daftar Mata Pelajaran & Kelas</h1>
							<p className={styles.pageSubtitle}>
								Kelola jurnal mengajar dan catat aktivitas kelas Anda untuk hari ini.
							</p>
						</div>
						<div style={{ display: "flex", gap: "1rem" }}>
							<select style={{ padding: "0.5rem", borderRadius: "0.5rem" }}>
								<option>Semester Ganjil</option>
							</select>
							<select style={{ padding: "0.5rem", borderRadius: "0.5rem" }}>
								<option>Tahun Ajaran 2023/2024</option>
							</select>
						</div>
					</div>

					<div className={styles.cardGrid}>
						{jadwalHariIni.length === 0 && <div>Tidak ada jadwal hari ini.</div>}

						{jadwalHariIni.map((jadwal) => {
							const jurnal = jadwal.jurnal[0];
							const isSubmitted = jurnal?.status === "SUBMITTED";
							const isDraft = jurnal?.status === "DRAFT";

							// Logika CSS Status
							let cardClass = styles.statusBelum;
							let badgeClass = styles.badgeBelum;
							let statusText = "Belum Diisi";

							if (isSubmitted) {
								cardClass = styles.statusSelesai;
								badgeClass = styles.badgeSelesai;
								statusText = "Selesai";
							} else if (isDraft) {
								cardClass = styles.statusBerlangsung;
								badgeClass = styles.badgeBerlangsung;
								statusText = "Sedang Berlangsung";
							}

							return (
								<div key={jadwal.id} className={`${styles.jurnalCard} ${cardClass}`}>
									<div className={styles.cardHeader}>
										<div>
											<div className={styles.mapelTitle}>
												<Beaker size={20} color="#0a2540" /> {jadwal.mapel.nama}
											</div>
											<div className={styles.mapelSubtitle}>{jadwal.kelas.nama}</div>
										</div>
										<span className={`${styles.badgeStatus} ${badgeClass}`}>{statusText}</span>
									</div>

									<div className={styles.cardBody}>
										<div className={styles.infoRow}>
											<Clock size={14} /> {jadwal.waktuMulai} - {jadwal.waktuSelesai} WIB
										</div>
										<div className={styles.infoRow}>
											<MapPin size={14} /> {jadwal.ruang || "-"}
										</div>
									</div>

									{isSubmitted ? (
										<button className={styles.btnOutlineFull} onClick={() => handleBukaJurnal(jadwal.id)}>
											Lihat Jurnal
										</button>
									) : (
										<button
											className={styles.btnPrimaryFull}
											onClick={() => handleBukaJurnal(jadwal.id)}
											disabled={loading}
										>
											{isDraft ? "Lanjutkan Jurnal" : "Isi Jurnal"}
										</button>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>
		);
	}

	// Persiapan Data untuk View 2 & 3
	const totalSiswa = activeJurnal?.jadwal?.kelas?.riwayatSiswa?.length || 0;
	const hadir = activeJurnal?.presensi?.filter((p: any) => p.status === "H").length || 0;
	const izinSakit = activeJurnal?.presensi?.filter((p: any) => p.status === "I" || p.status === "S").length || 0;
	const alpha = activeJurnal?.presensi?.filter((p: any) => p.status === "A").length || 0;

	// === RENDER 2: FORM JURNAL ===
	if (viewMode === "form") {
		return (
			<div style={{ padding: "2rem" }}>
				<button
					onClick={() => setViewMode("list")}
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
						marginBottom: "1.5rem",
						fontWeight: 600,
					}}
				>
					<ArrowLeft size={18} /> Kembali ke Daftar
				</button>

				<div className={styles.splitLayout}>
					{/* KIRI: Form Pengisian */}
					<div className={styles.formSection}>
						<div className={styles.formTitle}>
							Jurnal Mengajar: {activeJurnal.jadwal.mapel.nama} {activeJurnal.jadwal.kelas.nama}
							<span className={`${styles.badgeStatus} ${styles.badgeBerlangsung}`}>Sedang Berlangsung</span>
						</div>
						<div className={styles.formMeta}>
							<span>
								<Clock size={14} /> {activeJurnal.jadwal.waktuMulai} - {activeJurnal.jadwal.waktuSelesai} WIB
							</span>
							<span>
								<MapPin size={14} /> {activeJurnal.jadwal.ruang}
							</span>
						</div>

						<div className={styles.formGroup}>
							<label className={styles.formLabel}>Materi Pembelajaran *</label>
							<input
								className={styles.formInput}
								value={materi}
								onChange={(e) => setMateri(e.target.value)}
								placeholder="Contoh: Sel Hewan dan Tumbuhan"
							/>
						</div>
						<div className={styles.formGroup}>
							<label className={styles.formLabel}>Tujuan Pembelajaran</label>
							<textarea
								className={styles.formTextarea}
								value={tujuan}
								onChange={(e) => setTujuan(e.target.value)}
								placeholder="Deskripsikan tujuan pembelajaran hari ini..."
							/>
						</div>
						<div className={styles.formGroup}>
							<label className={styles.formLabel}>Catatan KBM (Kejadian, Evaluasi, dll)</label>
							<textarea
								className={styles.formTextarea}
								value={catatan}
								onChange={(e) => setCatatan(e.target.value)}
								placeholder="Tulis catatan penting selama kegiatan belajar mengajar berlangsung..."
							/>
						</div>

						<div className={styles.formFooter}>
							<button
								className={styles.btnOutlineFull}
								style={{ width: "auto", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}
								onClick={() => handleSimpanJurnal("DRAFT")}
							>
								<Save size={16} /> Simpan Draft
							</button>
							<button
								className={styles.btnPrimaryFull}
								style={{ width: "auto", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}
								onClick={() => handleSimpanJurnal("SUBMITTED")}
							>
								<Send size={16} /> Selesaikan & Kirim Jurnal
							</button>
						</div>
					</div>

					{/* KANAN: Panel Presensi */}
					<div className={styles.sideSection}>
						<div className={styles.summaryCard}>
							<div className={styles.summaryHeader}>
								Ringkasan Presensi
								{/* SYARAT: Tombol Detail HANYA BISA DIKLIK JIKA QR SUDAH DIBUKA (qrToken tidak null) */}
								{activeJurnal.qrToken ? (
									<span className={styles.summaryLink} onClick={() => setViewMode("presensi")}>
										Lihat Detail &rarr;
									</span>
								) : (
									<span
										className={styles.summaryLink}
										style={{ color: "#9ca3af", cursor: "not-allowed" }}
										title="Buka Presensi QR terlebih dahulu"
									>
										Lihat Detail &rarr;
									</span>
								)}
							</div>

							<div className={styles.summaryStats}>
								<div className={styles.statTotal}>
									<div className={styles.statTotalNum}>{totalSiswa}</div>
									<div className={styles.statTotalLabel}>Total Siswa</div>
								</div>
								<div className={styles.statBreakdown}>
									<div className={`${styles.statRow} ${styles.statHadir}`}>
										<span>Hadir</span> <span>{hadir}</span>
									</div>
									<div className={`${styles.statRow} ${styles.statIzin}`}>
										<span>Izin/Sakit</span> <span>{izinSakit}</span>
									</div>
									<div className={`${styles.statRow} ${styles.statAlpha}`}>
										<span>Alpha</span> <span>{alpha}</span>
									</div>
								</div>
							</div>

							{activeJurnal.qrToken ? (
								<button
									className={styles.btnQR}
									style={{ background: "#d1fae5", borderColor: "#34d399", color: "#047857" }}
								>
									<CheckCircle2 size={18} /> QR Presensi Aktif
								</button>
							) : (
								<button className={styles.btnQR} onClick={handleBukaPresensiQR} disabled={loading}>
									<QrCode size={18} /> Buka Presensi QR
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	// === RENDER 3: DETAIL PRESENSI (TABLE) ===
	if (viewMode === "presensi") {
		const siswaList = activeJurnal.jadwal.kelas.riwayatSiswa.map((rs: any) => rs.siswa);

		return (
			<div style={{ padding: "2rem" }}>
				<button
					onClick={() => setViewMode("form")}
					style={{
						background: "none",
						border: "none",
						cursor: "pointer",
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
						marginBottom: "1.5rem",
						fontWeight: 600,
					}}
				>
					<ArrowLeft size={18} /> Kembali ke Jurnal
				</button>

				<h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
					Detail Presensi Siswa - {activeJurnal.jadwal.mapel.nama} {activeJurnal.jadwal.kelas.nama}
				</h2>
				<div
					style={{
						color: "#6b7280",
						fontSize: "0.875rem",
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
						marginBottom: "1.5rem",
					}}
				>
					<Clock size={16} /> {todayFormatted} | {activeJurnal.jadwal.waktuMulai} - {activeJurnal.jadwal.waktuSelesai}
				</div>

				{/* Panel Ringkasan di Atas Tabel */}
				<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
					<div
						className={styles.summaryCard}
						style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}
					>
						<Users size={24} color="#3b82f6" />
						<div>
							<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Total Siswa</div>
							<div style={{ fontWeight: 700, fontSize: "1.25rem" }}>{totalSiswa}</div>
						</div>
					</div>
					<div
						className={styles.summaryCard}
						style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}
					>
						<CheckCircle2 size={24} color="#10b981" />
						<div>
							<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Hadir</div>
							<div style={{ fontWeight: 700, fontSize: "1.25rem", color: "#10b981" }}>{hadir}</div>
						</div>
					</div>
					<div
						className={styles.summaryCard}
						style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}
					>
						<Clock size={24} color="#f59e0b" />
						<div>
							<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Izin/Sakit</div>
							<div style={{ fontWeight: 700, fontSize: "1.25rem", color: "#f59e0b" }}>{izinSakit}</div>
						</div>
					</div>
					<div
						className={styles.summaryCard}
						style={{ padding: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}
					>
						<X size={24} color="#ef4444" />
						<div>
							<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Alpha</div>
							<div style={{ fontWeight: 700, fontSize: "1.25rem", color: "#ef4444" }}>{alpha}</div>
						</div>
					</div>
				</div>

				<div className={styles.tableCard}>
					<div className={styles.tableToolbar}>
						<div style={{ fontWeight: 600 }}>Daftar Kehadiran</div>
						<button className={styles.btnOutlineFull} style={{ width: "auto", margin: 0, padding: "0.5rem 1rem" }}>
							<Download size={16} style={{ display: "inline", verticalAlign: "middle" }} /> Export PDF
						</button>
					</div>
					<table className={styles.tableStyle}>
						<thead>
							<tr>
								<th>No</th>
								<th>NIS</th>
								<th>Nama Siswa</th>
								<th>L/P</th>
								<th>Waktu Scan</th>
								<th>Status Presensi</th>
							</tr>
						</thead>
						<tbody>
							{siswaList.map((siswa: any, index: number) => {
								// Cari data presensi siswa ini dari tabel presensi (jika ada)
								const absensi = activeJurnal.presensi.find((p: any) => p.siswaId === siswa.id);
								let statusBadge = (
									<span
										style={{
											background: "#f1f5f9",
											color: "#64748b",
											padding: "0.25rem 0.5rem",
											borderRadius: "4px",
											fontSize: "0.75rem",
											fontWeight: 600,
										}}
									>
										Belum Scan
									</span>
								);

								if (absensi?.status === "H")
									statusBadge = (
										<span
											style={{
												background: "#d1fae5",
												color: "#047857",
												padding: "0.25rem 0.5rem",
												borderRadius: "4px",
												fontSize: "0.75rem",
												fontWeight: 600,
											}}
										>
											Hadir
										</span>
									);
								else if (absensi?.status === "I")
									statusBadge = (
										<span
											style={{
												background: "#fef3c7",
												color: "#b45309",
												padding: "0.25rem 0.5rem",
												borderRadius: "4px",
												fontSize: "0.75rem",
												fontWeight: 600,
											}}
										>
											Izin
										</span>
									);
								else if (absensi?.status === "S")
									statusBadge = (
										<span
											style={{
												background: "#dbeafe",
												color: "#1d4ed8",
												padding: "0.25rem 0.5rem",
												borderRadius: "4px",
												fontSize: "0.75rem",
												fontWeight: 600,
											}}
										>
											Sakit
										</span>
									);
								else if (absensi?.status === "A")
									statusBadge = (
										<span
											style={{
												background: "#fee2e2",
												color: "#b91c1c",
												padding: "0.25rem 0.5rem",
												borderRadius: "4px",
												fontSize: "0.75rem",
												fontWeight: 600,
											}}
										>
											Alpha
										</span>
									);

								return (
									<tr key={siswa.id}>
										<td>{index + 1}</td>
										<td style={{ fontWeight: 500 }}>{siswa.nis}</td>
										<td style={{ fontWeight: 600, color: "#0a2540" }}>{siswa.user?.nama || "Nama Siswa"}</td>
										<td>{siswa.jenisKelamin === "L" ? "L" : "P"}</td>
										<td style={{ color: "#6b7280" }}>
											{absensi?.waktuScan ? new Date(absensi.waktuScan).toLocaleTimeString("id-ID") : "-"}
										</td>
										<td>{statusBadge}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	return null;
}
