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
	Bell,
	HelpCircle,
	Calendar,
	Filter,
	FolderOpen,
	ArrowLeft,
	Download,
	UsersRound,
	Clock,
	CheckCircle2,
	AlertTriangle,
	X,
	Printer,
} from "lucide-react";
import styles from "./riwayat.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function RiwayatClient({
	jadwalSemua,
	tahunAjaranList,
	user,
	isWaliKelas,
}: {
	jadwalSemua: any[];
	tahunAjaranList: any[];
	user: any;
	isWaliKelas: boolean;
}) {
	const [viewMode, setViewMode] = useState<"list" | "detail">("list");

	// Filter State
	const [selectedTahunId, setSelectedTahunId] = useState<string>(tahunAjaranList.find((t) => t.isActive)?.id || "");
	const [selectedSemester, setSelectedSemester] = useState<string>("Semester Genap");

	// Detail State
	const [activeJadwal, setActiveJadwal] = useState<any>(null);
	const [activeTab, setActiveTab] = useState<"rekap" | "jurnal" | "analisa">("rekap");

	// Modal PDF State
	const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	// Lakukan Filter Data berdasarkan Dropdown
	const filteredJadwal = jadwalSemua.filter((j) => j.tahunAjaranId === selectedTahunId);

	// --- FUNGSI KALKULASI STATISTIK KELAS ---
	const getKelasStats = (jadwal: any) => {
		const totalPertemuan = jadwal.jurnal.length;
		if (totalPertemuan === 0) return { totalPertemuan: 0, rataKehadiran: 0 };

		const totalSiswa = jadwal.kelas.riwayatSiswa.length;
		if (totalSiswa === 0) return { totalPertemuan, rataKehadiran: 0 };

		let totalHadirSemua = 0;
		jadwal.jurnal.forEach((jurnal: any) => {
			const hadir = jurnal.presensi.filter((p: any) => p.status === "H").length;
			totalHadirSemua += hadir;
		});

		const maxPossibleHadir = totalSiswa * totalPertemuan;
		const rataKehadiran = maxPossibleHadir > 0 ? Math.round((totalHadirSemua / maxPossibleHadir) * 100) : 0;

		return { totalPertemuan, rataKehadiran };
	};

	// --- FUNGSI KALKULASI REKAP INDIVIDU SISWA (DIUPDATE UNTUK DETAIL H/I/S/A) ---
	const getRekapSiswa = (siswaId: string, jurnalList: any[]) => {
		const totalPertemuan = jurnalList.length;
		let H = 0,
			I = 0,
			S = 0,
			A = 0;

		jurnalList.forEach((jurnal) => {
			const absen = jurnal.presensi.find((p: any) => p.siswaId === siswaId);
			if (absen) {
				if (absen.status === "H") H++;
				else if (absen.status === "I") I++;
				else if (absen.status === "S") S++;
				else if (absen.status === "A") A++;
			}
		});

		const totalHadir = H;
		const persentase = totalPertemuan > 0 ? Math.round((totalHadir / totalPertemuan) * 100) : 0;

		let statusText = "Kurang";
		let statusClass = styles.badgeKurang;
		if (persentase >= 90) {
			statusText = "Sangat Baik";
			statusClass = styles.badgeSangatBaik;
		} else if (persentase >= 75) {
			statusText = "Baik";
			statusClass = styles.badgeBaik;
		}

		return { H, I, S, A, totalHadir, totalPertemuan, persentase, statusText, statusClass };
	};

	// --- FUNGSI EXPORT PDF ---
	const handleDownloadPdf = async () => {
		setIsDownloading(true);
		try {
			const html2pdf = (await import("html2pdf.js")).default;
			const element = document.getElementById("pdf-portofolio-content");

			const opt = {
				margin: 0,
				filename: `Riwayat_Jurnal_${activeJadwal.mapel.nama}_${activeJadwal.kelas.nama}.pdf`,
				image: { type: "jpeg", quality: 1 },
				html2canvas: { scale: 2, useCORS: true, letterRendering: true },
				jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
			};

			await html2pdf().set(opt).from(element).save();
		} catch (error) {
			console.error("Gagal men-generate PDF:", error);
			alert("Terjadi kesalahan saat memproses PDF.");
		} finally {
			setIsDownloading(false);
			setIsPdfModalOpen(false);
		}
	};

	return (
		<div className={styles.layoutWrapper}>
			{/* === MODAL PREVIEW PDF A4 === */}
			{isPdfModalOpen && activeJadwal && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainerLarge}>
						<div className={styles.modalHeader}>
							<div>
								<h3 className={styles.modalTitle}>Preview Cetak Dokumen A4</h3>
								<p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>
									Pastikan data Jurnal dan Analisa sudah sesuai.
								</p>
							</div>
							<button className={styles.modalCloseBtn} onClick={() => setIsPdfModalOpen(false)}>
								<X size={20} />
							</button>
						</div>

						<div className={styles.modalBodyScroll}>
							{/* === AREA KERTAS A4 YANG AKAN DICETAK === */}
							<div id="pdf-portofolio-content" className={styles.pdfA4Container}>
								{/* HALAMAN 1: COVER */}
								<div className={styles.pdfCover}>
									<h2 style={{ fontSize: "18pt", fontWeight: 800, marginBottom: "0.5rem" }}>RIWAYAT JURNAL MENGAJAR</h2>
									<h1
										style={{
											fontSize: "24pt",
											fontWeight: 900,
											color: "#0a2540",
											marginBottom: "1rem",
											textTransform: "uppercase",
										}}
									>
										{activeJadwal.mapel.nama}
									</h1>
									<p style={{ fontSize: "12pt", fontWeight: 600 }}>Tahun Akademik {activeJadwal.tahunAjaran.nama}</p>

									<div style={{ margin: "3.5rem 0", display: "flex", justifyContent: "center" }}>
										<img
											src="/logo.jpg"
											alt="Logo SMAN 2 Brebes"
											style={{ width: "160px", height: "160px", objectFit: "contain" }}
										/>
									</div>

									<div style={{ textAlign: "center" }}>
										<p style={{ fontSize: "11pt", marginBottom: "0.5rem" }}>
											<strong>GURU PENGAMPU:</strong>
										</p>
										<p style={{ fontSize: "14pt", fontWeight: 700, color: "#0a2540" }}>{user.nama}</p>
										<p style={{ fontSize: "11pt", marginTop: "0.5rem" }}>NPP: {user.username}</p>
									</div>

									<div
										style={{
											marginTop: "3.5rem",
											textAlign: "center",
											borderTop: "2px solid #0a2540",
											paddingTop: "1.5rem",
											width: "70%",
											margin: "3.5rem auto 0 auto",
										}}
									>
										<p style={{ fontSize: "14pt", fontWeight: 800 }}>KELAS: {activeJadwal.kelas.nama}</p>
										<p style={{ fontSize: "12pt" }}>SMA NEGERI 2 BREBES</p>
									</div>
								</div>

								<div className="html2pdf__page-break"></div>

								{/* HALAMAN 2: KONTEN */}
								<div className={styles.pdfContent}>
									<h3 className={styles.pdfSectionTitle}>A. JURNAL MENGAJAR & CATATAN KBM</h3>
									<table className={styles.pdfTable}>
										<thead>
											<tr>
												<th style={{ width: "5%" }}>Pert.</th>
												<th style={{ width: "15%" }}>Tanggal</th>
												<th style={{ width: "25%" }}>Topik Pembelajaran</th>
												<th style={{ width: "40%" }}>Catatan Evaluasi / Kendala</th>
												<th style={{ width: "15%" }}>Status</th>
											</tr>
										</thead>
										<tbody>
											{(() => {
												const sortedJurnal = [...activeJadwal.jurnal].sort(
													(a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
												);
												if (sortedJurnal.length === 0)
													return (
														<tr>
															<td colSpan={5} style={{ textAlign: "center" }}>
																Belum ada jurnal.
															</td>
														</tr>
													);

												return sortedJurnal.map((jur: any, idx: number) => (
													<tr key={jur.id}>
														<td style={{ textAlign: "center" }}>{idx + 1}</td>
														<td style={{ textAlign: "center" }}>
															{new Date(jur.tanggal).toLocaleDateString("id-ID", {
																day: "2-digit",
																month: "short",
																year: "numeric",
															})}
														</td>
														<td>{jur.materiBab || jur.topik || "-"}</td>
														<td>{jur.catatan || "Tidak ada kendala"}</td>
														<td style={{ textAlign: "center" }}>{jur.status === "SUBMITTED" ? "Dibuat" : "Draft"}</td>
													</tr>
												));
											})()}
										</tbody>
									</table>

									<div className="html2pdf__page-break"></div>

									<h3 className={styles.pdfSectionTitle}>B. REKAPITULASI KEHADIRAN SISWA</h3>
									<table className={styles.pdfTable}>
										<thead>
											<tr>
												<th style={{ width: "5%" }}>No.</th>
												<th style={{ width: "33%" }}>Nama Siswa</th>
												<th style={{ width: "16%" }}>NIS</th>
												<th style={{ width: "7%", textAlign: "center" }}>H</th>
												<th style={{ width: "7%", textAlign: "center" }}>I</th>
												<th style={{ width: "7%", textAlign: "center" }}>S</th>
												<th style={{ width: "7%", textAlign: "center" }}>A</th>
												<th style={{ width: "18%", textAlign: "center" }}>% Hadir</th>
											</tr>
										</thead>
										<tbody>
											{(() => {
												// PERBAIKAN: Mengurutkan Siswa dari A-Z
												const sortedSiswa = [...activeJadwal.kelas.riwayatSiswa].sort((a: any, b: any) => {
													const nameA = a.siswa?.user?.nama || "";
													const nameB = b.siswa?.user?.nama || "";
													return nameA.localeCompare(nameB);
												});

												return sortedSiswa.map((rs: any, idx: number) => {
													const rekap = getRekapSiswa(rs.siswa.id, activeJadwal.jurnal);
													return (
														<tr key={rs.siswa.id}>
															<td style={{ textAlign: "center" }}>{idx + 1}</td>
															<td>{rs.siswa.user?.nama}</td>
															<td>{rs.siswa.nis}</td>
															<td style={{ textAlign: "center" }}>{rekap.H}</td>
															<td style={{ textAlign: "center" }}>{rekap.I}</td>
															<td style={{ textAlign: "center" }}>{rekap.S}</td>
															<td style={{ textAlign: "center", color: rekap.A > 0 ? "#ef4444" : "inherit" }}>
																{rekap.A}
															</td>
															<td style={{ textAlign: "center", fontWeight: "bold" }}>{rekap.persentase}%</td>
														</tr>
													);
												});
											})()}
										</tbody>
									</table>

									<h3 className={styles.pdfSectionTitle} style={{ marginTop: "2rem" }}>
										C. ANALISA HASIL KBM
									</h3>
									{(() => {
										const jurnalSorted = [...activeJadwal.jurnal].sort(
											(a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
										);
										const totalSiswaKls = activeJadwal.kelas.riwayatSiswa.length;

										const chartData = jurnalSorted.map((j, i) => {
											const h = j.presensi?.filter((p: any) => p.status === "H").length || 0;
											const pct = totalSiswaKls > 0 ? Math.round((h / totalSiswaKls) * 100) : 0;
											let fillColor = "#0a2540";
											if (pct < 75) fillColor = "#ef4444";
											else if (pct < 90) fillColor = "#f59e0b";

											return { pertemuan: i + 1, pct, hadir: h, fillColor };
										});

										return (
											<div
												style={{
													border: "1px solid #000",
													padding: "1rem",
													marginBottom: "1.5rem",
													pageBreakInside: "avoid",
												}}
											>
												<p
													style={{ fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center", fontSize: "11pt" }}
												>
													GRAFIK TREN KEHADIRAN SISWA
												</p>

												<div
													style={{
														display: "flex",
														justifyContent: "space-around",
														alignItems: "flex-end",
														height: "140px",
														borderBottom: "1px solid #cbd5e1",
														paddingBottom: "0.5rem",
														margin: "0 2rem",
													}}
												>
													{chartData.length === 0 ? (
														<div style={{ color: "#64748b", fontSize: "10pt", alignSelf: "center" }}>
															Belum ada data kehadiran.
														</div>
													) : (
														chartData.map((data, idx) => (
															<div
																key={idx}
																style={{
																	display: "flex",
																	flexDirection: "column",
																	alignItems: "center",
																	width: "30px",
																}}
															>
																<span style={{ fontSize: "8pt", fontWeight: "bold", marginBottom: "4px" }}>
																	{data.pct}%
																</span>
																<div
																	style={{
																		height: "100px",
																		width: "100%",
																		backgroundColor: "#f1f5f9",
																		display: "flex",
																		alignItems: "flex-end",
																	}}
																>
																	<div
																		style={{ width: "100%", height: `${data.pct}%`, backgroundColor: data.fillColor }}
																	></div>
																</div>
																<span style={{ fontSize: "8pt", marginTop: "4px" }}>P-{data.pertemuan}</span>
															</div>
														))
													)}
												</div>
											</div>
										);
									})()}

									<div style={{ border: "1px solid #000", padding: "1rem", pageBreakInside: "avoid" }}>
										<p>
											<strong>REKAPITULASI CAPAIAN KELAS:</strong>
										</p>
										<p style={{ marginBottom: "1rem" }}>
											Rata-rata persentase kehadiran kelas {activeJadwal.kelas.nama} adalah{" "}
											<strong>{getKelasStats(activeJadwal).rataKehadiran}%</strong> selama{" "}
											<strong>{getKelasStats(activeJadwal).totalPertemuan} pertemuan</strong>.
										</p>

										<p>
											<strong>RANGKUMAN CATATAN EVALUASI:</strong>
										</p>
										<ul style={{ paddingLeft: "1.5rem", marginBottom: "2rem" }}>
											{(() => {
												const sortedJurnal = [...activeJadwal.jurnal].sort(
													(a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
												);
												const notes = sortedJurnal.filter((j) => j.catatan && j.catatan.trim() !== "");
												if (notes.length === 0)
													return <li>Tidak ada catatan kendala yang direkam pada semester ini.</li>;
												return notes.map((n, i) => (
													<li key={i} style={{ marginBottom: "0.5rem" }}>
														<strong>
															Pertemuan {i + 1} ({new Date(n.tanggal).toLocaleDateString("id-ID")}):
														</strong>{" "}
														{n.catatan}
													</li>
												));
											})()}
										</ul>

										<div style={{ textAlign: "right", marginTop: "3rem" }}>
											<p>
												Brebes,{" "}
												{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
											</p>
											<p style={{ marginBottom: "4rem" }}>Guru Pengampu,</p>
											<p>
												<strong>{user.nama}</strong>
											</p>
											<p>NPP: {user.username}</p>
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className={styles.modalFooter}>
							<button className={styles.btnOutline} onClick={() => setIsPdfModalOpen(false)}>
								Batal
							</button>
							<button className={styles.btnPrimary} onClick={handleDownloadPdf} disabled={isDownloading}>
								{isDownloading ? (
									"Memproses PDF..."
								) : (
									<>
										<Printer size={16} /> Simpan File PDF
									</>
								)}
							</button>
						</div>
					</div>
				</div>
			)}

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
					<Link href="/teacher/riwayat" className={`${styles.menuItem} ${styles.menuItemActive}`}>
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
					{/* === VIEW 1: ARSIP LIST === */}
					{viewMode === "list" && (
						<div>
							<h1 className={styles.pageTitle}>Riwayat Mengajar</h1>
							<p className={styles.pageSubtitle}>
								Arsip jurnal dan presensi dari tahun ajaran dan semester sebelumnya.
							</p>

							<div className={styles.filterBox}>
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Tahun Ajaran</label>
									<select
										className={styles.filterSelect}
										value={selectedTahunId}
										onChange={(e) => setSelectedTahunId(e.target.value)}
									>
										{tahunAjaranList.map((t) => (
											<option key={t.id} value={t.id}>
												{t.nama}
											</option>
										))}
									</select>
								</div>
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Semester</label>
									<select
										className={styles.filterSelect}
										value={selectedSemester}
										onChange={(e) => setSelectedSemester(e.target.value)}
									>
										<option value="Semester Ganjil">Semester Ganjil</option>
										<option value="Semester Genap">Semester Genap</option>
									</select>
								</div>
								<button className={styles.btnPrimary} style={{ height: "42px" }}>
									<Filter size={16} /> Terapkan Filter
								</button>
							</div>

							<div className={styles.cardGrid}>
								{filteredJadwal.length === 0 ? (
									<div
										style={{
											gridColumn: "1 / -1",
											textAlign: "center",
											padding: "3rem",
											color: "#64748b",
											background: "white",
											borderRadius: "0.75rem",
											border: "1px dashed #cbd5e1",
										}}
									>
										Tidak ada riwayat kelas yang telah diselesaikan pada periode ini.
									</div>
								) : (
									filteredJadwal.map((jadwal) => {
										const stats = getKelasStats(jadwal);
										const ta = tahunAjaranList.find((t) => t.id === jadwal.tahunAjaranId)?.nama || "";

										return (
											<div key={jadwal.id} className={styles.riwayatCard}>
												<div className={styles.cardHeader}>
													<div className={styles.cardTitle}>{jadwal.mapel.nama}</div>
													<div className={styles.badgeSelesai}>Selesai</div>
												</div>
												<div className={styles.cardSubtitle}>{jadwal.kelas.nama}</div>
												<div className={styles.cardMeta}>
													<Calendar size={12} /> {ta} &bull; {selectedSemester}
												</div>

												<div className={styles.cardStats}>
													<div className={styles.statRow}>
														<span>Total Pertemuan</span>
														<strong>{stats.totalPertemuan}</strong>
													</div>
													<div className={styles.statRow}>
														<span>Rata-rata Kehadiran</span>
														<strong className={styles.highlight}>{stats.rataKehadiran}%</strong>
													</div>
												</div>

												<button
													className={styles.btnOutline}
													style={{ width: "100%", justifyContent: "center" }}
													onClick={() => {
														setActiveJadwal(jadwal);
														setViewMode("detail");
													}}
												>
													<FolderOpen size={16} /> Buka Arsip
												</button>
											</div>
										);
									})
								)}
							</div>
						</div>
					)}

					{/* === VIEW 2: DETAIL STATISTIK === */}
					{viewMode === "detail" && activeJadwal && (
						<div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "flex-start",
									marginBottom: "1.5rem",
								}}
							>
								<div>
									<div className={styles.breadcrumb}>
										Riwayat &gt; <span>{activeJadwal.mapel.nama}</span>
									</div>
									<h1 className={styles.pageTitle} style={{ fontSize: "2rem" }}>
										{activeJadwal.mapel.nama}
									</h1>
									<p className={styles.pageSubtitle} style={{ marginBottom: 0 }}>
										{activeJadwal.kelas.nama} &bull; {selectedSemester} {activeJadwal.tahunAjaran.nama}
									</p>
								</div>
								<div style={{ display: "flex", gap: "1rem" }}>
									<button className={styles.btnOutline} onClick={() => setViewMode("list")}>
										<ArrowLeft size={16} /> Kembali
									</button>
									<button className={styles.btnPrimary} onClick={() => setIsPdfModalOpen(true)}>
										<Download size={16} /> Export Laporan PDF
									</button>
								</div>
							</div>

							{(() => {
								const stats = getKelasStats(activeJadwal);
								return (
									<div className={styles.statsGrid}>
										<div className={styles.statBox}>
											<div className={styles.statBoxHeader}>
												Rata-Rata Kehadiran <UsersRound size={16} color="#f59e0b" />
											</div>
											<div className={styles.statBoxValue}>
												{stats.rataKehadiran}% <span className={styles.statBadge}>+2%</span>
											</div>
										</div>
										<div className={styles.statBox}>
											<div className={styles.statBoxHeader}>
												Total Pertemuan <Calendar size={16} color="#3b82f6" />
											</div>
											<div className={styles.statBoxValue}>
												{stats.totalPertemuan} <span className={styles.statBoxSub}>Sesi</span>
											</div>
										</div>
										<div className={styles.statBox}>
											<div className={styles.statBoxHeader}>
												Ketepatan Waktu Rata-Rata <Clock size={16} color="#ef4444" />
											</div>
											<div className={styles.statBoxValue}>
												88% <span className={styles.statBoxSub}>Tepat</span>
											</div>
										</div>
										<div className={styles.statBox}>
											<div className={styles.statBoxHeader}>
												Capaian Materi <CheckCircle2 size={16} color="#10b981" />
											</div>
											<div className={styles.statBoxValue}>
												100% <span className={styles.statBoxSub}>Selesai</span>
											</div>
										</div>
									</div>
								);
							})()}

							<div className={styles.tableContainer}>
								<div
									style={{
										padding: "1.5rem 1.5rem 0 1.5rem",
										background: "#ffffff",
										borderBottom: "1px solid #e2e8f0",
									}}
								>
									<div className={styles.tabsContainer}>
										<button
											className={`${styles.tabBtn} ${activeTab === "rekap" ? styles.tabActive : ""}`}
											onClick={() => setActiveTab("rekap")}
										>
											Rekap Presensi Siswa
										</button>
										<button
											className={`${styles.tabBtn} ${activeTab === "jurnal" ? styles.tabActive : ""}`}
											onClick={() => setActiveTab("jurnal")}
										>
											Jurnal Mengajar
										</button>
										<button
											className={`${styles.tabBtn} ${activeTab === "analisa" ? styles.tabActive : ""}`}
											onClick={() => setActiveTab("analisa")}
										>
											Analisa Hasil
										</button>
									</div>
								</div>

								{/* --- TAB 1: REKAP SISWA --- */}
								{activeTab === "rekap" && (
									<table className={styles.tableStyle}>
										<thead>
											<tr>
												<th style={{ width: "25%" }}>Nama Siswa</th>
												<th style={{ width: "15%" }}>NIS</th>
												<th style={{ width: "25%" }}>Detail Kehadiran (H/I/S/A)</th>
												<th style={{ width: "20%" }}>Persentase</th>
												<th style={{ width: "15%" }}>Status</th>
											</tr>
										</thead>
										<tbody>
											{(() => {
												// PERBAIKAN: Mengurutkan Siswa dari A-Z
												const sortedSiswa = [...activeJadwal.kelas.riwayatSiswa].sort((a: any, b: any) => {
													const nameA = a.siswa?.user?.nama || "";
													const nameB = b.siswa?.user?.nama || "";
													return nameA.localeCompare(nameB);
												});

												return sortedSiswa.map((rs: any) => {
													const siswa = rs.siswa;
													const rekap = getRekapSiswa(siswa.id, activeJadwal.jurnal);

													let barColor = "#0f172a";
													if (rekap.persentase < 90 && rekap.persentase >= 75) barColor = "#f59e0b";

													return (
														<tr key={siswa.id}>
															<td style={{ fontWeight: 700, color: "#0f172a" }}>{siswa.user?.nama}</td>
															<td>{siswa.nis}</td>
															<td style={{ fontWeight: 600 }}>
																<span style={{ color: "#10b981" }}>H: {rekap.H}</span> &nbsp;|&nbsp;
																<span style={{ color: "#f59e0b" }}>I: {rekap.I}</span> &nbsp;|&nbsp;
																<span style={{ color: "#f59e0b" }}>S: {rekap.S}</span> &nbsp;|&nbsp;
																<span style={{ color: "#ef4444" }}>A: {rekap.A}</span>
															</td>
															<td>
																<div className={styles.progressWrapper}>
																	<div className={styles.progressTrack}>
																		<div
																			className={styles.progressBar}
																			style={{ width: `${rekap.persentase}%`, backgroundColor: barColor }}
																		></div>
																	</div>
																	<span className={styles.progressText}>{rekap.persentase}%</span>
																</div>
															</td>
															<td>
																<span className={`${styles.badgeStatus} ${rekap.statusClass}`}>{rekap.statusText}</span>
															</td>
														</tr>
													);
												});
											})()}
										</tbody>
									</table>
								)}

								{/* --- TAB 2: JURNAL MENGAJAR --- */}
								{activeTab === "jurnal" && (
									<div className={styles.jurnalListContainer}>
										{!activeJadwal.jurnal || activeJadwal.jurnal.length === 0 ? (
											<div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
												Belum ada rekam jejak jurnal untuk kelas ini.
											</div>
										) : (
											[...activeJadwal.jurnal]
												.sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime())
												.map((jurnalItem: any, index: number) => {
													const tglFormatted = new Date(jurnalItem.tanggal).toLocaleDateString("id-ID", {
														weekday: "long",
														year: "numeric",
														month: "long",
														day: "numeric",
													});

													const totalKls = activeJadwal.kelas.riwayatSiswa.length;
													const h = jurnalItem.presensi?.filter((p: any) => p.status === "H").length || 0;
													const is =
														jurnalItem.presensi?.filter((p: any) => p.status === "I" || p.status === "S").length || 0;
													const a = totalKls - h - is;

													return (
														<div key={jurnalItem.id} className={styles.jurnalLogCard}>
															<div className={styles.jurnalLogHeader}>
																<div className={styles.jurnalLogTitle}>Pertemuan Ke-{index + 1}</div>
																<div className={styles.jurnalLogDate}>
																	<Calendar size={14} /> {tglFormatted}
																</div>
															</div>

															<div className={styles.jurnalLogBody}>
																<div className={styles.jurnalLogSection}>
																	<strong>Topik Materi</strong>
																	<p>{jurnalItem.materiBab || jurnalItem.topik}</p>
																</div>

																<div className={styles.jurnalLogSection}>
																	<strong>Catatan Evaluasi / Kendala KBM:</strong>
																	<p>
																		{jurnalItem.catatan ? (
																			jurnalItem.catatan
																		) : (
																			<span style={{ color: "#94a3b8", fontStyle: "italic" }}>
																				Tidak ada catatan tambahan untuk pertemuan ini.
																			</span>
																		)}
																	</p>
																</div>

																<div className={styles.jurnalLogStats}>
																	<span style={{ color: "#10b981" }}>Hadir: {h} Siswa</span>
																	<span style={{ color: "#f59e0b" }}>Izin/Sakit: {is} Siswa</span>
																	<span style={{ color: "#ef4444" }}>Alpha: {a} Siswa</span>
																</div>
															</div>
														</div>
													);
												})
										)}
									</div>
								)}

								{/* --- TAB 3: ANALISA HASIL --- */}
								{activeTab === "analisa" &&
									(() => {
										const jurnalSorted = [...activeJadwal.jurnal].sort(
											(a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
										);
										const totalSiswaKls = activeJadwal.kelas.riwayatSiswa.length;

										const chartData = jurnalSorted.map((j, i) => {
											const h = j.presensi?.filter((p: any) => p.status === "H").length || 0;
											const pct = totalSiswaKls > 0 ? Math.round((h / totalSiswaKls) * 100) : 0;
											let fillColor = styles.barFill;
											if (pct < 75) fillColor = styles.barFillDanger;
											else if (pct < 90) fillColor = styles.barFillWarning;
											return { pertemuan: i + 1, pct, hadir: h, fillColor };
										});

										const warningStudents = activeJadwal.kelas.riwayatSiswa
											.map((rs: any) => {
												const rekap = getRekapSiswa(rs.siswa.id, activeJadwal.jurnal);
												return { ...rs.siswa, ...rekap };
											})
											.filter((s: any) => s.persentase < 80)
											.sort((a: any, b: any) => a.persentase - b.persentase);

										const notesData = jurnalSorted
											.map((j, i) => ({
												pertemuan: i + 1,
												tanggal: new Date(j.tanggal).toLocaleDateString("id-ID", {
													day: "numeric",
													month: "long",
													year: "numeric",
												}),
												catatan: j.catatan,
											}))
											.filter((n) => n.catatan && n.catatan.trim() !== "");

										return (
											<div className={styles.analisaContainer}>
												<div className={styles.chartCard}>
													<div className={styles.chartHeader}>
														<div>
															<div className={styles.chartTitle}>Grafik Tren Kehadiran</div>
															<div className={styles.chartSubtitle}>
																Persentase siswa hadir dari pertemuan pertama hingga terakhir.
															</div>
														</div>
													</div>
													<div className={styles.barChart}>
														{chartData.map((data, idx) => (
															<div key={idx} className={styles.barCol} title={`Hadir: ${data.hadir} Siswa`}>
																<div className={styles.barValue}>{data.pct}%</div>
																<div className={styles.barTrack}>
																	<div
																		className={styles.barFill}
																		style={{
																			height: `${data.pct}%`,
																			backgroundColor:
																				data.pct < 75 ? "#ef4444" : data.pct < 90 ? "#f59e0b" : "#3b82f6",
																		}}
																	></div>
																</div>
																<div className={styles.barLabel}>P-{data.pertemuan}</div>
															</div>
														))}
													</div>
													{chartData.length === 0 && (
														<div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
															Belum ada data kehadiran.
														</div>
													)}
												</div>

												<div className={styles.analisaGrid}>
													<div className={styles.noteSummaryCard}>
														<div className={styles.chartTitle}>Rangkuman Evaluasi & Kendala KBM</div>
														<div className={styles.chartSubtitle}>Kumpulan catatan pengajar selama satu semester.</div>

														<div className={styles.noteList}>
															{notesData.length === 0 ? (
																<div
																	style={{
																		padding: "2rem",
																		textAlign: "center",
																		color: "#94a3b8",
																		fontStyle: "italic",
																		border: "1px dashed #cbd5e1",
																		borderRadius: "0.5rem",
																	}}
																>
																	Tidak ada catatan KBM yang direkam pada semester ini.
																</div>
															) : (
																notesData.map((note, idx) => (
																	<div key={idx} className={styles.noteItem}>
																		<div className={styles.noteMeta}>
																			Pertemuan {note.pertemuan} &bull; {note.tanggal}
																		</div>
																		<p className={styles.noteText}>{note.catatan}</p>
																	</div>
																))
															)}
														</div>
													</div>

													<div className={styles.warningCard}>
														<div className={styles.warningHeader}>
															<AlertTriangle size={20} /> Sistem Peringatan Dini
														</div>
														<div className={styles.chartSubtitle} style={{ marginBottom: "1.5rem", color: "#b91c1c" }}>
															Siswa dengan total kehadiran di bawah <strong>80%</strong>.
														</div>

														<div className={styles.warningList}>
															{warningStudents.length === 0 ? (
																<div
																	style={{
																		textAlign: "center",
																		padding: "1rem",
																		color: "#047857",
																		fontWeight: 600,
																		background: "#d1fae5",
																		borderRadius: "0.5rem",
																	}}
																>
																	<CheckCircle2 size={16} style={{ display: "inline", marginBottom: "-3px" }} /> Aman!
																	Tidak ada siswa berisiko.
																</div>
															) : (
																warningStudents.map((siswa: any) => (
																	<div key={siswa.id} className={styles.warningItem}>
																		<div>
																			<div className={styles.warningName}>{siswa.user?.nama}</div>
																			<div className={styles.warningNis}>NIS: {siswa.nis}</div>
																		</div>
																		<div className={styles.warningStat}>
																			<div className={styles.warningPct}>{siswa.persentase}%</div>
																			<div className={styles.warningAbsen}>
																				Hadir {siswa.totalHadir}/{siswa.totalPertemuan}
																			</div>
																		</div>
																	</div>
																))
															)}
														</div>
													</div>
												</div>
											</div>
										);
									})()}
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
