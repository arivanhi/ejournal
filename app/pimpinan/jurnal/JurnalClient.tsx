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

function chunkArray<T>(arr: T[], size: number): T[][] {
	const chunks = [];
	for (let i = 0; i < arr.length; i += size) {
		chunks.push(arr.slice(i, i + size));
	}
	return chunks;
}

// ============================================================================
// KOMPONEN PEMBANTU PDF (PAGINATION MANUAL)
// ============================================================================
const PageContainer = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
	<div
		style={{
			width: "210mm",
			height: "296mm",
			padding: "15mm 20mm",
			boxSizing: "border-box",
			display: "flex",
			flexDirection: "column",
			pageBreakAfter: isLast ? "auto" : "always",
			backgroundColor: "white",
			color: "black",
			position: "relative",
			overflow: "hidden"
		}}
	>
		{children}
	</div>
);

const PageFooter = ({ current, total }: { current: number; total: number }) => (
	<div style={{ textAlign: "right", fontSize: "10pt", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
		Halaman {current} dari {total}
	</div>
);

const KopSurat = () => (
	<div style={{ paddingBottom: "5px", backgroundColor: "white", marginBottom: "15px", flexShrink: 0 }}>
		<div
			style={{
				display: "flex",
				alignItems: "center",
				borderBottom: "3px solid black",
				paddingBottom: "10px",
				marginBottom: "2px",
			}}
		>
			<img
				src="/logo.jpg"
				alt="Logo SMAN 2 Brebes"
				style={{ width: "80px", height: "80px", objectFit: "contain", margin: "0 20px" }}
			/>
			<div style={{ flex: 1, textAlign: "center" }}>
				<h1
					style={{
						margin: "0 0 4px 0",
						fontSize: "20pt",
						fontWeight: "bold",
						color: "#000",
						fontFamily: '"Times New Roman", Times, serif',
					}}
				>
					SMA NEGERI 2 BREBES
				</h1>
				<p style={{ margin: "2px 0", fontSize: "11pt", color: "#000" }}>Jl. Jend. A. Yani 77 Brebes 52212 Telp. (0283) 671060</p>
				<p style={{ margin: 0, fontSize: "11pt", color: "#000" }}>Website: sman2brebes.sch.id - Email: smandabes@gmail.com</p>
			</div>
			<div style={{ width: "120px" }}></div>
		</div>
		<div style={{ borderBottom: "1px solid black" }}></div>
	</div>
);


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

	// State Modal Nilai
	const [isNilaiModalOpen, setIsNilaiModalOpen] = useState(false);
	const [selectedSesiModal, setSelectedSesiModal] = useState<any>(null);

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

	const chartData = useMemo(() => {
		if (!selectedItem || !selectedItem.detailSesi) return [];
		const sorted = [...selectedItem.detailSesi].sort((a, b) => a.pertemuanKe - b.pertemuanKe);
		const last5 = sorted.slice(-5);

		return last5.map((sesi) => {
			const percentage = selectedItem.totalSiswa > 0 ? Math.round((sesi.hadir / selectedItem.totalSiswa) * 100) : 0;
			return {
				label: `M${sesi.pertemuanKe}`,
				value: percentage,
			};
		});
	}, [selectedItem]);

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

	// --- FUNGSI EXPORT PDF (MARGIN 0, PAGINATION MANUAL) ---
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
					margin: 0, // KUNCI UTAMA: Margin 0 agar tidak terpotong
					filename: filename,
					image: { type: "jpeg", quality: 1 },
					html2canvas: { scale: 2, useCORS: true },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
					pagebreak: { mode: ['css'] } // Mengikuti sistem .html2pdf__page-break
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

	return (
		<>
			{/* === CONTAINER TERSEMBUNYI UNTUK CETAK PDF === */}
			{pdfItemsData.length > 0 && (
				<div style={{ display: "none" }}>
					<div id="pdf-jurnal-content" style={{ width: "100%", backgroundColor: "#fff", color: "#000", fontFamily: "Arial, sans-serif" }}>
						{(() => {
							const MAX_ROWS = 25;
							let globalTotalPages = 0;

							const signatureBlock = (
								<div style={{ textAlign: "right", marginTop: "40px", paddingBottom: "30px" }}>
									<p style={{ margin: 0, fontSize: "10pt" }}>Brebes, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
									<p style={{ margin: "5px 0 50px 0", fontSize: "10pt" }}>Mengetahui,</p>
									<p style={{ margin: 0, fontSize: "10pt", fontWeight: "bold" }}>{user.nama}</p>
									<p style={{ margin: 0, fontSize: "10pt" }}>NIP/NPP: {user.username || "-"}</p>
								</div>
							);

							const pdfItemsChunks = pdfItemsData.map((dataItem) => {
								const siswaChunks = chunkArray(dataItem.siswaList || [], MAX_ROWS);
								const sesiChunks = chunkArray([...(dataItem.detailSesi || [])].sort((a, b) => a.pertemuanKe - b.pertemuanKe), MAX_ROWS);
								if (sesiChunks.length === 0) sesiChunks.push([]);

								const jurnalTugas = (dataItem.detailSesi || []).filter((j: any) => j.tugas && j.tugas.trim() !== "");
								let nilaiTugasChunks: any[][] = [];
								if (jurnalTugas.length > 0) {
									const sortedSiswa = [...(dataItem.siswaList || [])].sort((a: any, b: any) => a.nama.localeCompare(b.nama));
									nilaiTugasChunks = chunkArray(sortedSiswa, MAX_ROWS);
									if (nilaiTugasChunks.length === 0) nilaiTugasChunks.push([]);
								}

								let itemTotalPages = 1; // cover
								itemTotalPages += sesiChunks.length; // Bab A
								itemTotalPages += siswaChunks.length; // Bab B
								itemTotalPages += 1; // Bab C
								itemTotalPages += (jurnalTugas.length === 0 ? 1 : nilaiTugasChunks.length); // Bab D

								globalTotalPages += itemTotalPages;

								return { siswaChunks, sesiChunks, jurnalTugas, nilaiTugasChunks };
							});

							let pageCounter = 1;

							return (
								<>
									{pdfItemsData.map((dataItem, index) => {
										const { siswaChunks, sesiChunks, jurnalTugas, nilaiTugasChunks } = pdfItemsChunks[index];
										const isLastItem = index === pdfItemsData.length - 1;

										const pdfSubheader = (
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
										);

										return (
											<div key={dataItem.id || index}>

												{/* HALAMAN COVER */}
												<PageContainer isLast={false}>
													<div
														style={{
															height: "240mm",
															display: "flex",
															flexDirection: "column",
															justifyContent: "center",
															alignItems: "center",
														}}
													>
														<h2 style={{ fontSize: "16pt", fontWeight: 800, marginBottom: "0.5rem", fontFamily: '"Times New Roman", Times, serif' }}>
															BUKU JURNAL MENGAJAR GURU
														</h2>
														<h1 style={{ fontSize: "24pt", fontWeight: 900, color: "#0a2540", marginBottom: "0.5rem", textTransform: "uppercase", fontFamily: '"Times New Roman", Times, serif', textAlign: "center" }}>
															{dataItem.mapelNama}
														</h1>
														<p style={{ fontSize: "14pt", fontWeight: 600 }}>Kelas {dataItem.kelasNama}</p>

														<div style={{ margin: "3rem 0", display: "flex", justifyContent: "center" }}>
															<img src="/logo.jpg" alt="Logo SMAN 2 Brebes" style={{ width: "160px", height: "160px", objectFit: "contain" }} />
														</div>

														<div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
															<p style={{ fontSize: "12pt", marginBottom: "0.5rem" }}><strong>NAMA GURU:</strong></p>
															<p style={{ fontSize: "16pt", fontWeight: 700, color: "#0a2540", textTransform: "uppercase" }}>{dataItem.guruNama}</p>
															<p style={{ fontSize: "12pt", marginTop: "0.5rem" }}>NPP: {dataItem.guruNpp}</p>
														</div>

														<div style={{ textAlign: "center" }}>
															<p style={{ fontSize: "12pt", marginBottom: "0.5rem" }}><strong>TAHUN PELAJARAN:</strong></p>
															<p style={{ fontSize: "14pt", fontWeight: 700 }}>{dataItem.tahunAjaranAsli}</p>
														</div>

														<div style={{ marginTop: "3rem", textAlign: "center", borderTop: "2px solid #0a2540", paddingTop: "1.5rem", width: "60%", margin: "3rem auto 0 auto" }}>
															<p style={{ fontSize: "12pt", fontWeight: "bold", fontFamily: '"Times New Roman", Times, serif' }}>SMA NEGERI 2 BREBES</p>
														</div>
													</div>
													<PageFooter current={pageCounter++} total={globalTotalPages} />
												</PageContainer>
												<div className="html2pdf__page-break"></div>

												{/* HALAMAN A. RIWAYAT KBM */}
												{sesiChunks.map((chunk: any[], chunkIdx: number) => (
													<div key={`sesi-${chunkIdx}`}>
														<PageContainer isLast={false}>
															<KopSurat />
															{pdfSubheader}
															<h3 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
																A. Riwayat Pelaksanaan KBM {chunkIdx > 0 ? "(Lanjutan)" : ""}
															</h3>
															<table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", marginBottom: "2rem", fontSize: "9pt" }}>
																<thead style={{ display: "table-header-group" }}>
																	<tr>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "5%", textAlign: "center" }}>Ke-</th>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "12%", textAlign: "center" }}>Tanggal</th>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "25%" }}>Materi / Topik</th>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "38%" }}>Catatan KBM</th>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "10%", textAlign: "center" }}>Hadir</th>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "10%", textAlign: "center" }}>Status</th>
																	</tr>
																</thead>
																<tbody>
																	{chunk.length === 0 ? (
																		<tr>
																			<td colSpan={6} style={{ textAlign: "center", padding: "1rem", border: "1px solid #000" }}>Belum ada sesi tercatat.</td>
																		</tr>
																	) : (
																		chunk.map((sesi: any, idx: number) => (
																			<tr key={idx} style={{ pageBreakInside: "avoid" }}>
																				<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", fontWeight: "bold" }}>{sesi.pertemuanKe}</td>
																				<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{sesi.tanggal}</td>
																				<td style={{ border: "1px solid #000", padding: "4px" }}>{sesi.topik || "-"}</td>
																				<td style={{ border: "1px solid #000", padding: "4px" }}>{sesi.catatan || "-"}</td>
																				<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{sesi.hadir}/{dataItem.totalSiswa}</td>
																				<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", color: sesi.status === "TERKIRIM" ? "#10b981" : "#d97706", fontWeight: "bold" }}>{sesi.status}</td>
																			</tr>
																		))
																	)}
																</tbody>
															</table>
															<PageFooter current={pageCounter++} total={globalTotalPages} />
														</PageContainer>
														<div className="html2pdf__page-break"></div>
													</div>
												))}

												{/* HALAMAN B. REKAPITULASI KEHADIRAN */}
												{siswaChunks.map((chunk: any[], chunkIdx: number) => (
													<div key={`siswa-${chunkIdx}`}>
														<PageContainer isLast={false}>
															<KopSurat />
															{pdfSubheader}
															<h3 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
																B. Rekapitulasi Kehadiran Siswa {chunkIdx > 0 ? "(Lanjutan)" : ""}
															</h3>
															<table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", marginBottom: "2rem", fontSize: "9pt" }}>
																<thead style={{ display: "table-header-group" }}>
																	<tr>
																		<th rowSpan={2} style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "5%", textAlign: "center" }}>No</th>
																		<th rowSpan={2} style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "45%" }}>Nama Siswa</th>
																		<th colSpan={4} style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", textAlign: "center" }}>Status Presensi</th>
																		<th rowSpan={2} style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "6px", width: "10%", textAlign: "center" }}>% Hadir</th>
																	</tr>
																	<tr>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "4px", width: "10%", textAlign: "center", color: "#10b981" }}>H</th>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "4px", width: "10%", textAlign: "center", color: "#d97706" }}>S</th>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "4px", width: "10%", textAlign: "center", color: "#d97706" }}>I</th>
																		<th style={{ border: "1px solid #000", backgroundColor: "#f1f5f9", padding: "4px", width: "10%", textAlign: "center", color: "#ef4444" }}>A</th>
																	</tr>
																</thead>
																<tbody>
																	{chunk.map((siswa: any, sIdx: number) => (
																		<tr key={sIdx} style={{ pageBreakInside: "avoid" }}>
																			<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{chunkIdx * MAX_ROWS + sIdx + 1}</td>
																			<td style={{ border: "1px solid #000", padding: "4px" }}>{siswa.nama}</td>
																			<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{siswa.detailKehadiran?.H || 0}</td>
																			<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{siswa.detailKehadiran?.S || 0}</td>
																			<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{siswa.detailKehadiran?.I || 0}</td>
																			<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{siswa.detailKehadiran?.A || 0}</td>
																			<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center", fontWeight: "bold" }}>{siswa.persentase || 0}%</td>
																		</tr>
																	))}
																</tbody>
															</table>
															<PageFooter current={pageCounter++} total={globalTotalPages} />
														</PageContainer>
														<div className="html2pdf__page-break"></div>
													</div>
												))}

												{/* HALAMAN C. ANALISA HASIL KBM */}
												<div>
													<PageContainer isLast={false}>
														<KopSurat />
														{pdfSubheader}
														<h3 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
															C. Analisa Hasil KBM
														</h3>

														{/* --- Chart Render Sederhana untuk PDF --- */}
														<div style={{ border: "1px solid #000", padding: "1rem", marginBottom: "1.5rem" }}>
															<p style={{ fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center", fontSize: "11pt" }}>GRAFIK TREN KEHADIRAN SISWA</p>
															<div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-end", height: "140px", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.5rem", margin: "0 2rem" }}>
																{dataItem.detailSesi.length === 0 ? (
																	<div style={{ color: "#64748b", fontSize: "10pt", alignSelf: "center" }}>Belum ada data.</div>
																) : (
																	dataItem.detailSesi.slice(-5).map((sesi: any, idx: number) => {
																		const pct = dataItem.totalSiswa > 0 ? Math.round((sesi.hadir / dataItem.totalSiswa) * 100) : 0;
																		return (
																			<div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "30px" }}>
																				<span style={{ fontSize: "8pt", fontWeight: "bold", marginBottom: "4px" }}>{pct}%</span>
																				<div style={{ height: "100px", width: "100%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "flex-end" }}>
																					<div style={{ width: "100%", height: `${pct}%`, backgroundColor: pct < 75 ? "#ef4444" : pct < 90 ? "#f59e0b" : "#3b82f6" }}></div>
																				</div>
																				<span style={{ fontSize: "8pt", marginTop: "4px" }}>P-{sesi.pertemuanKe}</span>
																			</div>
																		);
																	})
																)}
															</div>
														</div>

														<div style={{ border: "1px solid #000", padding: "1rem" }}>
															<p><strong>REKAPITULASI CAPAIAN KELAS:</strong></p>
															<p style={{ marginBottom: "1rem" }}>
																Rata-rata kehadiran {dataItem.kelasNama} adalah <strong>{dataItem.persentaseKehadiran}%</strong> selama <strong>{dataItem.terisi} pertemuan</strong>.
															</p>
															<p><strong>RANGKUMAN CATATAN EVALUASI:</strong></p>
															<ul style={{ paddingLeft: "1.5rem", marginBottom: "1rem" }}>
																{(() => {
																	const notes = dataItem.detailSesi.filter((j: any) => j.catatan && j.catatan.trim() !== "");
																	if (notes.length === 0) return <li>Tidak ada catatan.</li>;
																	return notes.map((n: any, i: number) => (
																		<li key={i} style={{ marginBottom: "0.5rem" }}>
																			<strong>P-{n.pertemuanKe} ({n.tanggal}):</strong> {n.catatan}
																		</li>
																	));
																})()}
															</ul>
														</div>
														<PageFooter current={pageCounter++} total={globalTotalPages} />
													</PageContainer>
													<div className="html2pdf__page-break"></div>
												</div>

												{/* HALAMAN D. NILAI TUGAS */}
												{jurnalTugas.length === 0 ? (
													<div>
														<PageContainer isLast={isLastItem}>
															<KopSurat />
															{pdfSubheader}
															<h3 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
																D. Rekapitulasi Nilai Tugas
															</h3>
															<p style={{ fontSize: "10pt" }}>Tidak ada tugas yang diberikan pada periode ini.</p>
															{signatureBlock}
															<PageFooter current={pageCounter++} total={globalTotalPages} />
														</PageContainer>
														{!isLastItem && <div className="html2pdf__page-break"></div>}
													</div>
												) : (
													nilaiTugasChunks.map((chunk: any[], chunkIdx: number) => {
														const isVeryLastPageOfDocument = isLastItem && chunkIdx === nilaiTugasChunks.length - 1;
														const isLastChunkOfThisItem = chunkIdx === nilaiTugasChunks.length - 1;

														return (
															<div key={`tugas-${chunkIdx}`}>
																<PageContainer isLast={isVeryLastPageOfDocument}>
																	<KopSurat />
																	{pdfSubheader}
																	<h3 style={{ fontSize: "12pt", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>
																		D. Rekapitulasi Nilai Tugas {chunkIdx > 0 ? "(Lanjutan)" : ""}
																	</h3>
																	{chunkIdx === 0 && (
																		<p style={{ fontSize: "10pt", marginBottom: "10px" }}>
																			<em>*Daftar Tugas:</em><br />
																			{jurnalTugas.map((t: any, i: number) => (
																				<span key={t.id}><strong>T{i + 1}:</strong> {t.tugas} ({t.tanggal})<br /></span>
																			))}
																		</p>
																	)}
																	<table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", marginBottom: "2rem", fontSize: "9pt" }}>
																		<thead style={{ display: "table-header-group" }}>
																			<tr>
																				<th style={{ width: "5%", border: "1px solid #000", padding: "6px", backgroundColor: "#f1f5f9" }}>No.</th>
																				<th style={{ width: "25%", border: "1px solid #000", padding: "6px", backgroundColor: "#f1f5f9" }}>Nama Siswa</th>
																				<th style={{ width: "10%", border: "1px solid #000", padding: "6px", backgroundColor: "#f1f5f9" }}>NIS</th>
																				{jurnalTugas.map((t: any, i: number) => (
																					<th key={t.id} style={{ textAlign: "center", border: "1px solid #000", padding: "6px", backgroundColor: "#f1f5f9" }}>T{i + 1}</th>
																				))}
																				<th style={{ width: "10%", textAlign: "center", border: "1px solid #000", padding: "6px", backgroundColor: "#f1f5f9" }}>Rata-rata</th>
																			</tr>
																		</thead>
																		<tbody>
																			{chunk.map((siswa: any, idx: number) => {
																				let totalNilai = 0, countTugas = 0;
																				return (
																					<tr key={siswa.id} style={{ pageBreakInside: "avoid" }}>
																						<td style={{ textAlign: "center", border: "1px solid #000", padding: "4px" }}>{chunkIdx * MAX_ROWS + idx + 1}</td>
																						<td style={{ border: "1px solid #000", padding: "4px" }}>{siswa.nama}</td>
																						<td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{siswa.nis}</td>
																						{jurnalTugas.map((t: any) => {
																							const absen = t.presensi?.find((p: any) => p.siswaId === siswa.id);
																							const nilai = absen?.nilaiTugas;
																							if (nilai !== null && nilai !== undefined) {
																								totalNilai += nilai;
																								countTugas++;
																							}
																							return (
																								<td key={t.id} style={{ textAlign: "center", border: "1px solid #000", padding: "4px" }}>
																									{nilai !== null && nilai !== undefined ? nilai : "-"}
																								</td>
																							);
																						})}
																						<td style={{ textAlign: "center", fontWeight: "bold", border: "1px solid #000", padding: "4px" }}>
																							{countTugas > 0 ? Math.round(totalNilai / countTugas) : "-"}
																						</td>
																					</tr>
																				);
																			})}
																		</tbody>
																	</table>

																	{isLastChunkOfThisItem && signatureBlock}

																	<PageFooter current={pageCounter++} total={globalTotalPages} />
																</PageContainer>
																{!isVeryLastPageOfDocument && <div className="html2pdf__page-break"></div>}
															</div>
														);
													})
												)}
											</div>
										);
									})}
								</>
							);
						})()}
					</div>
				</div>
			)}

			{/* MODAL & TOAST UI COMPONENTS (TIDAK ADA PERUBAHAN) */}
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

			{/* === WEB UI CONTENT (DIJAGA ASLI TANPA PERUBAHAN) === */}
			<div className={styles.dashboardContainer}>
				{viewMode === "list" && (
					<div>
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
										setSelectedExportItems(filteredData.map((d: any) => d.id));
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
									<div style={{ overflowX: "auto", width: "100%" }}>
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
													<th style={{ width: "12%" }}>Materi / Topik</th>
													<th style={{ width: "18%" }}>Catatan KBM</th>
													<th style={{ width: "15%" }}>Topik Tugas</th>
													<th style={{ textAlign: "center", width: "10%" }}>Rata Nilai Tugas</th>
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
														<td colSpan={8} className={styles.emptyTable}>
															Tidak ada sesi yang cocok dengan pencarian.
														</td>
													</tr>
												) : (
													paginatedSesi.map((sesi: any) => (
														<tr
															key={sesi.id}
															onClick={() => {
																setSelectedSesiModal(sesi);
																setIsNilaiModalOpen(true);
															}}
															style={{ cursor: "pointer" }}
															className={styles.clickableRow}
														>
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
															<td>
																<div className={styles.topikTitle} style={{ color: "#0f172a" }}>
																	{sesi.tugas || "-"}
																</div>
															</td>
															<td className={styles.tdBoldCenter} style={{ color: "#334155" }}>
																{sesi.rataNilaiTugas !== null && sesi.rataNilaiTugas !== undefined ? sesi.rataNilaiTugas : "-"}
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

			{/* MODAL DETAIL NILAI SISWA */}
			{isNilaiModalOpen && selectedSesiModal && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer} style={{ maxWidth: "600px", width: "95%" }}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Detail Nilai Tugas (Pertemuan {selectedSesiModal.pertemuanKe})</h3>
							<button
								className={styles.modalCloseBtn}
								onClick={() => {
									setIsNilaiModalOpen(false);
									setSelectedSesiModal(null);
								}}
							>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<div style={{ marginBottom: "1rem", backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.5rem" }}>
								<div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.25rem" }}>Topik Tugas:</div>
								<div style={{ fontWeight: 600, color: "#0f172a" }}>{selectedSesiModal.tugas || "-"}</div>
							</div>

							<div style={{ maxHeight: "60vh", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "0.5rem" }}>
								<div style={{ overflowX: "auto", width: "100%" }}>
									<table className={styles.dataTable} style={{ margin: 0, width: "100%" }}>
										<thead style={{ position: "sticky", top: 0, backgroundColor: "#f1f5f9", zIndex: 1 }}>
											<tr>
												<th style={{ width: "10%", padding: "0.75rem", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>No</th>
												<th style={{ width: "50%", padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>Nama Siswa</th>
												<th style={{ width: "20%", padding: "0.75rem", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>NISN</th>
												<th style={{ width: "20%", padding: "0.75rem", textAlign: "center", borderBottom: "1px solid #e2e8f0" }}>Nilai</th>
											</tr>
										</thead>
										<tbody>
											{(() => {
												const sortedSiswa = [...selectedItem.siswaList].sort((a: any, b: any) =>
													a.nama.localeCompare(b.nama),
												);

												return sortedSiswa.map((siswa: any, idx: number) => {
													const absen = selectedSesiModal.presensi?.find((p: any) => p.siswaId === siswa.id);
													const nilai = absen?.nilaiTugas;
													return (
														<tr key={siswa.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
															<td style={{ padding: "0.75rem", textAlign: "center" }}>{idx + 1}</td>
															<td style={{ padding: "0.75rem", fontWeight: 500, color: "#1e293b" }}>{siswa.nama}</td>
															<td style={{ padding: "0.75rem", color: "#64748b" }}>{siswa.nisn}</td>
															<td style={{ padding: "0.75rem", textAlign: "center", fontWeight: "bold", color: "#0f172a" }}>
																{nilai !== null && nilai !== undefined ? nilai : "-"}
															</td>
														</tr>
													);
												});
											})()}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}