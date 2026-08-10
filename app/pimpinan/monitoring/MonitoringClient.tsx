// app/pimpinan/monitoring/MonitoringClient.tsx
"use client";

import { useState, useEffect } from "react";
import {
	LayoutDashboard,
	Users,
	Clock,
	BookOpen,
	FileBarChart,
	Settings,
	LogOut,
	Search,
	Filter,
	ArrowLeft,
	CheckCircle2,
	AlertTriangle,
	Calculator,
	Microscope,
	Globe,
	FlaskConical,
	Bell,
	Building,
	User,
	Download,
	X,
	Printer,
	FileText,
	Check,
} from "lucide-react";
import styles from "./monitoring.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function MonitoringClient({ user, dataMonitoring }: any) {
	const [viewMode, setViewMode] = useState<"list" | "detail">("list");
	const [selectedItem, setSelectedItem] = useState<any>(null);

	const [searchTerm, setSearchTerm] = useState("");
	const [currentCardPage, setCurrentCardPage] = useState(1);
	const cardsPerPage = 6;

	const [searchTopik, setSearchTopik] = useState("");
	const [sortConfig, setSortConfig] = useState({ key: "pertemuanKe", direction: "asc" });
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	// State Modal PDF (Single)
	const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

	// State Modal PDF (Bulk Export per Guru)
	const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
	const [selectedExportGurus, setSelectedExportGurus] = useState<string[]>([]);

	const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
	const [pdfGurusData, setPdfGurusData] = useState<any[]>([]); // Data pengelompokan per guru untuk PDF
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	useEffect(() => {
		setCurrentCardPage(1);
	}, [searchTerm]);

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const handleLihatDetail = (item: any) => {
		setSelectedItem(item);
		setSearchTopik("");
		setCurrentPage(1);
		setSortConfig({ key: "pertemuanKe", direction: "asc" });
		setViewMode("detail");
	};

	const handleSort = (key: string) => {
		let direction = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
		setSortConfig({ key, direction });
	};

	const filteredData = dataMonitoring.filter(
		(item: any) =>
			item.mapelNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.guruNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.kelasNama.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const totalCardPages = Math.max(1, Math.ceil(filteredData.length / cardsPerPage));
	const paginatedCards = filteredData.slice((currentCardPage - 1) * cardsPerPage, currentCardPage * cardsPerPage);

	const processedRiwayat = [...(selectedItem?.riwayat || [])]
		.filter((row: any) => row.topik.toLowerCase().includes(searchTopik.toLowerCase()))
		.sort((a: any, b: any) => {
			if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
			if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});

	const paginatedRiwayat = processedRiwayat.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
	const totalPages = Math.max(1, Math.ceil(processedRiwayat.length / itemsPerPage));

	const getMapelIcon = (mapelNama: string) => {
		const name = mapelNama.toLowerCase();
		if (name.includes("matematika")) return <Calculator size={20} color="#64748b" />;
		if (name.includes("biologi")) return <Microscope size={20} color="#64748b" />;
		if (name.includes("inggris")) return <Globe size={20} color="#64748b" />;
		if (name.includes("fisika") || name.includes("kimia")) return <FlaskConical size={20} color="#64748b" />;
		return <BookOpen size={20} color="#64748b" />;
	};

	const renderSortIcon = (columnName: string) => {
		if (sortConfig.key === columnName) return sortConfig.direction === "asc" ? " ↑" : " ↓";
		return "";
	};

	// --- LOGIKA BULK EXPORT PER GURU ---
	// Ekstrak daftar nama guru yang unik
	const uniqueGurus = Array.from(new Set(dataMonitoring.map((item: any) => item.guruNama))).sort() as string[];

	const handleToggleGuruExport = (guruName: string) => {
		setSelectedExportGurus((prev) =>
			prev.includes(guruName) ? prev.filter((name) => name !== guruName) : [...prev, guruName],
		);
	};

	const handleToggleAllGurus = () => {
		if (selectedExportGurus.length === uniqueGurus.length) {
			setSelectedExportGurus([]);
		} else {
			setSelectedExportGurus([...uniqueGurus]);
		}
	};

	// --- FUNGSI EXPORT PDF SINGLE (DARI DETAIL) ---
	const exportToPDF = async () => {
		setIsDownloadingPdf(true);
		try {
			const html2pdf = (await import("html2pdf.js")).default;
			const element = document.getElementById("pdf-monitoring-single");

			const opt = {
				margin: 0,
				filename: `Rekap_KBM_${selectedItem.mapelNama.replace(/\s+/g, "_")}_${selectedItem.kelasNama.replace(/\s+/g, "_")}.pdf`,
				image: { type: "jpeg", quality: 1 },
				html2canvas: { scale: 2, useCORS: true },
				jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
			};

			await html2pdf().set(opt).from(element).save();
			showToast("PDF berhasil diunduh!");
		} catch (error) {
			console.error("Gagal men-generate PDF:", error);
			showToast("Terjadi kesalahan saat memproses PDF!");
		} finally {
			setIsDownloadingPdf(false);
			setIsPdfModalOpen(false);
		}
	};

	// --- FUNGSI EXPORT PDF MULTI GURU ---
	const executeBulkPdfExport = async () => {
		if (selectedExportGurus.length === 0) {
			showToast("Pilih setidaknya satu guru untuk diekspor.");
			return;
		}

		setIsDownloadingPdf(true);

		// Kelompokkan data KBM berdasarkan Guru yang dipilih
		const groupedData = selectedExportGurus.map((guruName) => {
			const itemsGuru = dataMonitoring.filter((item: any) => item.guruNama === guruName);
			return {
				guruNama: guruName,
				guruNpp: itemsGuru[0]?.guruNpp || "-",
				tahunAjaranNama: itemsGuru[0]?.tahunAjaranNama || "-",
				items: itemsGuru, // Daftar kelas dan mapel yang diajar
			};
		});

		setPdfGurusData(groupedData);

		setTimeout(async () => {
			try {
				const html2pdf = (await import("html2pdf.js")).default;
				const element = document.getElementById("pdf-monitoring-bulk");

				const opt = {
					margin: 0,
					filename: `Rekap_KBM_Multi_Guru.pdf`,
					image: { type: "jpeg", quality: 1 },
					html2canvas: { scale: 2, useCORS: true },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
				};

				await html2pdf().set(opt).from(element).save();
				showToast("PDF berhasil diunduh!");
			} catch (error) {
				console.error("Gagal men-generate PDF:", error);
				showToast("Terjadi kesalahan saat memproses PDF!");
			} finally {
				setIsDownloadingPdf(false);
				setIsBulkExportModalOpen(false);
				setPdfGurusData([]);
			}
		}, 800);
	};

	// KOMPONEN KOP SURAT
	const pdfHeader = (
		<div
			style={{
				position: "relative",
				textAlign: "center",
				borderBottom: "3px solid #000",
				paddingBottom: "15px",
				marginBottom: "20px",
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
					fontSize: "16pt",
					fontWeight: "bold",
					color: "#000",
					fontFamily: '"Times New Roman", Times, serif',
				}}
			>
				SMA NEGERI 2 BREBES
			</h1>
			<p style={{ margin: "2px 0", fontSize: "10pt" }}>Jl. Jend. A. Yani 77 Brebes 52212 Telp. (0283) 671060</p>
			<p style={{ margin: 0, fontSize: "10pt" }}>Website: www.sman2-brebes.sch.id - Email: smadabes@ymail.com</p>
		</div>
	);

	return (
		<>
			{/* --- CONTAINER PDF: SINGLE ITEM (Dari Halaman Detail) --- */}
			{selectedItem && (
				<div style={{ display: "none" }}>
					<div
						id="pdf-monitoring-single"
						style={{
							width: "210mm",
							minHeight: "297mm",
							padding: "15mm",
							boxSizing: "border-box",
							backgroundColor: "#fff",
							color: "#000",
							fontFamily: "Arial, sans-serif",
						}}
					>
						{/* HALAMAN 1: COVER PAGE */}
						<div
							style={{
								height: "240mm",
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
							}}
						>
							<h2
								style={{
									fontSize: "16pt",
									fontWeight: 800,
									marginBottom: "0.5rem",
									fontFamily: '"Times New Roman", Times, serif',
								}}
							>
								REKAP KEHADIRAN KEGIATAN KBM
							</h2>
							<h1
								style={{
									fontSize: "24pt",
									fontWeight: 900,
									color: "#0a2540",
									marginBottom: "0.5rem",
									textTransform: "uppercase",
									fontFamily: '"Times New Roman", Times, serif',
									textAlign: "center",
								}}
							>
								{selectedItem.mapelNama}
							</h1>
							<p style={{ fontSize: "14pt", fontWeight: 600 }}>Tahun Ajaran {selectedItem.tahunAjaranNama}</p>
							<div style={{ margin: "4rem 0", display: "flex", justifyContent: "center" }}>
								<img src="/logo.jpg" alt="Logo" style={{ width: "160px", height: "160px", objectFit: "contain" }} />
							</div>
							<div style={{ textAlign: "center" }}>
								<p style={{ fontSize: "12pt", marginBottom: "0.5rem" }}>
									<strong>GURU PENGAMPU:</strong>
								</p>
								<p style={{ fontSize: "16pt", fontWeight: 700, color: "#0a2540" }}>{selectedItem.guruNama}</p>
								<p style={{ fontSize: "12pt", marginTop: "0.5rem" }}>NPP: {selectedItem.guruNpp || "-"}</p>
							</div>
							<div
								style={{
									marginTop: "4rem",
									textAlign: "center",
									borderTop: "2px solid #0a2540",
									paddingTop: "1.5rem",
									width: "60%",
									margin: "4rem auto 0 auto",
								}}
							>
								<p style={{ fontSize: "14pt", fontWeight: "bold" }}>KELAS {selectedItem.kelasNama}</p>
								<p
									style={{
										fontSize: "12pt",
										fontWeight: "bold",
										fontFamily: '"Times New Roman", Times, serif',
										marginTop: "0.5rem",
									}}
								>
									SMA NEGERI 2 BREBES
								</p>
							</div>
						</div>

						<div className="html2pdf__page-break"></div>

						{/* HALAMAN 2: KOP SURAT & TABEL RIWAYAT */}
						{pdfHeader}
						<h3
							style={{
								fontSize: "11pt",
								fontWeight: "bold",
								borderBottom: "2px solid #000",
								paddingBottom: "0.5rem",
								marginBottom: "1rem",
								textTransform: "uppercase",
							}}
						>
							RIWAYAT KEGIATAN BELAJAR MENGAJAR (KBM) - {selectedItem.kelasNama}
						</h3>

						<table
							style={{
								width: "100%",
								borderCollapse: "collapse",
								border: "1px solid #000",
								marginBottom: "2rem",
								fontSize: "9pt",
							}}
						>
							<thead>
								<tr>
									<th
										style={{
											border: "1px solid #000",
											backgroundColor: "#f1f5f9",
											padding: "6px",
											width: "5%",
											textAlign: "center",
										}}
									>
										Pert.
									</th>
									<th
										style={{
											border: "1px solid #000",
											backgroundColor: "#f1f5f9",
											padding: "6px",
											width: "15%",
											textAlign: "center",
										}}
									>
										Tanggal
									</th>
									<th
										style={{
											border: "1px solid #000",
											backgroundColor: "#f1f5f9",
											padding: "6px",
											width: "12%",
											textAlign: "center",
										}}
									>
										Jam Ke-
									</th>
									<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "20%" }}>
										Waktu Mengajar
									</th>
									<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "20%" }}>
										Topik Pembelajaran
									</th>
									<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "20%" }}>
										Topik Tugas
									</th>
									<th
										style={{
											border: "1px solid #000",
											backgroundColor: "#f1f5f9",
											padding: "6px",
											width: "15%",
											textAlign: "center",
										}}
									>
										Status
									</th>
								</tr>
							</thead>
							<tbody>
								{(() => {
									const sortedRiwayat = [...(selectedItem.riwayat || [])].sort((a, b) => a.pertemuanKe - b.pertemuanKe);
									if (sortedRiwayat.length === 0) {
										return (
											<tr>
												<td colSpan={6} style={{ textAlign: "center", padding: "1rem", border: "1px solid #000" }}>
													Belum ada riwayat.
												</td>
											</tr>
										);
									}
									return sortedRiwayat.map((row: any, idx: number) => (
										<tr key={idx}>
											<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", fontWeight: "bold" }}>
												{row.pertemuanKe}
											</td>
											<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
												{row.tanggalStr}
											</td>
											<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{row.jamStr}</td>
											<td style={{ border: "1px solid #000", padding: "4px", color: "#1e3a8a", fontWeight: "bold" }}>
												{row.waktuMengajar}
											</td>
											<td style={{ border: "1px solid #000", padding: "4px" }}>{row.topik || "-"}</td>
											<td style={{ border: "1px solid #000", padding: "4px" }}>{row.topikTugas || "-"}</td>
											<td
												style={{
													border: "1px solid #000",
													padding: "4px",
													textAlign: "center",
													fontWeight: "bold",
													color: row.status === "Terisi" ? "#10b981" : "#ef4444",
												}}
											>
												{row.status}
											</td>
										</tr>
									));
								})()}
							</tbody>
						</table>
					</div>
				</div>
			)}

			{/* --- CONTAINER PDF: BULK MULTI-GURU --- */}
			{pdfGurusData.length > 0 && (
				<div style={{ display: "none" }}>
					<div
						id="pdf-monitoring-bulk"
						style={{
							width: "210mm",
							minHeight: "297mm",
							padding: "15mm",
							boxSizing: "border-box",
							backgroundColor: "#fff",
							color: "#000",
							fontFamily: "Arial, sans-serif",
						}}
					>
						{pdfGurusData.map((guruData, gIndex) => (
							<div key={gIndex}>
								{/* COVER PER GURU */}
								<div
									style={{
										height: "240mm",
										display: "flex",
										flexDirection: "column",
										justifyContent: "center",
										alignItems: "center",
									}}
								>
									<h2
										style={{
											fontSize: "16pt",
											fontWeight: 800,
											marginBottom: "0.5rem",
											fontFamily: '"Times New Roman", Times, serif',
										}}
									>
										REKAP KEHADIRAN GURU MENGAJAR
									</h2>
									<h1
										style={{
											fontSize: "24pt",
											fontWeight: 900,
											color: "#0a2540",
											marginBottom: "0.5rem",
											textTransform: "uppercase",
											fontFamily: '"Times New Roman", Times, serif',
											textAlign: "center",
										}}
									>
										{guruData.guruNama}
									</h1>
									<p style={{ fontSize: "14pt", fontWeight: 600 }}>Tahun Ajaran {guruData.tahunAjaranNama}</p>
									<div style={{ margin: "4rem 0", display: "flex", justifyContent: "center" }}>
										<img src="/logo.jpg" alt="Logo" style={{ width: "160px", height: "160px", objectFit: "contain" }} />
									</div>
									<div style={{ textAlign: "center" }}>
										<p style={{ fontSize: "12pt", marginBottom: "0.5rem" }}>
											<strong>NPP:</strong>
										</p>
										<p style={{ fontSize: "16pt", fontWeight: 700, color: "#0a2540" }}>{guruData.guruNpp}</p>
									</div>
									<div
										style={{
											marginTop: "4rem",
											textAlign: "center",
											borderTop: "2px solid #0a2540",
											paddingTop: "1.5rem",
											width: "60%",
											margin: "4rem auto 0 auto",
										}}
									>
										<p
											style={{
												fontSize: "12pt",
												fontWeight: "bold",
												fontFamily: '"Times New Roman", Times, serif',
												marginTop: "0.5rem",
											}}
										>
											SMA NEGERI 2 BREBES
										</p>
									</div>
								</div>

								<div className="html2pdf__page-break"></div>

								{/* DATA RIWAYAT SEMUA KELAS MILIK GURU TERSEBUT */}
								{pdfHeader}
								<h3 style={{ fontSize: "14pt", fontWeight: "bold", textAlign: "center", marginBottom: "1rem" }}>
									JURNAL MENGAJAR GURU
								</h3>

								{guruData.items.map((kbmItem: any, kIndex: number) => (
									<div key={kIndex} style={{ marginBottom: "2rem" }}>
										<h4
											style={{
												fontSize: "11pt",
												fontWeight: "bold",
												borderBottom: "1px solid #000",
												paddingBottom: "0.5rem",
												marginBottom: "0.5rem",
												backgroundColor: "#f8fafc",
												padding: "5px",
											}}
										>
											KELAS: {kbmItem.kelasNama} | MATA PELAJARAN: {kbmItem.mapelNama}
										</h4>
										<table
											style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", fontSize: "9pt" }}
										>
											<thead>
												<tr>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "5%",
															textAlign: "center",
														}}
													>
														P.Ke
													</th>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "15%",
															textAlign: "center",
														}}
													>
														Tanggal
													</th>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "12%",
															textAlign: "center",
														}}
													>
														Jam Ke-
													</th>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "20%",
														}}
													>
														Waktu Mengajar
													</th>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "20%",
														}}
													>
														Topik
													</th>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "20%",
														}}
													>
														Topik Tugas
													</th>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "15%",
															textAlign: "center",
														}}
													>
														Status
													</th>
												</tr>
											</thead>
											<tbody>
												{(() => {
													const sortedRiwayat = [...(kbmItem.riwayat || [])].sort(
														(a, b) => a.pertemuanKe - b.pertemuanKe,
													);
													if (sortedRiwayat.length === 0) {
														return (
															<tr>
																<td
																	colSpan={6}
																	style={{ textAlign: "center", padding: "1rem", border: "1px solid #000" }}
																>
																	Belum ada riwayat.
																</td>
															</tr>
														);
													}
													return sortedRiwayat.map((row: any, idx: number) => (
														<tr key={idx}>
															<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
																{row.pertemuanKe}
															</td>
															<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
																{row.tanggalStr}
															</td>
															<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
																{row.jamStr}
															</td>
															<td style={{ border: "1px solid #000", padding: "4px" }}>{row.waktuMengajar}</td>
															<td style={{ border: "1px solid #000", padding: "4px" }}>{row.topik || "-"}</td>
															<td style={{ border: "1px solid #000", padding: "4px" }}>{row.topikTugas || "-"}</td>
															<td
																style={{
																	border: "1px solid #000",
																	padding: "4px",
																	textAlign: "center",
																	fontWeight: "bold",
																	color: row.status === "Terisi" ? "#10b981" : "#ef4444",
																}}
															>
																{row.status}
															</td>
														</tr>
													));
												})()}
											</tbody>
										</table>
									</div>
								))}

								{gIndex < pdfGurusData.length - 1 && <div className="html2pdf__page-break"></div>}
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

			{/* MODAL UNDUH MULTI-GURU (Dari Halaman List) */}
			{isBulkExportModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Ekspor Data Guru</h3>
							<button className={styles.modalCloseBtn} onClick={() => setIsBulkExportModalOpen(false)}>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
								Pilih nama guru yang ingin direkap KBM-nya (dijadikan satu file PDF bersampul):
							</p>

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
										checked={selectedExportGurus.length === uniqueGurus.length}
										onChange={handleToggleAllGurus}
										style={{ marginRight: "0.75rem", width: "16px", height: "16px" }}
									/>
									<span style={{ fontWeight: 600 }}>Pilih Semua Guru</span>
								</label>
								{uniqueGurus.map((guru) => (
									<label
										key={guru}
										style={{ display: "flex", alignItems: "center", padding: "0.5rem", cursor: "pointer" }}
									>
										<input
											type="checkbox"
											checked={selectedExportGurus.includes(guru)}
											onChange={() => handleToggleGuruExport(guru)}
											style={{ marginRight: "0.75rem", width: "16px", height: "16px" }}
										/>
										<span>{guru}</span>
									</label>
								))}
							</div>

							<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
								<button className={styles.btnOutline} onClick={() => setIsBulkExportModalOpen(false)}>
									Batal
								</button>
								<button
									className={styles.btnPrimaryDark}
									disabled={isDownloadingPdf || selectedExportGurus.length === 0}
									onClick={executeBulkPdfExport}
									style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
								>
									{isDownloadingPdf ? (
										"Memproses PDF..."
									) : (
										<>
											<FileText size={16} /> Unduh PDF
										</>
									)}
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{/* MODAL UNDUH SINGLE (Dari Halaman Detail) */}
			{isPdfModalOpen && selectedItem && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer} style={{ maxWidth: "420px", padding: 0 }}>
						<div className={styles.modalHeader} style={{ padding: "1.5rem 2rem", borderBottom: "1px solid #e2e8f0" }}>
							<h3 className={styles.modalTitle} style={{ fontSize: "1.25rem", margin: 0 }}>
								Ekspor Data Monitoring
							</h3>
							<button
								onClick={() => setIsPdfModalOpen(false)}
								style={{ background: "none", border: "none", cursor: "pointer" }}
							>
								<X size={20} />
							</button>
						</div>
						<div style={{ padding: "2rem", textAlign: "center" }}>
							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.5rem" }}>
								Unduh rekapitulasi kehadiran kegiatan KBM kelas <strong>{selectedItem.kelasNama}</strong> -{" "}
								<strong>{selectedItem.mapelNama}</strong>.
							</p>
							<div style={{ display: "flex", justifyContent: "center" }}>
								<button
									onClick={exportToPDF}
									disabled={isDownloadingPdf}
									style={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										background: "#f8fafc",
										border: "1px solid #e2e8f0",
										borderRadius: "0.75rem",
										padding: "1.5rem",
										cursor: "pointer",
										width: "140px",
									}}
								>
									<FileText size={40} color="#ef4444" style={{ marginBottom: "0.5rem" }} />
									<span style={{ fontWeight: "bold", color: "#0f172a" }}>
										{isDownloadingPdf ? "Memproses..." : "PDF (.pdf)"}
									</span>
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
					{/* HALAMAN LIST */}
					{viewMode === "list" && (
						<div>
							<div className={styles.sectionHeader}>
								<div>
									<h2 className={styles.sectionTitle}>Monitoring Jurnal Mengajar</h2>
									<p className={styles.sectionDate}>Overview of teaching journals across all subjects and classes.</p>
								</div>
								<div className={styles.headerButtons}>
									<div className={styles.searchBoxCard}>
										<Search size={16} className={styles.searchIcon} />
										<input
											type="text"
											placeholder="Cari Mapel, Kelas, atau Guru..."
											className={styles.searchInput}
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
										/>
									</div>
									<button className={styles.btnOutline}>
										<Filter size={16} /> Filter
									</button>

									{/* TOMBOL BARU: EXPORT MULTI GURU */}
									<button
										className={styles.btnPrimaryDark}
										onClick={() => {
											setIsBulkExportModalOpen(true);
											setSelectedExportGurus([...uniqueGurus]); // Default pilih semua
										}}
									>
										<Download size={16} /> Ekspor PDF (Per Guru)
									</button>
								</div>
							</div>

							<div className={styles.gridCards}>
								{paginatedCards.length === 0 ? (
									<div className={styles.emptyState}>Tidak ada kelas yang cocok dengan pencarian.</div>
								) : (
									paginatedCards.map((item: any) => (
										<div key={item.id} className={styles.kbmCard}>
											<div className={styles.kbmCardHeader}>
												<div>
													<h3 className={styles.kbmMapel}>{item.mapelNama}</h3>
													<p className={styles.kbmKelas}>{item.kelasNama}</p>
												</div>
												<div className={styles.iconMapel}>{getMapelIcon(item.mapelNama)}</div>
											</div>

											<div className={styles.guruProfileBox}>
												<div className={styles.guruAvatar}>{item.guruInitials}</div>
												<div>
													<div className={styles.guruName}>{item.guruNama}</div>
													<div className={styles.guruRole}>Teacher</div>
												</div>
											</div>

											<div className={styles.progressSection}>
												<div className={styles.progressLabels}>
													<span>Jumlah Jurnal</span>
													<span style={{ fontWeight: 800 }}>
														{item.terisi}/{item.totalSesi}{" "}
														<span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b" }}>Sesi</span>
													</span>
												</div>
												<div className={styles.progressTrack}>
													<div
														className={styles.progressBar}
														style={{
															width: `${item.totalSesi > 0 ? (item.terisi / item.totalSesi) * 100 : 0}%`,
															backgroundColor:
																item.jamKosong > 0 ? (item.terisi === 0 ? "#ef4444" : "#f59e0b") : "#10b981",
														}}
													></div>
												</div>
											</div>

											<button className={styles.btnOutlineFull} onClick={() => handleLihatDetail(item)}>
												Lihat Detail
											</button>
										</div>
									))
								)}
							</div>

							{totalCardPages > 1 && (
								<div className={styles.paginationCenter}>
									<div className={styles.pageButtons}>
										<button
											className={styles.pageBtn}
											disabled={currentCardPage === 1}
											onClick={() => setCurrentCardPage((p) => p - 1)}
										>
											&lt; Prev
										</button>
										<span className={styles.pageIndicator}>
											Halaman {currentCardPage} dari {totalCardPages}
										</span>
										<button
											className={styles.pageBtn}
											disabled={currentCardPage === totalCardPages}
											onClick={() => setCurrentCardPage((p) => p + 1)}
										>
											Next &gt;
										</button>
									</div>
								</div>
							)}
						</div>
					)}

					{/* HALAMAN DETAIL */}
					{viewMode === "detail" && selectedItem && (
						<div>
							<div
								style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}
							>
								<button className={styles.btnBack} onClick={() => setViewMode("list")}>
									<ArrowLeft size={16} /> Detail Jurnal & Monitoring
								</button>
								<button
									className={styles.btnPrimary}
									onClick={() => setIsPdfModalOpen(true)}
									style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem" }}
								>
									<Download size={16} /> Export PDF
								</button>
							</div>

							<div className={styles.detailHeaderGrid}>
								<div className={styles.detailSummaryCard}>
									<div className={styles.iconBoxBlue}>
										<BookOpen size={24} color="#3b82f6" />
									</div>
									<div>
										<h2 className={styles.detailTitleBig}>{selectedItem.mapelNama}</h2>
										<div className={styles.detailSubInfo}>
											<div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
												<Building size={14} color="#64748b" /> {selectedItem.kelasNama}
											</div>
											<span style={{ color: "#cbd5e1" }}>•</span>
											<div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
												<User size={14} color="#64748b" /> {selectedItem.guruNama}
											</div>
											<span style={{ color: "#cbd5e1" }}>•</span>
											<span style={{ color: "#94a3b8" }}>(NPP: {selectedItem.guruNpp})</span>
										</div>
									</div>
								</div>
								<div className={styles.alertSummaryCard}>
									<AlertTriangle size={24} color="#ef4444" style={{ marginBottom: "0.5rem" }} />
									<div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600 }}>Total Jam Kosong</div>
									<div style={{ color: "#ef4444", fontSize: "2rem", fontWeight: 800 }}>
										{selectedItem.jamKosong} <span style={{ fontSize: "1rem", fontWeight: 600 }}>Sesi</span>
									</div>
								</div>
							</div>

							<div className={styles.tableCard}>
								<div className={styles.tableHeader}>
									<h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>Riwayat Sesi Pembelajaran</h3>
									<div className={styles.headerButtons}>
										<div className={styles.searchBoxCard}>
											<Search size={16} className={styles.searchIcon} />
											<input
												type="text"
												placeholder="Cari topik..."
												className={styles.searchInput}
												value={searchTopik}
												onChange={(e) => {
													setSearchTopik(e.target.value);
													setCurrentPage(1);
												}}
											/>
										</div>
									</div>
								</div>

								<div className={styles.tableWrapper}>
									<div style={{ overflowX: "auto", width: "100%" }}>
