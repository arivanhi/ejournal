"use client";

import { useState, useMemo, useEffect } from "react";
import {
	LayoutDashboard,
	Users,
	Clock,
	BookOpen,
	FileBarChart,
	Settings,
	LogOut,
	Bell,
	ArrowLeft,
	Printer,
	UsersRound,
	GraduationCap,
	AlertTriangle,
	UserX,
	PieChart,
	Lightbulb,
	Edit3,
	X,
	Check,
	Edit,
	Download,
} from "lucide-react";
import styles from "./report.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { savePdcaAction } from "./actions";

export default function ReportClient({ user, dataRekap }: any) {
	const [viewMode, setViewMode] = useState<"selection" | "detail">("selection");
	const [selectedTahun, setSelectedTahun] = useState<string>("");
	const [selectedSemester, setSelectedSemester] = useState<string>("");

	// State Modal & Toast
	const [isRecomModalOpen, setIsRecomModalOpen] = useState(false);
	const [isAksiModalOpen, setIsAksiModalOpen] = useState(false);
	const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [toastType, setToastType] = useState<"success" | "error">("success");
	const [isLoading, setIsLoading] = useState(false);
	const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

	// Form State
	const [recomText, setRecomText] = useState("");
	const [aksiForm, setAksiForm] = useState({ aspek: "Guru", temuan: "", aksi: "", status: "Planning" });

	const showToast = (message: string, type: "success" | "error" = "success") => {
		setToastMessage(message);
		setToastType(type);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const { tahunList, semesterList } = useMemo(() => {
		const tList = new Set<string>();
		const sList = new Set<string>();

		dataRekap.forEach((item: any) => {
			const parts = item.tahunAjaranNama.trim().split(" ");
			if (parts.length >= 2) {
				tList.add(parts[0]);
				sList.add(parts[1].toLowerCase() === "ganjil" ? "Ganjil" : "Genap");
			}
		});
		return { tahunList: Array.from(tList).sort().reverse(), semesterList: Array.from(sList) };
	}, [dataRekap]);

	useEffect(() => {
		if (tahunList.length > 0 && !selectedTahun) setSelectedTahun(tahunList[0]);
		if (semesterList.length > 0 && !selectedSemester) setSelectedSemester("Genap");
	}, [tahunList, semesterList]);

	const activeData = useMemo(() => {
		const targetFormat = `${selectedTahun} ${selectedSemester}`.toLowerCase();
		return dataRekap.find((item: any) => item.tahunAjaranNama.toLowerCase().includes(targetFormat)) || null;
	}, [dataRekap, selectedTahun, selectedSemester]);

	// Handle Open Modals
	const handleOpenRecomModal = () => {
		setRecomText(activeData.pdca.actRekomendasi);
		setIsRecomModalOpen(true);
	};

	const handleOpenAksiModal = (row: any = null) => {
		if (row) {
			setAksiForm({ aspek: row.aspek, temuan: row.temuan, aksi: row.aksi, status: row.status });
		} else {
			setAksiForm({ aspek: "Guru", temuan: "", aksi: "", status: "Planning" });
		}
		setIsAksiModalOpen(true);
	};

	// --- HANDLE SIMPAN DATA ---
	const handleSaveRecom = async () => {
		setIsLoading(true);
		const res = await savePdcaAction(activeData.tahunAjaranId, "Rekomendasi", { teks: recomText }, user.id);

		if (res.success) {
			setIsRecomModalOpen(false);
			showToast("Rekomendasi berhasil diperbarui!", "success");
		} else {
			showToast(`Error: ${res.message}`, "error");
		}
		setIsLoading(false);
	};

	const handleSaveAksi = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		const res = await savePdcaAction(activeData.tahunAjaranId, "RencanaAksi", aksiForm, user.id);

		if (res.success) {
			setIsAksiModalOpen(false);
			showToast("Rencana Aksi berhasil disimpan!", "success");
		} else {
			showToast(`Error: ${res.message}`, "error");
		}
		setIsLoading(false);
	};

	// --- FUNGSI EXPORT PDF A4 LANDSCAPE ---
	const handleDownloadPdf = async () => {
		setIsDownloadingPdf(true);
		try {
			const html2pdf = (await import("html2pdf.js")).default;
			const element = document.getElementById("pdf-report-container");

			const opt = {
				margin: 0,
				filename: `Laporan_Rekapitulasi_PDCA_${selectedSemester}_${selectedTahun}.pdf`,
				image: { type: "jpeg", quality: 1 },
				html2canvas: { scale: 2, useCORS: true },
				jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
			};

			await html2pdf().set(opt).from(element).save();
		} catch (error) {
			console.error("Gagal men-generate PDF:", error);
			showToast("Terjadi kesalahan saat memproses laporan PDF.", "error");
		} finally {
			setIsDownloadingPdf(false);
			setIsPdfModalOpen(false);
		}
	};

	// Helper untuk Warna Gradien Donut Chart
	const getGradientString = () => {
		if (!activeData) return "";
		const d = activeData.distribusi;
		const p1 = d.hadir;
		const p2 = p1 + d.izin;
		const p3 = p2 + d.sakit;
		return `conic-gradient(
            #10b981 0% ${p1}%, 
            #fef08a ${p1}% ${p2}%, 
            #f59e0b ${p2}% ${p3}%, 
            #ef4444 ${p3}% 100%
        )`;
	};

	return (
		<div className={styles.layoutWrapper}>
			{/* CONTAINER TERSEMBUNYI UNTUK EXPORT PDF A4 LANDSCAPE */}
			{activeData && (
				<div style={{ display: "none" }}>
					<div
						id="pdf-report-container"
						style={{
							width: "297mm",
							minHeight: "210mm",
							padding: "15mm",
							boxSizing: "border-box",
							backgroundColor: "#fff",
							color: "#000",
							fontFamily: "Arial, sans-serif",
						}}
					>
						<div
							style={{
								position: "relative",
								textAlign: "center",
								borderBottom: "3px solid #000",
								paddingBottom: "15px",
								marginBottom: "15px",
							}}
						>
							<img
								src="/logo.jpg"
								alt="Logo SMAN 2 Brebes"
								style={{
									position: "absolute",
									left: "10px",
									top: "50%",
									transform: "translateY(-50%)",
									width: "80px",
									height: "80px",
									objectFit: "contain",
								}}
							/>
							<h1
								style={{
									margin: "0 0 5px 0",
									fontSize: "18pt",
									fontWeight: "bold",
									color: "#000",
									fontFamily: '"Times New Roman", Times, serif',
								}}
							>
								SMA NEGERI 2 BREBES
							</h1>
							<p style={{ margin: "2px 0", fontSize: "11pt" }}>Jl. Jend. A. Yani 77 Brebes 52212 Telp. (0283) 671060</p>
							<p style={{ margin: 0, fontSize: "11pt" }}>
								Website: www.sman2-brebes.sch.id - Email: smadabes@ymail.com
							</p>
						</div>

						<div style={{ textAlign: "center", marginBottom: "20px" }}>
							<h2 style={{ margin: 0, fontSize: "14pt", fontWeight: "bold", textTransform: "uppercase" }}>
								LAPORAN REKAPITULASI - ANALISA PDCA
							</h2>
							<p style={{ margin: "5px 0", fontSize: "11pt" }}>
								Semester {selectedSemester} Tahun Ajaran {selectedTahun}
							</p>
						</div>

						<div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
							{/* STATISTIK CHART UNTUK PDF */}
							<div style={{ flex: 1, border: "1px solid #000", padding: "10px" }}>
								<h4 style={{ margin: "0 0 10px 0", fontSize: "11pt", textAlign: "center" }}>Distribusi Presensi</h4>
								<ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: "10pt" }}>
									<li>🟩 Hadir: {activeData.distribusi.hadir}%</li>
									<li>🟨 Izin: {activeData.distribusi.izin}%</li>
									<li>🟧 Sakit: {activeData.distribusi.sakit}%</li>
									<li>🟥 Alpha: {activeData.distribusi.alpha}%</li>
								</ul>
							</div>
							<div style={{ flex: 2, border: "1px solid #000", padding: "10px" }}>
								<h4 style={{ margin: "0 0 10px 0", fontSize: "11pt", textAlign: "center" }}>
									Tren Kinerja Akademik Bulanan
								</h4>
								<div
									style={{
										display: "flex",
										justifyContent: "space-around",
										alignItems: "flex-end",
										height: "80px",
										borderBottom: "1px solid #ccc",
									}}
								>
									{activeData.trenKinerja.length === 0 ? (
										<p>Belum ada data tren.</p>
									) : (
										activeData.trenKinerja.map((t: any, i: number) => (
											<div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
												<div style={{ display: "flex", gap: "2px", alignItems: "flex-end", height: "60px" }}>
													<div
														style={{ width: "15px", height: `${t.pctKehadiran}%`, backgroundColor: "#1e3a8a" }}
														title="Kehadiran"
													></div>
													<div
														style={{ width: "15px", height: `${t.pctJurnal}%`, backgroundColor: "#65a30d" }}
														title="Jurnal"
													></div>
												</div>
												<span style={{ fontSize: "8pt", marginTop: "4px" }}>{t.bulan}</span>
											</div>
										))
									)}
								</div>
								<div style={{ fontSize: "8pt", marginTop: "5px", textAlign: "center" }}>
									🟦 Kehadiran Siswa | 🟩 Pengisian Jurnal
								</div>
							</div>
						</div>

						<h3
							style={{
								fontSize: "12pt",
								fontWeight: "bold",
								borderBottom: "1px solid #000",
								paddingBottom: "5px",
								marginBottom: "10px",
							}}
						>
							Analisa & Rekomendasi
						</h3>
						<div
							style={{
								border: "1px dashed #000",
								padding: "10px",
								fontSize: "10pt",
								marginBottom: "20px",
								minHeight: "50px",
							}}
						>
							{activeData.pdca.actRekomendasi || "Belum ada rekomendasi tertulis."}
						</div>

						<h3
							style={{
								fontSize: "12pt",
								fontWeight: "bold",
								borderBottom: "1px solid #000",
								paddingBottom: "5px",
								marginBottom: "10px",
							}}
						>
							Rencana Aksi (PDCA)
						</h3>
						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
								fontSize: "10pt",
								border: "1px solid #000",
								marginBottom: "20px",
							}}
						>
							<thead>
								<tr style={{ backgroundColor: "#f1f5f9" }}>
									<th style={{ border: "1px solid #000", padding: "6px", width: "15%" }}>Aspek</th>
									<th style={{ border: "1px solid #000", padding: "6px", width: "35%" }}>Temuan Utama</th>
									<th style={{ border: "1px solid #000", padding: "6px", width: "35%" }}>Rencana Aksi</th>
									<th style={{ border: "1px solid #000", padding: "6px", width: "15%", textAlign: "center" }}>
										Status
									</th>
								</tr>
							</thead>
							<tbody>
								{activeData.pdca.doImplementasi.length === 0 ? (
									<tr>
										<td colSpan={4} style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>
											Belum ada rencana aksi.
										</td>
									</tr>
								) : (
									activeData.pdca.doImplementasi.map((row: any, i: number) => (
										<tr key={i}>
											<td style={{ border: "1px solid #000", padding: "6px" }}>{row.aspek}</td>
											<td style={{ border: "1px solid #000", padding: "6px" }}>{row.temuan}</td>
											<td style={{ border: "1px solid #000", padding: "6px" }}>{row.aksi}</td>
											<td style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>{row.status}</td>
										</tr>
									))
								)}
							</tbody>
						</table>

						<div style={{ textAlign: "right", marginTop: "20px" }}>
							<p style={{ margin: 0, fontSize: "11pt" }}>Kepala Sekolah SMAN 2 Brebes</p>
							<p style={{ margin: "50px 0 0 0", fontSize: "11pt", fontWeight: "bold" }}>{user.nama}</p>
							<p style={{ margin: 0, fontSize: "11pt" }}>NIP: {user.username}</p>
						</div>
					</div>
				</div>
			)}

			{/* TOAST SYSTEM */}
			{toastMessage && (
				<div
					className={styles.toastContainer}
					style={{ backgroundColor: toastType === "error" ? "#ef4444" : "#10b981" }}
				>
					<div className={styles.toastIcon}>
						{toastType === "error" ? <AlertTriangle size={16} /> : <Check size={16} />}
					</div>
					<span className={styles.toastText}>{toastMessage}</span>
				</div>
			)}

			{/* MODAL CETAK PDF */}
			{isPdfModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Ekspor PDF Rekapitulasi</h3>
							<button className={styles.modalCloseBtn} onClick={() => setIsPdfModalOpen(false)}>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody} style={{ textAlign: "center", padding: "2rem" }}>
							<Printer size={48} color="#3b82f6" style={{ margin: "0 auto 1rem auto" }} />
							<p style={{ fontSize: "1rem", color: "#334155" }}>
								Anda akan mengunduh dokumen Laporan Rekapitulasi PDCA.
							</p>
						</div>
						<div className={styles.modalFooter}>
							<button className={styles.btnOutline} onClick={() => setIsPdfModalOpen(false)}>
								Batal
							</button>
							<button className={styles.btnPrimaryLg} onClick={handleDownloadPdf} disabled={isDownloadingPdf}>
								{isDownloadingPdf ? "Memproses PDF..." : "Unduh Laporan"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* MODAL UPDATE REKOMENDASI */}
			{isRecomModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Update Rekomendasi</h3>
							<button className={styles.modalCloseBtn} onClick={() => setIsRecomModalOpen(false)}>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<textarea
								className={styles.textareaCustom}
								rows={8}
								value={recomText}
								onChange={(e) => setRecomText(e.target.value)}
								placeholder="Tuliskan analisa dan rekomendasi strategis di sini..."
							/>
							<div className={styles.modalFooter}>
								<button className={styles.btnOutline} onClick={() => setIsRecomModalOpen(false)}>
									Batal
								</button>
								<button className={styles.btnPrimaryLg} onClick={handleSaveRecom} disabled={isLoading}>
									{isLoading ? "Menyimpan..." : "Simpan Perubahan"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* MODAL RENCANA AKSI */}
			{isAksiModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Tindak Lanjut (PDCA)</h3>
							<button className={styles.modalCloseBtn} onClick={() => setIsAksiModalOpen(false)}>
								<X size={20} />
							</button>
						</div>
						<form onSubmit={handleSaveAksi} className={styles.modalBody}>
							<div style={{ marginBottom: "1rem" }}>
								<label className={styles.formLabel}>Aspek</label>
								<select
									className={styles.inputField}
									value={aksiForm.aspek}
									onChange={(e) => setAksiForm({ ...aksiForm, aspek: e.target.value })}
								>
									<option value="Guru">Guru</option>
									<option value="Siswa">Siswa</option>
									<option value="Sistem">Sistem</option>
									<option value="Kurikulum">Kurikulum</option>
								</select>
							</div>
							<div style={{ marginBottom: "1rem" }}>
								<label className={styles.formLabel}>Temuan Utama</label>
								<textarea
									className={styles.textareaCustom}
									rows={3}
									value={aksiForm.temuan}
									onChange={(e) => setAksiForm({ ...aksiForm, temuan: e.target.value })}
									required
								/>
							</div>
							<div style={{ marginBottom: "1rem" }}>
								<label className={styles.formLabel}>Rencana Aksi</label>
								<textarea
									className={styles.textareaCustom}
									rows={3}
									value={aksiForm.aksi}
									onChange={(e) => setAksiForm({ ...aksiForm, aksi: e.target.value })}
									required
								/>
							</div>
							<div style={{ marginBottom: "1.5rem" }}>
								<label className={styles.formLabel}>Status</label>
								<select
									className={styles.inputField}
									value={aksiForm.status}
									onChange={(e) => setAksiForm({ ...aksiForm, status: e.target.value })}
								>
									<option value="Planning">Planning</option>
									<option value="In Progress">In Progress</option>
									<option value="Completed">Completed</option>
								</select>
							</div>
							<div className={styles.modalFooter}>
								<button type="button" className={styles.btnOutline} onClick={() => setIsAksiModalOpen(false)}>
									Batal
								</button>
								<button type="submit" className={styles.btnPrimaryLg} disabled={isLoading}>
									{isLoading ? "Menyimpan..." : "Simpan Data"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* SIDEBAR */}
			<aside className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<div className={styles.logoWrapper}>
						<img src="/logo.jpg" alt="Logo" className={styles.logoImage} />
					</div>
					<div>
						<div className={styles.schoolName}>SMAN 2 Brebes</div>
						<div className={styles.portalName}>Dashboard Pimpinan</div>
					</div>
				</div>

				<nav className={styles.menuContainer}>
					<Link href="/pimpinan/dashboard" className={styles.menuItem}>
						<LayoutDashboard size={18} /> Dashboard
					</Link>
					<Link href="/pimpinan/kehadiran" className={styles.menuItem}>
						<Users size={18} /> Kehadiran Siswa
					</Link>
					<Link href="/pimpinan/monitoring" className={styles.menuItem}>
						<Clock size={18} /> Monitoring KBM
					</Link>
					<Link href="/pimpinan/jurnal" className={styles.menuItem}>
						<BookOpen size={18} /> Jurnal Mengajar
					</Link>
					<Link href="/pimpinan/report" className={`${styles.menuItem} ${styles.menuItemActive}`}>
						<FileBarChart size={18} /> Laporan Rekapitulasi
					</Link>
					<Link href="/pimpinan/setelan" className={styles.menuItem}>
						<Settings size={18} /> Setelan
					</Link>
				</nav>

				<div className={styles.sidebarFooter}>
					<button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
						<LogOut size={18} /> Keluar
					</button>
				</div>
			</aside>

			<main className={styles.mainContent}>
				<header className={styles.topbar}>
					<div>
						<h1 className={styles.topbarTitle}>E-Journal & Presensi</h1>
					</div>
					<div className={styles.topbarActions}>
						<Bell size={20} className={styles.iconAction} />
						<Settings size={20} className={styles.iconAction} />
						<div className={styles.profileSection}>
							<div className={styles.profileInfo}>
								<span className={styles.profileName}>{user.nama}</span>
								<span className={styles.profileRole}>
									{user.role === "KEPSEK" ? "Kepala Sekolah" : "Wakil Kepala Sekolah"}
								</span>
							</div>
						</div>
					</div>
				</header>

				<div className={styles.dashboardContainer}>
					{/* VIEW 1: SELECTION */}
					{viewMode === "selection" && (
						<div>
							<div className={styles.sectionHeader}>
								<h2 className={styles.sectionTitleBig}>Laporan Rekapitulasi</h2>
								<p className={styles.sectionDate}>
									Pilih periode akademik untuk melihat analisa rekapitulasi PDCA (Plan, Do, Check, Act).
								</p>
							</div>

							<div className={styles.selectionGrid}>
								<div className={styles.filterCol}>
									<div className={styles.filterCard}>
										<h3 className={styles.filterLabel}>Tahun Ajaran</h3>
										<div className={styles.stackButtons}>
											{tahunList.map((tahun) => (
												<button
													key={tahun}
													className={`${styles.selectBtn} ${selectedTahun === tahun ? styles.selectBtnActive : ""}`}
													onClick={() => setSelectedTahun(tahun)}
												>
													{tahun}
												</button>
											))}
										</div>
									</div>
									<div className={styles.filterCard}>
										<h3 className={styles.filterLabel}>Semester</h3>
										<div className={styles.rowButtons}>
											{["Ganjil", "Genap"].map((sem) => (
												<button
													key={sem}
													className={`${styles.selectBtn} ${selectedSemester === sem ? styles.selectBtnActive : ""}`}
													onClick={() => setSelectedSemester(sem)}
												>
													{sem}
												</button>
											))}
										</div>
									</div>
								</div>

								<div className={styles.heroCol}>
									<div className={styles.heroCard}>
										<span className={styles.badgeBlueLight}>📅 Periode Terpilih</span>
										<h1 className={styles.heroTitle}>
											Laporan PDCA Semester {selectedSemester} TA {selectedTahun}
										</h1>
										<div className={styles.heroStatsRow}>
											<div className={styles.heroStatBox}>
												<div className={styles.iconBoxLight}>
													<UsersRound size={20} color="#0f172a" />
												</div>
												<div>
													<div className={styles.statLabelSm}>Total Guru Terlibat</div>
													<div className={styles.statValBig}>{activeData ? activeData.totalGuru : 0}</div>
												</div>
											</div>
											<div className={styles.heroStatBox}>
												<div className={styles.iconBoxLight}>
													<GraduationCap size={20} color="#0f172a" />
												</div>
												<div>
													<div className={styles.statLabelSm}>Total Siswa Dipantau</div>
													<div className={styles.statValBig}>{activeData ? activeData.totalSiswa : 0}</div>
												</div>
											</div>
										</div>

										<button
											className={styles.btnPrimaryLg}
											onClick={() => setViewMode("detail")}
											disabled={!activeData}
										>
											Buka Analisa &rarr;
										</button>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* VIEW 2: DETAIL ANALISA */}
					{viewMode === "detail" && activeData && (
						<div>
							<div className={styles.detailTopbar}>
								<div>
									<button className={styles.btnBack} onClick={() => setViewMode("selection")}>
										<ArrowLeft size={16} />
									</button>
									<div>
										<h2 className={styles.detailTitleMain}>Laporan Rekapitulasi - Analisa PDCA</h2>
										<p className={styles.detailSubText}>
											Semester {selectedSemester} TA {selectedTahun}
										</p>
									</div>
								</div>
								<button className={styles.btnPrint} onClick={() => setIsPdfModalOpen(true)}>
									<Download size={20} /> Ekspor ke PDF
								</button>
							</div>

							<div className={styles.threeGrid}>
								<div className={styles.statCard}>
									<h3 className={styles.cardHeaderTitle}>
										<AlertTriangle size={18} color="#eab308" /> Guru Jam Kosong Terbanyak
									</h3>
									<div className={styles.listWrapper}>
										{activeData.topGuru.length === 0 ? (
											<p style={{ fontSize: "0.875rem", color: "#64748b" }}>Belum ada data terekam.</p>
										) : (
											activeData.topGuru.map((guru: any, idx: number) => (
												<div key={idx} className={styles.listItem}>
													<div className={styles.listNumBlue}>{idx + 1}</div>
													<div className={styles.listTextGroup}>
														<div className={styles.listName}>{guru.nama}</div>
														<div className={styles.listSub}>{guru.mapel}</div>
													</div>
													<div className={styles.listValueRed}>{guru.jamKosong} Jam Kosong</div>
												</div>
											))
										)}
									</div>
								</div>

								<div className={styles.statCard}>
									<h3 className={styles.cardHeaderTitle}>
										<UserX size={18} color="#eab308" /> Absensi Siswa Tertinggi
									</h3>
									<div className={styles.listWrapper}>
										{activeData.topKelas.length === 0 ? (
											<p style={{ fontSize: "0.875rem", color: "#64748b" }}>Belum ada data terekam.</p>
										) : (
											activeData.topKelas.map((kelas: any, idx: number) => (
												<div key={idx} className={styles.listItem}>
													<div className={styles.listCircleGray}>{kelas.nama.split(" ")[0]}</div>
													<div className={styles.listTextGroup}>
														<div className={styles.listName}>Kelas {kelas.nama}</div>
													</div>
													<div className={styles.badgeRedSoft}>{kelas.alpha}% Alpha</div>
												</div>
											))
										)}
									</div>
								</div>

								<div className={styles.statCard}>
									<h3 className={styles.cardHeaderTitle}>
										<PieChart size={18} color="#0f172a" /> Distribusi Kehadiran
									</h3>
									<div className={styles.chartContainer}>
										<div className={styles.donutChart} style={{ background: getGradientString() }}>
											<div className={styles.donutHole}></div>
										</div>
										<div className={styles.legendWrapper}>
											<div className={styles.legendItem}>
												<div className={styles.dotNavy} style={{ backgroundColor: "#10b981" }}></div> Hadir (
												{activeData.distribusi.hadir}%)
											</div>
											<div className={styles.legendItem}>
												<div className={styles.dotYellow} style={{ backgroundColor: "#fef08a" }}></div> Izin (
												{activeData.distribusi.izin}%)
											</div>
											<div className={styles.legendItem}>
												<div className={styles.dotRed} style={{ backgroundColor: "#f59e0b" }}></div> Sakit (
												{activeData.distribusi.sakit}%)
											</div>
											<div className={styles.legendItem}>
												<div className={styles.dotRed} style={{ backgroundColor: "#ef4444" }}></div> Alpha (
												{activeData.distribusi.alpha}%)
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className={styles.fullCard}>
								<div className={styles.chartHeader}>
									<h3 className={styles.cardHeaderTitle}>
										<FileBarChart size={18} /> Tren Kinerja Akademik Bulanan
									</h3>
									<div className={styles.legendWrapperRow}>
										<div className={styles.legendItem}>
											<div className={styles.dotNavy}></div> Kehadiran Siswa
										</div>
										<div className={styles.legendItem}>
											<div className={styles.dotOlive}></div> Pengisian Jurnal
										</div>
									</div>
								</div>
								<div className={styles.barChartContainer}>
									{activeData.trenKinerja.length === 0 ? (
										<p style={{ textAlign: "center", color: "#64748b", margin: "2rem auto" }}>
											Belum ada data jurnal terekam.
										</p>
									) : (
										activeData.trenKinerja.map((data: any, idx: number) => (
											<div key={idx} className={styles.barGroup}>
												<div className={styles.bars}>
													<div
														className={styles.barNavy}
														style={{ height: `${data.pctKehadiran}%` }}
														title={`Kehadiran: ${data.pctKehadiran}%`}
													></div>
													<div
														className={styles.barOlive}
														style={{ height: `${data.pctJurnal}%` }}
														title={`Jurnal: ${data.pctJurnal}%`}
													></div>
												</div>
												<div className={styles.barLabel}>{data.bulan}</div>
											</div>
										))
									)}
								</div>
							</div>

							<div className={styles.bottomGrid}>
								<div className={styles.tableCard}>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "center",
											marginBottom: "1rem",
										}}
									>
										<h3 className={styles.cardHeaderTitle} style={{ margin: 0 }}>
											<BookOpen size={18} /> Rencana & Tindak Lanjut (PDCA)
										</h3>
										<button className={styles.btnOutlineSm} onClick={() => handleOpenAksiModal()}>
											+ Tambah Aksi
										</button>
									</div>

									<table className={styles.pdcaTable}>
										<thead>
											<tr>
												<th>Aspek</th>
												<th>Temuan Utama</th>
												<th>Rencana Aksi</th>
												<th style={{ textAlign: "center" }}>Status</th>
												<th style={{ textAlign: "center" }}>Aksi</th>
											</tr>
										</thead>
										<tbody>
											{activeData.pdca.doImplementasi.length === 0 ? (
												<tr>
													<td colSpan={5} style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
														Belum ada rencana aksi yang ditambahkan.
													</td>
												</tr>
											) : (
												activeData.pdca.doImplementasi.map((row: any, i: number) => (
													<tr key={i}>
														<td className={styles.tdBold}>{row.aspek}</td>
														<td>{row.temuan}</td>
														<td>{row.aksi}</td>
														<td style={{ textAlign: "center" }}>
															<span
																className={
																	row.status === "Completed"
																		? styles.badgeGreenRounded
																		: row.status === "In Progress"
																			? styles.badgeYellowRounded
																			: styles.badgeRedRounded
																}
															>
																{row.status}
															</span>
														</td>
														<td style={{ textAlign: "center" }}>
															<button className={styles.btnIconGhost} onClick={() => handleOpenAksiModal(row)}>
																<Edit size={16} />
															</button>
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>

								<div className={styles.recommendationBox}>
									<h3 className={styles.recomTitle}>
										<Lightbulb size={18} color="#facc15" /> Analisa & Rekomendasi Kepala Sekolah
									</h3>
									<div className={styles.recomText}>
										{activeData.pdca.actRekomendasi ? (
											activeData.pdca.actRekomendasi
												.split("\n")
												.map((paragraph: string, i: number) => <p key={i}>{paragraph}</p>)
										) : (
											<p>Belum ada rekomendasi.</p>
										)}
									</div>
									<button className={styles.btnUpdate} onClick={handleOpenRecomModal}>
										<Edit3 size={16} /> Update Catatan
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
