// app/pimpinan/jurnal/JurnalClient.tsx
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
	Search,
	ArrowLeft,
	Printer,
	UsersRound,
	CalendarCheck,
	CheckSquare,
	ChevronRight,
	Bell,
	User,
	TrendingUp,
	BarChart2,
	FileText,
	Download,
	X,
	Check,
} from "lucide-react";
import styles from "./jurnal.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function JurnalClient({ user, daftarTahunAjaran, riwayatData }: any) {
	const [viewMode, setViewMode] = useState<"list" | "detail">("list");
	const [selectedItem, setSelectedItem] = useState<any>(null);

	const [selectedTahun, setSelectedTahun] = useState<string>("");
	const [selectedSemester, setSelectedSemester] = useState<string>("");

	const [currentCardPage, setCurrentCardPage] = useState(1);
	const cardsPerPage = 6;

	const [searchTopik, setSearchTopik] = useState("");
	const [sortConfig, setSortConfig] = useState({ key: "pertemuanKe", direction: "asc" });
	const [currentTablePage, setCurrentTablePage] = useState(1);
	const tableRowsPerPage = 5;

	// State PDF Modal
	const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
	const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
	const [selectedExportItems, setSelectedExportItems] = useState<string[]>([]);

	const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
	const [pdfItemsData, setPdfItemsData] = useState<any[]>([]);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const { tahunList, semesterList } = useMemo(() => {
		const tList = new Set<string>();
		const sList = new Set<string>();

		daftarTahunAjaran.forEach((ta: any) => {
			const parts = ta.nama.trim().split(" ");
			if (parts.length >= 2) {
				tList.add(parts[0]);
				sList.add(parts[1].toLowerCase() === "ganjil" ? "Ganjil" : "Genap");
			}
		});

		const arrTahun = Array.from(tList).sort().reverse();
		const arrSem = Array.from(sList);

		return { tahunList: arrTahun, semesterList: arrSem };
	}, [daftarTahunAjaran]);

	useEffect(() => {
		if (tahunList.length > 0 && !selectedTahun) setSelectedTahun(tahunList[0]);
		if (semesterList.length > 0 && !selectedSemester) setSelectedSemester("Ganjil");
	}, [tahunList, semesterList]);

	useEffect(() => {
		setCurrentCardPage(1);
	}, [selectedTahun, selectedSemester]);

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const handleLihatAnalisa = (item: any) => {
		setSelectedItem(item);
		setSearchTopik("");
		setCurrentTablePage(1);
		setSortConfig({ key: "pertemuanKe", direction: "asc" });
		setViewMode("detail");
	};

	const handleSort = (key: string) => {
		let direction = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
		setSortConfig({ key, direction });
	};

	const renderSortIcon = (columnName: string) => {
		if (sortConfig.key === columnName) {
			return sortConfig.direction === "asc" ? " ↑" : " ↓";
		}
		return "";
	};

	const filteredData = useMemo(() => {
		return riwayatData.filter((item: any) => {
			const targetFormat = `${selectedTahun} ${selectedSemester}`.toLowerCase();
			return item.tahunAjaranAsli.toLowerCase().includes(targetFormat);
		});
	}, [riwayatData, selectedTahun, selectedSemester]);

	const totalCardPages = Math.max(1, Math.ceil(filteredData.length / cardsPerPage));
	const paginatedCards = filteredData.slice((currentCardPage - 1) * cardsPerPage, currentCardPage * cardsPerPage);

	const processedSesi = useMemo(() => {
		if (!selectedItem) return [];
		let result = selectedItem.detailSesi.filter(
			(sesi: any) =>
				(sesi.topik || "").toLowerCase().includes(searchTopik.toLowerCase()) ||
				(sesi.catatan || "").toLowerCase().includes(searchTopik.toLowerCase()),
		);

		result.sort((a: any, b: any) => {
			if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
			if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});

		return result;
	}, [selectedItem, searchTopik, sortConfig]);

	const totalTablePages = Math.max(1, Math.ceil(processedSesi.length / tableRowsPerPage));
	const paginatedSesi = processedSesi.slice(
		(currentTablePage - 1) * tableRowsPerPage,
		currentTablePage * tableRowsPerPage,
	);

	// --- PERBAIKAN GRAFIK: Menggunakan data REAL tanpa random ---
	const chartData = useMemo(() => {
		if (!selectedItem || !selectedItem.detailSesi) return [];
		const sorted = [...selectedItem.detailSesi].sort((a, b) => a.pertemuanKe - b.pertemuanKe);
		const last5 = sorted.slice(-5); // 5 Pertemuan terakhir

		return last5.map((sesi) => {
			const percentage = selectedItem.totalSiswa > 0 ? Math.round((sesi.hadir / selectedItem.totalSiswa) * 100) : 0;
			return {
				label: `M${sesi.pertemuanKe}`,
				value: percentage,
			};
		});
	}, [selectedItem]);

	// --- LOGIKA EXPORT ---
	const handleToggleExportItem = (itemId: string) => {
		setSelectedExportItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]));
	};

	const handleToggleAllExport = () => {
		if (selectedExportItems.length === filteredData.length) {
			setSelectedExportItems([]);
		} else {
			setSelectedExportItems(filteredData.map((item: any) => item.id));
		}
	};

	const executePdfExport = async (itemsToExport: any[], filename: string) => {
		if (itemsToExport.length === 0) {
			showToast("Pilih setidaknya satu jurnal untuk diekspor.");
			return;
		}

		setIsDownloadingPdf(true);
		setPdfItemsData(itemsToExport);

		setTimeout(async () => {
			try {
				const html2pdf = (await import("html2pdf.js")).default;
				const element = document.getElementById("pdf-jurnal-content");

				const opt = {
					margin: 0,
					filename: filename,
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
				setIsBulkExportModalOpen(false);
				setPdfItemsData([]);
			}
		}, 800);
	};

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
		<div className={styles.layoutWrapper}>
			{/* --- CONTAINER TERSEMBUNYI UNTUK CETAK PDF --- */}
			{pdfItemsData.length > 0 && (
				<div style={{ display: "none" }}>
					<div
						id="pdf-jurnal-content"
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
						{pdfItemsData.map((dataItem, index) => (
							<div key={dataItem.id || index}>
								{/* HALAMAN COVER */}
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
										BUKU JURNAL MENGAJAR GURU
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
										{dataItem.mapelNama}
									</h1>
									<p style={{ fontSize: "14pt", fontWeight: 600 }}>Kelas {dataItem.kelasNama}</p>

									<div style={{ margin: "3rem 0", display: "flex", justifyContent: "center" }}>
										<img
											src="/logo.jpg"
											alt="Logo SMAN 2 Brebes"
											style={{ width: "160px", height: "160px", objectFit: "contain" }}
										/>
									</div>

									<div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
										<p style={{ fontSize: "12pt", marginBottom: "0.5rem" }}>
											<strong>NAMA GURU:</strong>
										</p>
										<p style={{ fontSize: "16pt", fontWeight: 700, color: "#0a2540", textTransform: "uppercase" }}>
											{dataItem.guruNama}
										</p>
										<p style={{ fontSize: "12pt", marginTop: "0.5rem" }}>NPP: {dataItem.guruNpp}</p>
									</div>

									<div style={{ textAlign: "center" }}>
										<p style={{ fontSize: "12pt", marginBottom: "0.5rem" }}>
											<strong>TAHUN PELAJARAN:</strong>
										</p>
										<p style={{ fontSize: "14pt", fontWeight: 700 }}>{dataItem.tahunAjaranAsli}</p>
									</div>

									<div
										style={{
											marginTop: "3rem",
											textAlign: "center",
											borderTop: "2px solid #0a2540",
											paddingTop: "1.5rem",
											width: "60%",
											margin: "3rem auto 0 auto",
										}}
									>
										<p style={{ fontSize: "12pt", fontWeight: "bold", fontFamily: '"Times New Roman", Times, serif' }}>
											SMA NEGERI 2 BREBES
										</p>
									</div>
								</div>

								<div className="html2pdf__page-break"></div>

								{/* HALAMAN KONTEN */}
								{pdfHeader}
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										marginBottom: "1.5rem",
										borderBottom: "1px solid #e2e8f0",
										paddingBottom: "10px",
									}}
								>
									<div>
										<p style={{ margin: "0 0 5px 0", fontSize: "10pt" }}>
											<strong>Mata Pelajaran:</strong> {dataItem.mapelNama}
										</p>
										<p style={{ margin: "0 0 5px 0", fontSize: "10pt" }}>
											<strong>Kelas:</strong> {dataItem.kelasNama}
										</p>
									</div>
									<div style={{ textAlign: "right" }}>
										<p style={{ margin: "0 0 5px 0", fontSize: "10pt" }}>
											<strong>Guru:</strong> {dataItem.guruNama}
										</p>
										<p style={{ margin: "0 0 5px 0", fontSize: "10pt" }}>
											<strong>Semester:</strong> {dataItem.tahunAjaranAsli}
										</p>
									</div>
								</div>

								{/* PERBAIKAN URUTAN PDF: Kehadiran Siswa di atas */}
								{dataItem.siswaList && dataItem.siswaList.length > 0 && (
									<>
										<h3
											style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}
										>
											A. Rekapitulasi Kehadiran Siswa
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
														rowSpan={2}
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "5%",
															textAlign: "center",
														}}
													>
														No
													</th>
													<th
														rowSpan={2}
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "45%",
														}}
													>
														Nama Siswa
													</th>
													<th
														colSpan={4}
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															textAlign: "center",
														}}
													>
														Status Presensi
													</th>
													<th
														rowSpan={2}
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "6px",
															width: "10%",
															textAlign: "center",
														}}
													>
														% Hadir
													</th>
												</tr>
												<tr>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "4px",
															width: "10%",
															textAlign: "center",
															color: "#10b981",
														}}
													>
														H
													</th>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "4px",
															width: "10%",
															textAlign: "center",
															color: "#d97706",
														}}
													>
														S
													</th>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "4px",
															width: "10%",
															textAlign: "center",
															color: "#d97706",
														}}
													>
														I
													</th>
													<th
														style={{
															border: "1px solid #000",
															backgroundColor: "#f1f5f9",
															padding: "4px",
															width: "10%",
															textAlign: "center",
															color: "#ef4444",
														}}
													>
														A
													</th>
												</tr>
											</thead>
											<tbody>
												{dataItem.siswaList.map((siswa: any, sIdx: number) => (
													<tr key={sIdx}>
														<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
															{sIdx + 1}
														</td>
														<td style={{ border: "1px solid #000", padding: "4px" }}>{siswa.nama}</td>
														<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
															{siswa.detailKehadiran?.H || 0}
														</td>
														<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
															{siswa.detailKehadiran?.S || 0}
														</td>
														<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
															{siswa.detailKehadiran?.I || 0}
														</td>
														<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
															{siswa.detailKehadiran?.A || 0}
														</td>
														<td
															style={{
																border: "1px solid #000",
																padding: "4px",
																textAlign: "center",
																fontWeight: "bold",
															}}
														>
															{siswa.persentase || 0}%
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</>
								)}

								{/* RIWAYAT PELAKSANAAN KBM */}
								<h3 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
									{dataItem.siswaList && dataItem.siswaList.length > 0 ? "B." : "A."} Riwayat Pelaksanaan KBM
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
												Ke-
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
												Tanggal
											</th>
											<th
												style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "25%" }}
											>
												Materi / Topik
											</th>
											<th
												style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "38%" }}
											>
												Catatan KBM
											</th>
											<th
												style={{
													border: "1px solid #000",
													backgroundColor: "#f1f5f9",
													padding: "6px",
													width: "10%",
													textAlign: "center",
												}}
											>
												Hadir
											</th>
											<th
												style={{
													border: "1px solid #000",
													backgroundColor: "#f1f5f9",
													padding: "6px",
													width: "10%",
													textAlign: "center",
												}}
											>
												Status
											</th>
										</tr>
									</thead>
									<tbody>
										{(() => {
											const sortedSesi = [...(dataItem.detailSesi || [])].sort((a, b) => a.pertemuanKe - b.pertemuanKe);
											if (sortedSesi.length === 0) {
												return (
													<tr>
														<td colSpan={6} style={{ textAlign: "center", padding: "1rem", border: "1px solid #000" }}>
															Belum ada sesi tercatat.
														</td>
													</tr>
												);
											}
											return sortedSesi.map((sesi: any, idx: number) => (
												<tr key={idx}>
													<td
														style={{
															border: "1px solid #000",
															padding: "4px",
															textAlign: "center",
															fontWeight: "bold",
														}}
													>
														{sesi.pertemuanKe}
													</td>
													<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
														{sesi.tanggal}
													</td>
													<td style={{ border: "1px solid #000", padding: "4px" }}>{sesi.topik || "-"}</td>
													<td style={{ border: "1px solid #000", padding: "4px" }}>{sesi.catatan || "-"}</td>
													<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>
														{sesi.hadir}/{dataItem.totalSiswa}
													</td>
													<td
														style={{
															border: "1px solid #000",
															padding: "4px",
															textAlign: "center",
															color: sesi.status === "TERKIRIM" ? "#10b981" : "#d97706",
															fontWeight: "bold",
														}}
													>
														{sesi.status}
													</td>
												</tr>
											));
										})()}
									</tbody>
								</table>

								<div style={{ textAlign: "right", marginTop: "40px", paddingBottom: "30px" }}>
									<p style={{ margin: 0, fontSize: "10pt" }}>
										Brebes, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
									</p>
									<p style={{ margin: "5px 0 50px 0", fontSize: "10pt" }}>Mengetahui,</p>
									<p style={{ margin: 0, fontSize: "10pt", fontWeight: "bold" }}>{user.nama}</p>
									<p style={{ margin: 0, fontSize: "10pt" }}>NIP/NPP: {user.username || "-"}</p>
								</div>

								{index < pdfItemsData.length - 1 && <div className="html2pdf__page-break"></div>}
							</div>
						))}
					</div>
				</div>
			)}

			{/* MODAL & TOAST UI COMPONENTS */}
			{toastMessage && (
				<div className={styles.toastContainer}>
					<Check size={16} /> <span className={styles.toastText}>{toastMessage}</span>
				</div>
			)}

			{isBulkExportModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Ekspor Buku Jurnal</h3>
							<button onClick={() => setIsBulkExportModalOpen(false)} className={styles.modalCloseBtn}>
								<X size={20} />
							</button>
						</div>
						<div style={{ padding: "2rem" }}>
							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
								Pilih jurnal mata pelajaran yang ingin diekspor ke dalam satu file PDF:
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
										checked={selectedExportItems.length === filteredData.length && filteredData.length > 0}
										onChange={handleToggleAllExport}
										style={{ marginRight: "0.75rem", width: "16px", height: "16px" }}
									/>
									<span style={{ fontWeight: 600 }}>Pilih Semua ({filteredData.length})</span>
								</label>
								{filteredData.map((item: any) => (
									<label
										key={item.id}
										style={{
											display: "flex",
											alignItems: "center",
											padding: "0.5rem",
											cursor: "pointer",
											borderBottom: "1px solid #f8fafc",
										}}
									>
										<input
											type="checkbox"
											checked={selectedExportItems.includes(item.id)}
											onChange={() => handleToggleExportItem(item.id)}
											style={{ marginRight: "0.75rem", width: "16px", height: "16px" }}
										/>
										<div style={{ display: "flex", flexDirection: "column" }}>
											<span style={{ fontWeight: 500 }}>
												{item.mapelNama} - {item.kelasNama}
											</span>
											<span style={{ fontSize: "0.75rem", color: "#64748b" }}>Guru: {item.guruNama}</span>
										</div>
									</label>
								))}
							</div>

							<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
								<button className={styles.btnOutline} onClick={() => setIsBulkExportModalOpen(false)}>
									Batal
								</button>
								<button
									className={styles.btnPrimaryDark}
									disabled={isDownloadingPdf || selectedExportItems.length === 0}
									onClick={() => {
										const itemsToExport = filteredData.filter((k: any) => selectedExportItems.includes(k.id));
										executePdfExport(itemsToExport, `Buku_Jurnal_Mengajar_Massal.pdf`);
									}}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										padding: "0.5rem 1rem",
										borderRadius: "0.5rem",
										border: "none",
										color: "#fff",
										cursor: "pointer",
									}}
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

			{isPdfModalOpen && selectedItem && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Ekspor Jurnal Guru</h3>
							<button onClick={() => setIsPdfModalOpen(false)} className={styles.modalCloseBtn}>
								<X size={20} />
							</button>
						</div>
						<div style={{ padding: "2rem", textAlign: "center" }}>
							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.5rem" }}>
								Unduh buku jurnal mengajar untuk kelas <strong>{selectedItem.kelasNama}</strong> -{" "}
								<strong>{selectedItem.mapelNama}</strong>.
							</p>
							<div style={{ display: "flex", justifyContent: "center" }}>
								<button
									onClick={() =>
										executePdfExport(
											[selectedItem],
											`Jurnal_${selectedItem.mapelNama.replace(/\s+/g, "_")}_${selectedItem.kelasNama.replace(/\s+/g, "_")}.pdf`,
										)
									}
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

			{/* SIDEBAR */}
			<aside className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<div className={styles.logoWrapper}>
						<img src="/logo.jpg" alt="Logo SMAN 2 Brebes" className={styles.logoImage} />
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
					<Link href="/pimpinan/jurnal" className={`${styles.menuItem} ${styles.menuItemActive}`}>
						<BookOpen size={18} /> Jurnal Mengajar
					</Link>
					<Link href="/pimpinan/report" className={styles.menuItem}>
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

			{/* MAIN CONTENT */}
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
					{/* VIEW 1: FILTER & KARTU JURNAL */}
					{viewMode === "list" && (
						<div>
							{/* PERBAIKAN LAYOUT: Header dan Tombol disejajarkan */}
							<div className={styles.sectionHeader}>
								<div>
									<h2 className={styles.sectionTitle}>Riwayat Jurnal Mengajar</h2>
									<p className={styles.sectionDate}>Pilih periode akademik untuk melihat riwayat jurnal mengajar.</p>
								</div>
								<br></br>
								<div className={styles.headerButtons}>
									<button
										className={styles.btnPrimaryDark}
										onClick={() => {
											setIsBulkExportModalOpen(true);
											setSelectedExportItems(filteredData.map((d: any) => d.id)); // Default pilih semua
										}}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
											padding: "0.75rem 1.25rem",
											borderRadius: "0.5rem",
											border: "none",
											cursor: "pointer",
											background: "#0b1c36",
											color: "#fff",
											fontWeight: "600",
										}}
									>
										<Download size={16} /> Ekspor PDF (Semua)
									</button>
								</div>
							</div>

							<div className={styles.filterBox}>
								<div className={styles.filterGroup}>
									<h4 className={styles.filterLabel}>Tahun Ajaran</h4>
									<div className={styles.pillContainer}>
										{tahunList.map((tahun) => (
											<button
												key={tahun}
												className={`${styles.pillBtn} ${selectedTahun === tahun ? styles.pillActive : ""}`}
												onClick={() => setSelectedTahun(tahun)}
											>
												{tahun}
											</button>
										))}
									</div>
								</div>
								<div className={styles.filterGroup}>
									<h4 className={styles.filterLabel}>Semester</h4>
									<div className={styles.pillContainer}>
										{["Ganjil", "Genap"].map((sem) => (
											<button
												key={sem}
												className={`${styles.pillBtn} ${selectedSemester === sem ? styles.pillActive : ""}`}
												onClick={() => setSelectedSemester(sem)}
											>
												{sem}
											</button>
										))}
									</div>
								</div>
							</div>

							<div className={styles.gridCards}>
								{paginatedCards.length === 0 ? (
									<div className={styles.emptyState}>Tidak ada data jurnal untuk periode ini.</div>
								) : (
									paginatedCards.map((item: any) => (
										<div key={item.id} className={styles.jurnalCard}>
											<div className={styles.cardTopRow}>
												<div>
													<h3 className={styles.cardMapel}>{item.mapelNama}</h3>
													<p className={styles.cardKelas}>{item.kelasNama}</p>
												</div>
												<div className={styles.badgeSesi}>
													{item.terisi}/{item.targetSesi} Sesi
												</div>
											</div>

											<div className={styles.guruProfileBox}>
												<div className={styles.guruAvatarInitials}>{item.guruInitials}</div>
												<div>
													<div className={styles.guruName}>{item.guruNama}</div>
													<div className={styles.guruRole}>Guru Pengampu</div>
												</div>
											</div>

											<button className={styles.btnOutlineFull} onClick={() => handleLihatAnalisa(item)}>
												Lihat Analisa
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

					{/* VIEW 2: DETAIL ANALISA JURNAL (DIBIARKAN SAMA SEPERTI SEBELUMNYA) */}
					{viewMode === "detail" && selectedItem && (
						<div>
							<div className={styles.detailTopbar}>
								<button className={styles.btnBack} onClick={() => setViewMode("list")}>
									<ArrowLeft size={16} /> Detail Analisa
								</button>
								<button
									className={styles.btnPrimary}
									onClick={() => setIsPdfModalOpen(true)}
									style={{
										display: "flex",
										alignItems: "center",
										gap: "0.5rem",
										padding: "0.5rem 1rem",
										borderRadius: "0.5rem",
										border: "none",
										cursor: "pointer",
										background: "#0b1c36",
										color: "#fff",
									}}
								>
									<Download size={16} /> Export PDF
								</button>
							</div>

							<div className={styles.heroCard}>
								<span className={styles.badgeSemester}>
									<BookOpen size={14} /> Semester {selectedSemester} {selectedTahun}
								</span>
								<h1 className={styles.heroTitle}>
									{selectedItem.mapelNama} - {selectedItem.kelasNama}
								</h1>
								<div className={styles.heroSub}>
									<div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
										<User size={14} color="#64748b" /> {selectedItem.guruNama}
									</div>
									<span style={{ color: "#cbd5e1" }}>•</span>
									<div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
										<Clock size={14} color="#64748b" /> {selectedItem.jadwalText}
									</div>
								</div>
								<div className={styles.heroAvatarInitials}>{selectedItem.guruInitials}</div>
							</div>

							<h3 className={styles.sectionSubtitle}>
								<TrendingUp size={20} color="#475569" /> Statistik Utama
							</h3>
							<div className={styles.statGrid}>
								<div className={styles.statCard}>
									<div className={styles.statCardHeader}>
										<div className={styles.iconBoxMono}>
											<UsersRound size={20} color="#475569" />
										</div>
									</div>
									<p className={styles.statLabel}>Persentase Kehadiran</p>
									<h2 className={styles.statValue}>{selectedItem.persentaseKehadiran}%</h2>
								</div>
								<div className={styles.statCard}>
									<div className={styles.statCardHeader}>
										<div className={styles.iconBoxMono}>
											<CalendarCheck size={20} color="#475569" />
										</div>
									</div>
									<p className={styles.statLabel}>Jumlah Sesi (Semester Ini)</p>
									<h2 className={styles.statValue}>
										{selectedItem.terisi} <span className={styles.statSub}>/ {selectedItem.targetSesi}</span>
									</h2>
								</div>
								<div className={styles.statCard}>
									<div className={styles.statCardHeader}>
										<div className={styles.iconBoxMono}>
											<CheckSquare size={20} color="#475569" />
										</div>
									</div>
									<p className={styles.statLabel}>Ketercapaian Materi</p>
									<h2 className={styles.statValue}>{selectedItem.ketercapaian}%</h2>
									<div className={styles.progressTrackBar}>
										<div className={styles.progressBarDark} style={{ width: `${selectedItem.ketercapaian}%` }}></div>
									</div>
								</div>
							</div>

							<div className={styles.bottomGrid}>
								<div className={styles.chartCard}>
									<h3 className={styles.chartTitle}>
										<BarChart2 size={18} color="#475569" /> Tren Kehadiran Siswa
									</h3>
									<div className={styles.barChartArea}>
										{chartData.length === 0 ? (
											<div
												style={{
													color: "#64748b",
													fontSize: "0.875rem",
													textAlign: "center",
													width: "100%",
													marginTop: "2rem",
												}}
											>
												Belum ada data sesi untuk grafik.
											</div>
										) : (
											chartData.map((data: any, idx: number) => (
												<div key={idx} className={styles.barColumn}>
													<div className={styles.barWrapper}>
														<div
															className={idx === chartData.length - 1 ? styles.barFillDark : styles.barFillLight}
															style={{ height: `${data.value}%` }}
														></div>
													</div>
													<span className={styles.barLabel}>{data.label}</span>
												</div>
											))
										)}
									</div>
								</div>

								<div className={styles.tableCard}>
									<div className={styles.tableHeader}>
										<h3 className={styles.chartTitle}>
											<FileText size={18} color="#475569" /> Detail Sesi & Presensi
										</h3>
										<div className={styles.searchBoxTable}>
											<Search size={14} className={styles.searchIconTable} />
											<input
												type="text"
												placeholder="Cari Topik/Catatan..."
												className={styles.searchInputTable}
												value={searchTopik}
												onChange={(e) => {
													setSearchTopik(e.target.value);
													setCurrentTablePage(1);
												}}
											/>
										</div>
									</div>

									<div className={styles.tableWrapper}>
										<table className={styles.dataTable}>
											<thead>
												<tr>
													<th
														style={{ cursor: "pointer", userSelect: "none", width: "10%" }}
														onClick={() => handleSort("pertemuanKe")}
													>
														Pert.{renderSortIcon("pertemuanKe")}
													</th>
													<th
														style={{ cursor: "pointer", userSelect: "none", width: "20%" }}
														onClick={() => handleSort("tanggalRaw")}
													>
														Tanggal{renderSortIcon("tanggalRaw")}
													</th>
													<th style={{ width: "20%" }}>Materi / Topik</th>
													<th style={{ width: "25%" }}>Catatan KBM</th>
													<th style={{ textAlign: "center", width: "10%" }}>Hadir</th>
													<th
														style={{ textAlign: "center", cursor: "pointer", userSelect: "none", width: "15%" }}
														onClick={() => handleSort("status")}
													>
														Status{renderSortIcon("status")}
													</th>
												</tr>
											</thead>
											<tbody>
												{paginatedSesi.length === 0 ? (
													<tr>
														<td colSpan={6} className={styles.emptyTable}>
															Tidak ada sesi yang cocok dengan pencarian.
														</td>
													</tr>
												) : (
													paginatedSesi.map((sesi: any) => (
														<tr key={sesi.id}>
															<td className={styles.tdBold}>{String(sesi.pertemuanKe).padStart(2, "0")}</td>
															<td className={styles.tdGray}>{sesi.tanggal}</td>
															<td>
																<div className={styles.topikTitle}>{sesi.topik}</div>
															</td>
															<td>
																<div style={{ color: "#475569", fontSize: "0.875rem", lineHeight: "1.4" }}>
																	{sesi.catatan}
																</div>
															</td>
															<td className={styles.tdBoldCenter}>
																{sesi.hadir} <span className={styles.tdGray}>/{selectedItem.totalSiswa}</span>
															</td>
															<td style={{ textAlign: "center" }}>
																<span
																	className={sesi.status === "TERKIRIM" ? styles.badgeSuccess : styles.badgeWarning}
																>
																	{sesi.status}
																</span>
															</td>
														</tr>
													))
												)}
											</tbody>
										</table>
									</div>

									<div className={styles.paginationTable}>
										<span className={styles.pageIndicatorInfo}>
											Menampilkan {processedSesi.length === 0 ? 0 : (currentTablePage - 1) * tableRowsPerPage + 1} -{" "}
											{Math.min(currentTablePage * tableRowsPerPage, processedSesi.length)} dari {processedSesi.length}
										</span>
										<div className={styles.pageButtonsMini}>
											<button
												className={styles.pageBtnMini}
												disabled={currentTablePage === 1}
												onClick={() => setCurrentTablePage((p) => p - 1)}
											>
												&lt;
											</button>
											<button
												className={styles.pageBtnMini}
												disabled={currentTablePage === totalTablePages || processedSesi.length === 0}
												onClick={() => setCurrentTablePage((p) => p + 1)}
											>
												&gt;
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* MODAL UNDUH MULTI JURNAL DENGAN LAYOUT TOMBOL YANG DIPERBAIKI */}
				{isBulkExportModalOpen && (
					<div className={styles.modalOverlay}>
						<div
							className={styles.modalContainer}
							style={{ background: "#fff", borderRadius: "1rem", padding: "0", maxWidth: "500px", width: "90%" }}
						>
							<div
								className={styles.modalHeader}
								style={{
									padding: "1.5rem 2rem",
									borderBottom: "1px solid #e2e8f0",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<h3 className={styles.modalTitle} style={{ margin: 0, fontSize: "1.25rem", fontWeight: "bold" }}>
									Ekspor Buku Jurnal
								</h3>
								<button
									onClick={() => setIsBulkExportModalOpen(false)}
									style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
								>
									<X size={20} />
								</button>
							</div>
							<div style={{ padding: "2rem" }}>
								<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1rem" }}>
									Pilih jurnal mata pelajaran yang ingin diekspor ke dalam satu file PDF:
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
											checked={selectedExportItems.length === filteredData.length && filteredData.length > 0}
											onChange={handleToggleAllExport}
											style={{ marginRight: "0.75rem", width: "16px", height: "16px" }}
										/>
										<span style={{ fontWeight: 600 }}>Pilih Semua ({filteredData.length})</span>
									</label>
									{filteredData.map((item: any) => (
										<label
											key={item.id}
											style={{
												display: "flex",
												alignItems: "center",
												padding: "0.5rem",
												cursor: "pointer",
												borderBottom: "1px solid #f8fafc",
											}}
										>
											<input
												type="checkbox"
												checked={selectedExportItems.includes(item.id)}
												onChange={() => handleToggleExportItem(item.id)}
												style={{ marginRight: "0.75rem", width: "16px", height: "16px" }}
											/>
											<div style={{ display: "flex", flexDirection: "column" }}>
												<span style={{ fontWeight: 500 }}>
													{item.mapelNama} - {item.kelasNama}
												</span>
												<span style={{ fontSize: "0.75rem", color: "#64748b" }}>Guru: {item.guruNama}</span>
											</div>
										</label>
									))}
								</div>

								{/* PERBAIKAN STYLING TOMBOL MODAL */}
								<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
									<button
										onClick={() => setIsBulkExportModalOpen(false)}
										style={{
											padding: "0.5rem 1rem",
											borderRadius: "0.5rem",
											border: "1px solid #e2e8f0",
											background: "#fff",
											cursor: "pointer",
											fontWeight: "500",
											color: "#64748b",
										}}
									>
										Batal
									</button>
									<button
										disabled={isDownloadingPdf || selectedExportItems.length === 0}
										onClick={() => {
											const itemsToExport = filteredData.filter((k: any) => selectedExportItems.includes(k.id));
											executePdfExport(itemsToExport, `Buku_Jurnal_Mengajar_Massal.pdf`);
										}}
										style={{
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
											padding: "0.5rem 1.25rem",
											borderRadius: "0.5rem",
											border: "none",
											color: "#fff",
											cursor: isDownloadingPdf || selectedExportItems.length === 0 ? "not-allowed" : "pointer",
											background: isDownloadingPdf || selectedExportItems.length === 0 ? "#cbd5e1" : "#0b1c36",
											fontWeight: "600",
										}}
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
			</main>
		</div>
	);
}
