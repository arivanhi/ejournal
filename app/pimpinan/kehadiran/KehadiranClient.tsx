// app/pimpinan/kehadiran/KehadiranClient.tsx
"use client";

import { useState, useEffect } from "react";
import {
	LayoutDashboard,
	Users,
	Clock,
	BookOpen,
	FileBarChart,
	Bell,
	Settings,
	LogOut,
	ArrowRight,
	ArrowLeft,
	Search,
	Download,
	UsersRound,
	BarChart3,
	CheckCircle2,
	AlertTriangle,
	AlertCircle,
	FileSpreadsheet,
	FileText,
	X,
	Check,
} from "lucide-react";
import styles from "./kehadiran.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";
import * as XLSX from "xlsx";

export default function KehadiranClient({ user, tahunAjaran, dataKelas }: any) {
	const [viewMode, setViewMode] = useState<"list" | "detail">("list");
	const [selectedKelas, setSelectedKelas] = useState<any>(null);
	const [activeTab, setActiveTab] = useState<"presensi" | "jadwal">("presensi");
	const [searchTermCard, setSearchTermCard] = useState("");
	const [searchSiswa, setSearchSiswa] = useState("");

	const [currentPage, setCurrentPage] = useState(1);
	const cardsPerPage = 6;

	// State Download Single Kelas (dari halaman Detail)
	const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

	// State Download Multi Kelas (dari halaman List)
	const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
	const [selectedExportClasses, setSelectedExportClasses] = useState<string[]>([]);

	// State PDF
	const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
	const [pdfClasses, setPdfClasses] = useState<any[]>([]); // Data kelas yang sedang di-render ke PDF
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const HARI_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const handleLihatDetail = (kelas: any) => {
		setSelectedKelas(kelas);
		setActiveTab("presensi");
		setViewMode("detail");
		setSearchSiswa("");
	};

	const filteredKelas = dataKelas.filter((k: any) => k.nama.toLowerCase().includes(searchTermCard.toLowerCase()));
	const totalPages = Math.max(1, Math.ceil(filteredKelas.length / cardsPerPage));
	const paginatedKelas = filteredKelas.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

	const filteredSiswa =
		selectedKelas?.siswaList?.filter(
			(s: any) =>
				s.nama.toLowerCase().includes(searchSiswa.toLowerCase()) ||
				s.nisn.toLowerCase().includes(searchSiswa.toLowerCase()),
		) || [];

	// --- FUNGSI TOGGLE CHECKBOX MULTI EXPORT ---
	const handleToggleClassExport = (kelasId: string) => {
		setSelectedExportClasses((prev) =>
			prev.includes(kelasId) ? prev.filter((id) => id !== kelasId) : [...prev, kelasId],
		);
	};

	const handleToggleAllExport = () => {
		if (selectedExportClasses.length === dataKelas.length) {
			setSelectedExportClasses([]);
		} else {
			setSelectedExportClasses(dataKelas.map((k: any) => k.id));
		}
	};

	// --- FUNGSI EXPORT EXCEL (Single Class) ---
	const exportToExcel = () => {
		const excelData = filteredSiswa.map((siswa: any, index: number) => ({
			NO: index + 1,
			"NAMA SISWA": siswa.nama,
			NIS: siswa.nisn || "-",
			HADIR: siswa.detailKehadiran.H,
			SAKIT: siswa.detailKehadiran.S,
			IZIN: siswa.detailKehadiran.I,
			ALPA: siswa.detailKehadiran.A,
			"TOTAL SESI": siswa.totalSesi,
			"% HADIR": `${siswa.persentase}%`,
			"STATUS HARI INI":
				siswa.statusHariIni === "H"
					? "Hadir"
					: siswa.statusHariIni === "S"
						? "Sakit"
						: siswa.statusHariIni === "I"
							? "Izin"
							: siswa.statusHariIni === "A"
								? "Alpa"
								: "Belum Ada",
		}));

		const ws = XLSX.utils.json_to_sheet(excelData);
		ws["!cols"] = [
			{ wch: 5 },
			{ wch: 30 },
			{ wch: 15 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 12 },
			{ wch: 10 },
			{ wch: 20 },
		];

		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, `Presensi ${selectedKelas.nama}`);
		XLSX.writeFile(wb, `Presensi_Kelas_${selectedKelas.nama.replace(/\s+/g, "_")}.xlsx`);

		setIsDownloadModalOpen(false);
		showToast("File Excel berhasil diunduh!");
	};

	// --- FUNGSI MASTER EXPORT PDF (Mendukung Multi-Class & Cover) ---
	const executePdfExport = async (classesToExport: any[], filename: string) => {
		if (classesToExport.length === 0) {
			showToast("Pilih setidaknya satu kelas untuk diekspor.");
			return;
		}

		setIsDownloadingPdf(true);
		setPdfClasses(classesToExport); // Memasukkan data ke Hidden DIV

		// Beri waktu bagi React untuk me-render hidden div dengan data kelas yang baru
		setTimeout(async () => {
			try {
				const html2pdf = (await import("html2pdf.js")).default;
				const element = document.getElementById("pdf-kehadiran-content");

				const opt = {
					margin: 10,
					filename: filename,
					image: { type: "jpeg", quality: 1 },
					html2canvas: { scale: 2, useCORS: true },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
					pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' }
				};

				await html2pdf().set(opt).from(element).save();
				showToast("PDF berhasil diunduh!");
			} catch (error) {
				console.error("Gagal men-generate PDF:", error);
				showToast("Terjadi kesalahan saat memproses PDF!");
			} finally {
				setIsDownloadingPdf(false);
				setIsDownloadModalOpen(false);
				setIsBulkExportModalOpen(false);
				setPdfClasses([]); // Bersihkan DOM setelah selesai
			}
		}, 800); // Jeda 800ms agar aman merender halaman yang panjang
	};

	return (
		<>
			{/* --- CONTAINER TERSEMBUNYI UNTUK CETAK PDF MULTI-KELAS --- */}
			{pdfClasses.length > 0 && (
				<div style={{ display: "none" }}>
					<div id="pdf-kehadiran-content" className={styles.pdfA4Container}>
						{pdfClasses.map((kelasData, index) => (
							<div key={kelasData.id}>
								{/* HALAMAN COVER */}
								<div
									className={styles.pdfCover}
									style={{
										height: "240mm",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
										alignItems: "center",
									}}
								>
									<h2 style={{ fontSize: "18pt", fontWeight: 800, marginBottom: "0.5rem" }}>REKAP KEHADIRAN SISWA</h2>
									<h1
										style={{
											fontSize: "24pt",
											fontWeight: 900,
											color: "#0a2540",
											marginBottom: "0.5rem",
											textTransform: "uppercase",
										}}
									>
										KELAS {kelasData.nama}
									</h1>
									<p style={{ fontSize: "12pt", fontWeight: 600 }}>Tahun Ajaran {tahunAjaran?.nama || "Aktif"}</p>

									<div style={{ margin: "4rem 0", display: "flex", justifyContent: "center" }}>
										<img
											src="/logo.jpg"
											alt="Logo SMAN 2 Brebes"
											style={{ width: "160px", height: "160px", objectFit: "contain" }}
										/>
									</div>

									<div style={{ textAlign: "center" }}>
										<p style={{ fontSize: "11pt", marginBottom: "0.5rem" }}>
											<strong>WALI KELAS:</strong>
										</p>
										<p style={{ fontSize: "14pt", fontWeight: 700, color: "#0a2540" }}>{kelasData.waliKelas}</p>
										<p style={{ fontSize: "11pt", marginTop: "0.5rem" }}>NPP: {kelasData.waliKelasNpp}</p>
									</div>

									<div
										style={{
											marginTop: "4rem",
											textAlign: "center",
											borderTop: "2px solid #0a2540",
											paddingTop: "1.5rem",
											width: "70%",
											margin: "4rem auto 0 auto",
										}}
									>
										<p style={{ fontSize: "12pt", fontWeight: "bold" }}>SMA NEGERI 2 BREBES</p>
									</div>
								</div>

								<div className="html2pdf__page-break"></div>

								{/* HALAMAN KONTEN DATA */}
								<div
									style={{
										position: "relative",
										textAlign: "center",
										borderBottom: "3px solid #000",
										paddingBottom: "15px",
										marginBottom: "15px",
										paddingTop: "10px",
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
									<p style={{ margin: "2px 0", fontSize: "11pt" }}>
										Jl. Jend. A. Yani 77 Brebes 52212 Telp. (0283) 671060
									</p>
									<p style={{ margin: 0, fontSize: "11pt" }}>
										Website: sman2brebes.sch.id - Email: smandabes@gmail.com
									</p>
								</div>

								<div className={styles.pdfContent}>
									<h3 className={styles.pdfSectionTitle}>A. JADWAL PELAJARAN MINGGUAN ({kelasData.nama})</h3>
									<div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "2rem" }}>
										{[1, 2, 3, 4, 5].map((hariIdx) => {
											const jadwalHariIni = kelasData.jadwalMingguan.filter((j: any) => j.hari === hariIdx);
											return (
												<div
													key={hariIdx}
													style={{ flex: 1, minWidth: "0", border: "1px solid #000", padding: "10px" }}
												>
													<h4
														style={{
															textAlign: "center",
															borderBottom: "1px solid #000",
															margin: "0 0 10px 0",
															paddingBottom: "5px",
															fontSize: "10pt",
														}}
													>
														{HARI_MAP[hariIdx]}
													</h4>
													{jadwalHariIni.length === 0 ? (
														<div style={{ textAlign: "center", color: "#64748b", fontSize: "8pt" }}>Kosong</div>
													) : (
														jadwalHariIni.map((jadwal: any) => (
															<div
																key={jadwal.id}
																style={{
																	marginBottom: "10px",
																	fontSize: "8pt",
																	backgroundColor: "#f1f5f9",
																	padding: "5px",
																	borderRadius: "4px",
																	border: "1px solid #e2e8f0",
																}}
															>
																<div style={{ fontWeight: "bold" }}>Jam ke {jadwal.jamStr}</div>
																<div style={{ margin: "2px 0" }}>{jadwal.mapel}</div>
																<div style={{ color: "#475569" }}>{jadwal.guruNama}</div>
															</div>
														))
													)}
												</div>
											);
										})}
									</div>

									<h3 className={styles.pdfSectionTitle}>B. REKAPITULASI PRESENSI SISWA ({kelasData.nama})</h3>
									<table className={styles.pdfTable}>
										<thead>
											<tr>
												<th rowSpan={2} style={{ width: "5%" }}>
													No
												</th>
												<th rowSpan={2} style={{ width: "35%" }}>
													Nama Siswa
												</th>
												<th rowSpan={2} style={{ width: "15%" }}>
													NIS
												</th>
												<th colSpan={4} style={{ textAlign: "center" }}>
													Rekap Presensi
												</th>
												<th rowSpan={2} style={{ width: "10%", textAlign: "center" }}>
													% Hadir
												</th>
											</tr>
											<tr>
												<th style={{ width: "7%", textAlign: "center", color: "#10b981" }}>H</th>
												<th style={{ width: "7%", textAlign: "center", color: "#d97706" }}>S</th>
												<th style={{ width: "7%", textAlign: "center", color: "#d97706" }}>I</th>
												<th style={{ width: "7%", textAlign: "center", color: "#ef4444" }}>A</th>
											</tr>
										</thead>
										<tbody>
											{kelasData.siswaList?.length === 0 ? (
												<tr>
													<td colSpan={8} style={{ textAlign: "center", padding: "1rem" }}>
														Tidak ada data siswa.
													</td>
												</tr>
											) : (
												kelasData.siswaList?.map((siswa: any, sIndex: number) => (
													<tr key={siswa.id}>
														<td style={{ textAlign: "center" }}>{sIndex + 1}</td>
														<td>{siswa.nama}</td>
														<td style={{ textAlign: "center" }}>{siswa.nisn || "-"}</td>
														<td style={{ textAlign: "center" }}>{siswa.detailKehadiran.H}</td>
														<td style={{ textAlign: "center" }}>{siswa.detailKehadiran.S}</td>
														<td style={{ textAlign: "center" }}>{siswa.detailKehadiran.I}</td>
														<td style={{ textAlign: "center" }}>{siswa.detailKehadiran.A}</td>
														<td style={{ textAlign: "center", fontWeight: "bold" }}>{siswa.persentase}%</td>
													</tr>
												))
											)}
										</tbody>
									</table>

									<div style={{ textAlign: "right", marginTop: "3rem", paddingBottom: "2rem" }}>
										<p>
											Brebes,{" "}
											{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
										</p>
										<p style={{ marginBottom: "4rem" }}>
											Mengetahui,
											<br />
											{user.role === "KEPSEK" ? "Kepala Sekolah" : "Wakil Kepala Sekolah"} SMAN 2 Brebes
										</p>
										<p>
											<strong>{user.nama}</strong>
										</p>
										<p>NIP/NPP: {user.username || "-"}</p>
									</div>
								</div>

								{/* Tambahkan Page Break JIKA BUKAN KELAS TERAKHIR */}
								{index < pdfClasses.length - 1 && <div className="html2pdf__page-break"></div>}
							</div>
						))}
					</div>
				</div>
			)}

			{toastMessage && (
				<div className={styles.toastContainer}>
					<div className={styles.toastIcon}>
						<Check size={16} />
					</div>
					<span className={styles.toastText}>{toastMessage}</span>
				</div>
			)}

			{/* MODAL UNDUH MULTI-KELAS (Dari Halaman List) */}
			{isBulkExportModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Ekspor Rekap Kehadiran</h3>
							<button className={styles.modalCloseBtn} onClick={() => setIsBulkExportModalOpen(false)}>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
								Pilih kelas yang ingin disertakan dalam satu file PDF:
							</p>

							{/* Checkbox Pilihan Kelas */}
							<div
								style={{
									border: "1px solid #e2e8f0",
									borderRadius: "0.5rem",
									maxHeight: "250px",
									overflowY: "auto",
									padding: "0.5rem",
									marginBottom: "1.5rem",
								}}
							>
								<label
									style={{
										display: "flex",
										alignItems: "center",
										padding: "0.5rem",
										cursor: "pointer",
										borderBottom: "1px solid #f1f5f9",
									}}
								>
									<input
										type="checkbox"
										checked={selectedExportClasses.length === dataKelas.length}
										onChange={handleToggleAllExport}
										style={{ marginRight: "0.75rem", width: "16px", height: "16px" }}
									/>
									<span style={{ fontWeight: 600 }}>Pilih Semua Kelas</span>
								</label>
								{dataKelas.map((kelas: any) => (
									<label
										key={kelas.id}
										style={{ display: "flex", alignItems: "center", padding: "0.5rem", cursor: "pointer" }}
									>
										<input
											type="checkbox"
											checked={selectedExportClasses.includes(kelas.id)}
											onChange={() => handleToggleClassExport(kelas.id)}
											style={{ marginRight: "0.75rem", width: "16px", height: "16px" }}
										/>
										<span>{kelas.nama}</span>
									</label>
								))}
							</div>

							<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
								<button className={styles.btnOutline} onClick={() => setIsBulkExportModalOpen(false)}>
									Batal
								</button>
								<button
									className={styles.btnPrimaryDark}
									disabled={isDownloadingPdf || selectedExportClasses.length === 0}
									onClick={() => {
										const classesToExport = dataKelas.filter((k: any) => selectedExportClasses.includes(k.id));
										executePdfExport(classesToExport, `Rekap_Kehadiran_Multi_Kelas.pdf`);
									}}
								>
									{isDownloadingPdf ? "Memproses PDF..." : "Unduh PDF"}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* MODAL UNDUH SINGLE KELAS (Dari Halaman Detail) */}
			{isDownloadModalOpen && selectedKelas && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Ekspor Data Presensi</h3>
							<button className={styles.modalCloseBtn} onClick={() => setIsDownloadModalOpen(false)}>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.5rem", textAlign: "center" }}>
								Pilih format dokumen untuk daftar presensi kelas <strong>{selectedKelas.nama}</strong>:
							</p>
							<div className={styles.exportOptions}>
								<div className={styles.btnExportCard} onClick={exportToExcel}>
									<FileSpreadsheet size={40} color="#16a34a" />
									<span className={styles.exportCardTitle}>Excel (.xlsx)</span>
								</div>
								<button
									className={styles.btnExportCard}
									onClick={() =>
										executePdfExport([selectedKelas], `Rekap_Kehadiran_${selectedKelas.nama.replace(/\s+/g, "_")}.pdf`)
									}
									disabled={isDownloadingPdf}
								>
									<FileText size={40} color="#ef4444" />
									<span className={styles.exportCardTitle}>{isDownloadingPdf ? "Memproses..." : "PDF (.pdf)"}</span>
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* === SIDEBAR === */}
			

			{/* === MAIN CONTENT === */}
			<>
				

				<div className={styles.dashboardContainer}>
					{/* HALAMAN LIST KELAS */}
					{viewMode === "list" && (
						<div>
							<div className={styles.sectionHeader}>
								<div>
									<h2 className={styles.sectionTitle}>Kehadiran Siswa - Ringkasan Kelas</h2>
									<p className={styles.sectionDate}>
										{tahunAjaran ? `Tahun Ajaran ${tahunAjaran.nama}` : "Tahun Ajaran Aktif"}
									</p>
								</div>
								<div className={styles.headerButtons}>
									<div className={styles.searchBoxCard}>
										<Search size={16} className={styles.searchIcon} />
										<input
											type="text"
											placeholder="Cari Kelas..."
											className={styles.searchInput}
											value={searchTermCard}
											onChange={(e) => {
												setSearchTermCard(e.target.value);
												setCurrentPage(1);
											}}
										/>
									</div>
									<button className={styles.btnOutline}>Semua Tingkat</button>

									{/* TOMBOL BARU EXPORT MULTI KELAS */}
									<button
										className={styles.btnPrimaryDark}
										onClick={() => {
											setIsBulkExportModalOpen(true);
											setSelectedExportClasses(dataKelas.map((k: any) => k.id)); // Default Pilih Semua
										}}
									>
										<Download size={16} /> Ekspor PDF (Semua Kelas)
									</button>
								</div>
							</div>

							<div className={styles.gridCards}>
								{paginatedKelas.map((kelas: any) => (
									<div key={kelas.id} className={styles.classCard}>
										<div className={styles.cardTopRow}>
											<h3 className={styles.cardTitle}>{kelas.nama}</h3>
											{kelas.statusCard === "Terekap" && (
												<span className={styles.badgeSuccess}>
													<CheckCircle2 size={12} /> Terekap
												</span>
											)}
											{kelas.statusCard === "Proses" && (
												<span className={styles.badgeWarning}>
													<AlertCircle size={12} /> Proses
												</span>
											)}
											{kelas.statusCard === "Belum" && (
												<span className={styles.badgeDanger}>
													<AlertTriangle size={12} /> Belum
												</span>
											)}
											{kelas.statusCard === "Libur/Kosong" && (
												<span className={styles.badgeNeutral}>Tidak Ada Jadwal</span>
											)}
										</div>
										<p className={styles.waliText}>Wali: {kelas.waliKelas}</p>

										<div className={styles.progressSection}>
											<div className={styles.progressHeader}>
												<span>Kehadiran Hari Ini</span>
												<span style={{ fontWeight: 800, color: "#0f172a" }}>{kelas.kehadiranHariIni.persentase}%</span>
											</div>
											<div className={styles.progressTrack}>
												<div
													className={styles.progressBarYellow}
													style={{
														width: `${kelas.kehadiranHariIni.persentase}%`,
														backgroundColor: kelas.kehadiranHariIni.persentase >= 90 ? "#10b981" : "#f59e0b",
													}}
												></div>
											</div>
										</div>

										<div className={styles.statBoxes}>
											<div className={styles.statBox}>
												<span className={styles.statLabel}>Total</span>
												<span className={styles.statValDark}>{kelas.totalSiswa}</span>
											</div>
											<div className={styles.statBox}>
												<span className={styles.statLabel}>Hadir</span>
												<span className={styles.statValGreen}>{kelas.kehadiranHariIni.H}</span>
											</div>
											<div className={styles.statBox}>
												<span className={styles.statLabel}>Alfa</span>
												<span className={styles.statValRed}>{kelas.kehadiranHariIni.A}</span>
											</div>
											<div className={styles.statBox}>
												<span className={styles.statLabel}>I/S</span>
												<span className={styles.statValYellow}>{kelas.kehadiranHariIni.IS}</span>
											</div>
										</div>

										<button className={styles.btnPrimaryFull} onClick={() => handleLihatDetail(kelas)}>
											Lihat Detail <ArrowRight size={16} />
										</button>
									</div>
								))}
							</div>

							{totalPages > 1 && (
								<div className={styles.paginationCenter}>
									<div className={styles.pageButtons}>
										<button
											className={styles.pageBtn}
											disabled={currentPage === 1}
											onClick={() => setCurrentPage((p) => p - 1)}
										>
											&lt; Prev
										</button>
										<span className={styles.pageIndicator}>
											Halaman {currentPage} dari {totalPages}
										</span>
										<button
											className={styles.pageBtn}
											disabled={currentPage === totalPages}
											onClick={() => setCurrentPage((p) => p + 1)}
										>
											Next &gt;
										</button>
									</div>
								</div>
							)}
						</div>
					)}

					{/* HALAMAN DETAIL KELAS */}
					{viewMode === "detail" && selectedKelas && (
						<div>
							<button className={styles.btnBack} onClick={() => setViewMode("list")}>
								<ArrowLeft size={16} /> Kembali ke Ringkasan Kelas
							</button>

							<div className={styles.sectionHeader} style={{ marginTop: "1rem" }}>
								<div>
									<h2 className={styles.detailTitleBig}>Detail Kehadiran Kelas {selectedKelas.nama}</h2>
									<p className={styles.sectionDate}>
										Kelola daftar kehadiran dan jadwal pelajaran kelas secara detail.
									</p>
								</div>
							</div>

							<div className={styles.detailInfoGrid}>
								<div className={styles.infoCard}>
									<div className={styles.infoAvatarInitials}>{selectedKelas.waliKelasInitials}</div>
									<div>
										<div className={styles.infoLabel}>Wali Kelas</div>
										<div className={styles.infoName}>{selectedKelas.waliKelas}</div>
										<div className={styles.infoSub}>NPP: {selectedKelas.waliKelasNpp}</div>
									</div>
								</div>
								<div className={styles.infoCardRow}>
									<div>
										<div className={styles.infoLabel}>Total Siswa</div>
										<div className={styles.infoValBox}>
											<span className={styles.infoValLarge}>{selectedKelas.totalSiswa}</span>
											<span className={styles.infoValUnit}>Siswa</span>
										</div>
									</div>
									<div className={styles.iconBoxGray}>
										<UsersRound size={24} color="#64748b" />
									</div>
								</div>
								<div className={styles.infoCardRow}>
									<div>
										<div className={styles.infoLabel}>Rata-rata Kehadiran</div>
										<div className={styles.infoValBox}>
											<span className={styles.infoValLargeYellow}>{selectedKelas.rataRataKelas}%</span>
											<span className={styles.infoValUnit}>Semester Ini</span>
										</div>
									</div>
									<div className={styles.iconBoxYellow}>
										<BarChart3 size={24} color="#ca8a04" />
									</div>
								</div>
							</div>

							<div className={styles.tabsWrapper}>
								<div className={styles.tabHeader}>
									<button
										className={`${styles.tabBtn} ${activeTab === "presensi" ? styles.tabActive : ""}`}
										onClick={() => setActiveTab("presensi")}
									>
										Daftar Presensi Siswa
									</button>
									<button
										className={`${styles.tabBtn} ${activeTab === "jadwal" ? styles.tabActive : ""}`}
										onClick={() => setActiveTab("jadwal")}
									>
										Jadwal & Guru
									</button>
								</div>

								<div className={styles.tabContent}>
									{activeTab === "presensi" && (
										<div>
											<div className={styles.tableToolbar}>
												<div className={styles.searchBoxCard} style={{ flex: 1, maxWidth: "400px" }}>
													<Search size={16} className={styles.searchIcon} />
													<input
														type="text"
														placeholder="Cari nama atau NIS..."
														className={styles.searchInput}
														value={searchSiswa}
														onChange={(e) => setSearchSiswa(e.target.value)}
													/>
												</div>
												<div style={{ display: "flex", gap: "1rem" }}>
													<button className={styles.btnOutline}>Semua Status</button>
													<button className={styles.btnPrimaryDark} onClick={() => setIsDownloadModalOpen(true)}>
														<Download size={16} /> Export
													</button>
												</div>
											</div>

											<div className={styles.tableWrapper}>
												<div style={{ overflowX: "auto", width: "100%" }}>
<table className={styles.dataTable}>
													<thead>
														<tr>
															<th>NO</th>
															<th>NAMA SISWA</th>
															<th>NIS</th>
															<th
																colSpan={4}
																style={{
																	textAlign: "center",
																	borderLeft: "1px solid #f1f5f9",
																	borderRight: "1px solid #f1f5f9",
																}}
															>
																REKAP PRESENSI
															</th>
															<th style={{ textAlign: "center" }}>% HADIR</th>
															<th>STATUS HARI INI</th>
														</tr>
														<tr>
															<th></th>
															<th></th>
															<th></th>
															<th style={{ textAlign: "center", color: "#10b981" }}>H</th>
															<th style={{ textAlign: "center", color: "#d97706" }}>S</th>
															<th style={{ textAlign: "center", color: "#d97706" }}>I</th>
															<th style={{ textAlign: "center", color: "#ef4444", borderRight: "1px solid #f1f5f9" }}>
																A
															</th>
															<th></th>
															<th></th>
														</tr>
													</thead>
													<tbody>
														{filteredSiswa.length === 0 ? (
															<tr>
																<td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
																	Tidak ada siswa yang cocok dengan pencarian.
																</td>
															</tr>
														) : (
															filteredSiswa.map((siswa: any, index: number) => {
																let statusBadge = <span className={styles.badgeNeutral}>Belum Ada</span>;
																if (siswa.statusHariIni === "H")
																	statusBadge = <span className={styles.badgeGreenLight}>Hadir</span>;
																if (siswa.statusHariIni === "S")
																	statusBadge = <span className={styles.badgeYellowLight}>Sakit</span>;
																if (siswa.statusHariIni === "I")
																	statusBadge = <span className={styles.badgeYellowLight}>Izin</span>;
																if (siswa.statusHariIni === "A")
																	statusBadge = <span className={styles.badgeRedLight}>Alpa</span>;

																return (
																	<tr key={siswa.id}>
																		<td>{index + 1}</td>
																		<td style={{ fontWeight: 600, color: "#0f172a" }}>{siswa.nama}</td>
																		<td style={{ color: "#64748b" }}>{siswa.nisn || "-"}</td>
																		<td
																			style={{
																				textAlign: "center",
																				fontWeight: 700,
																				color: "#10b981",
																				backgroundColor: "#f8fafc",
																			}}
																		>
																			{siswa.detailKehadiran.H}
																		</td>
																		<td
																			style={{
																				textAlign: "center",
																				fontWeight: 700,
																				color: "#d97706",
																				backgroundColor: "#f8fafc",
																			}}
																		>
																			{siswa.detailKehadiran.S}
																		</td>
																		<td
																			style={{
																				textAlign: "center",
																				fontWeight: 700,
																				color: "#d97706",
																				backgroundColor: "#f8fafc",
																			}}
																		>
																			{siswa.detailKehadiran.I}
																		</td>
																		<td
																			style={{
																				textAlign: "center",
																				fontWeight: 700,
																				color: "#ef4444",
																				backgroundColor: "#f8fafc",
																				borderRight: "1px solid #f1f5f9",
																			}}
																		>
																			{siswa.detailKehadiran.A}
																		</td>
																		<td style={{ textAlign: "center", fontWeight: 600 }}>{siswa.persentase}%</td>
																		<td>{statusBadge}</td>
																	</tr>
																);
															})
														)}
													</tbody>
												</table>
</div>
											</div>
										</div>
									)}

									{activeTab === "jadwal" && (
										<div>
											<div className={styles.jadwalHeaderRow}>
												<h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
													Jadwal Pelajaran Mingguan
												</h3>
												<span className={styles.badgeGrayRounded}>Tahun Ajaran {tahunAjaran?.nama}</span>
											</div>
											<div className={styles.weeklyGrid}>
												{[1, 2, 3, 4, 5].map((hariIdx) => {
													const jadwalHariIni = selectedKelas.jadwalMingguan.filter((j: any) => j.hari === hariIdx);
													return (
														<div key={hariIdx} className={styles.dayColumn}>
															<div className={styles.dayHeader}>{HARI_MAP[hariIdx]}</div>
															<div className={styles.dayCards}>
																{jadwalHariIni.length === 0 ? (
																	<div className={styles.emptyJadwal}>Kosong</div>
																) : (
																	jadwalHariIni.map((jadwal: any) => (
																		<div key={jadwal.id} className={styles.scheduleCard}>
																			<div className={styles.scheduleTime}>Jam ke {jadwal.jamStr}</div>
																			<div className={styles.scheduleMapel}>{jadwal.mapel}</div>
																			<div className={styles.scheduleGuru}>
																				<div className={styles.guruInitialsSmall}>{jadwal.guruInitials}</div>
																				<span className={styles.guruNameText}>{jadwal.guruNama}</span>
																			</div>
																		</div>
																	))
																)}
															</div>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</>
		</>
	);
}