<table className={styles.dataTable}>
										<thead>
											<tr>
												<th
													className={styles.sortableTh}
													onClick={() => handleSort("pertemuanKe")}
													style={{ width: "130px" }}
												>
													PERTEMUAN KE-{renderSortIcon("pertemuanKe")}
												</th>
												<th
													className={styles.sortableTh}
													onClick={() => handleSort("tanggalRaw")}
													style={{ width: "150px" }}
												>
													TANGGAL{renderSortIcon("tanggalRaw")}
												</th>
												<th
													className={styles.sortableTh}
													onClick={() => handleSort("jamStr")}
													style={{ width: "120px" }}
												>
													JAM{renderSortIcon("jamStr")}
												</th>
												<th
													className={styles.sortableTh}
													onClick={() => handleSort("waktuMengajar")}
													style={{ width: "180px" }}
												>
													WAKTU MENGAJAR{renderSortIcon("waktuMengajar")}
												</th>
												<th className={styles.sortableTh} onClick={() => handleSort("topik")} style={{ width: "200px" }}>
													TOPIK PEMBELAJARAN{renderSortIcon("topik")}
												</th>
												<th className={styles.sortableTh} onClick={() => handleSort("topikTugas")} style={{ width: "150px" }}>
													TOPIK TUGAS{renderSortIcon("topikTugas")}
												</th>
												<th
													className={styles.sortableTh}
													onClick={() => handleSort("status")}
													style={{ width: "130px", textAlign: "center" }}
												>
													STATUS{renderSortIcon("status")}
												</th>
											</tr>
										</thead>
										<tbody>
											{paginatedRiwayat.length === 0 ? (
												<tr>
													<td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
														Tidak ada riwayat yang cocok.
													</td>
												</tr>
											) : (
												paginatedRiwayat.map((row: any, i: number) => (
													<tr key={i}>
														<td style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>
															{String(row.pertemuanKe).padStart(2, "0")}
														</td>
														<td style={{ color: "#475569", fontWeight: 600 }}>{row.tanggalStr}</td>
														<td style={{ color: "#475569" }}>{row.jamStr}</td>
														<td style={{ color: "#1e3a8a", fontWeight: 600 }}>{row.waktuMengajar}</td>
														<td style={{ color: "#334155" }}>{row.topik}</td>
														<td style={{ color: "#0f172a", fontWeight: 500 }}>{row.topikTugas}</td>
														<td style={{ textAlign: "center" }}>
															{row.status === "Terisi" ? (
																<span className={styles.badgeSolidBlue}>
																	<CheckCircle2 size={12} /> Terisi
																</span>
															) : (
																<span className={styles.badgeSolidRed}>
																	<AlertTriangle size={12} /> Jam Kosong
																</span>
															)}
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
</div>
								</div>

								<div className={styles.pagination}>
									<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
										Menampilkan {processedRiwayat.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{" "}
										{Math.min(currentPage * itemsPerPage, processedRiwayat.length)} dari {processedRiwayat.length}{" "}
										pertemuan
									</span>
									<div className={styles.pageButtons}>
										<button
											className={styles.pageBtn}
											disabled={currentPage === 1}
											onClick={() => setCurrentPage((prev) => prev - 1)}
										>
											&lt;
										</button>
										<button
											className={styles.pageBtn}
											disabled={currentPage === totalPages || processedRiwayat.length === 0}
											onClick={() => setCurrentPage((prev) => prev + 1)}
										>
											&gt;
										</button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</>
		</>
	);
}
