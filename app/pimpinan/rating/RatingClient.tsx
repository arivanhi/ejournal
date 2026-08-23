"use client";

import React, { useState, useMemo } from "react";
import { Users, FileBarChart, Calendar, ChevronLeft, ChevronRight, X, Printer, Star } from "lucide-react";
import styles from "./rating.module.css";
import { useRouter } from "next/navigation";

// ============================================================================
// KOMPONEN PEMBANTU PDF (PAGINATION MANUAL & KOP SURAT STANDAR)
// ============================================================================

const PageContainer = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
	<div
		style={{
			width: "210mm",
			height: "296mm", // Sedikit di bawah 297mm untuk mencegah blank page ekstra
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
				<p style={{ margin: 0, fontSize: "10pt", color: "#000" }}>Website: sman2brebes.sch.id - Email: smadabes@gmail.com</p>
			</div>
			<div style={{ width: "120px" }}></div>
		</div>
		<div style={{ borderBottom: "1px solid black" }}></div>
	</div>
);

// Tipe Data
type TahunAjaranData = {
	id: string;
	nama: string;
	isActive: boolean;
	isRatingActive: boolean;
};

type GuruData = {
	id: string;
	nama: string;
	mapelPerTA: Record<string, string[]>;
	kelasPerTA: Record<string, string[]>;
};

type RatingData = {
	id: string;
	guruId: string;
	siswaId: string;
	mapelId: string;
	tahunAjaranId: string;
	rating: number;
	komentar: string | null;
	createdAt: Date;
	siswa: { id: string; user: { nama: string } };
	mapel: { id: string; nama: string };
};

export default function RatingClient({
	user,
	tahunAjaranList,
	dataGuru,
	semuaRating,
	totalSiswaAktif,
}: {
	user: any;
	tahunAjaranList: TahunAjaranData[];
	dataGuru: GuruData[];
	semuaRating: RatingData[];
	totalSiswaAktif: number;
}) {
	const router = useRouter();
	const activeTa = tahunAjaranList.find((t) => t.isActive) || tahunAjaranList[0];

	const [selectedTahunId, setSelectedTahunId] = useState<string>(activeTa?.id || "");
	const [isToggling, setIsToggling] = useState(false);

	// Modal States
	const [showToast, setShowToast] = useState(false);
	const [toastMsg, setToastMsg] = useState("");

	const [showToggleModal, setShowToggleModal] = useState(false);

	const [showPdfModal, setShowPdfModal] = useState(false);
	const [isDownloading, setIsDownloading] = useState(false);

	const [showDetailModal, setShowDetailModal] = useState(false);
	const [detailGuruId, setDetailGuruId] = useState<string | null>(null);

	// Table States
	const [sortKey, setSortKey] = useState<"nama" | "mapel" | "responden" | "rating" | "keterangan">("nama");
	const [sortDesc, setSortDesc] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [searchQuery, setSearchQuery] = useState("");
	const ITEMS_PER_PAGE = 15;

	// Computed Data
	const currentTa = tahunAjaranList.find(t => t.id === selectedTahunId);
	const isCurrentTaActive = currentTa?.isActive;

	const ratingFiltered = useMemo(() => {
		return semuaRating.filter(r => r.tahunAjaranId === selectedTahunId);
	}, [semuaRating, selectedTahunId]);

	const tableData = useMemo(() => {
		return dataGuru.map(guru => {
			const ratingsGuru = ratingFiltered.filter(r => r.guruId === guru.id);

			// Mapel
			const assignedMapel = guru.mapelPerTA[selectedTahunId] || [];
			const mapelString = assignedMapel.length > 0 ? assignedMapel.join(", ") : "-";

			// Kelas
			const assignedKelas = guru.kelasPerTA[selectedTahunId] || [];
			const kelasString = assignedKelas.length > 0 ? assignedKelas.join(", ") : "-";

			// Responden
			const totalResponden = ratingsGuru.length;

			// Rata-rata
			const avgRating = totalResponden > 0
				? ratingsGuru.reduce((sum, r) => sum + r.rating, 0) / totalResponden
				: 0;

			// Keterangan
			let keterangan = "-";
			if (totalResponden > 0) {
				if (avgRating >= 4.0) keterangan = "Bagus";
				else if (avgRating >= 3.0) keterangan = "Sedang";
				else keterangan = "Jelek";
			}

			return {
				guruId: guru.id,
				nama: guru.nama,
				mapel: mapelString,
				kelas: kelasString,
				responden: totalResponden,
				rating: avgRating,
				keterangan,
				ratings: ratingsGuru
			};
		}).filter(d => d.nama.toLowerCase().includes(searchQuery.toLowerCase()));
	}, [dataGuru, ratingFiltered, searchQuery]);

	// Sorting
	const sortedTableData = useMemo(() => {
		return [...tableData].sort((a, b) => {
			let valA: any = a[sortKey];
			let valB: any = b[sortKey];

			if (typeof valA === "string") valA = valA.toLowerCase();
			if (typeof valB === "string") valB = valB.toLowerCase();

			if (valA < valB) return sortDesc ? 1 : -1;
			if (valA > valB) return sortDesc ? -1 : 1;
			return 0;
		});
	}, [tableData, sortKey, sortDesc]);

	// Pagination
	const totalPages = Math.ceil(sortedTableData.length / ITEMS_PER_PAGE) || 1;
	const currentTableData = sortedTableData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

	// Summary Cards
	const totalGuruDinilai = tableData.filter(d => d.responden > 0).length;
	const totalGuruAll = dataGuru.length;

	const avgRatingSekolah = tableData.reduce((sum, d) => sum + d.rating, 0) / (totalGuruDinilai || 1);

	const partisipanSet = new Set(ratingFiltered.map(r => r.siswaId));
	const pctPartisipasi = totalSiswaAktif > 0 ? Math.round((partisipanSet.size / totalSiswaAktif) * 100) : 0;

	const handleSort = (key: typeof sortKey) => {
		if (sortKey === key) {
			setSortDesc(!sortDesc);
		} else {
			setSortKey(key);
			setSortDesc(false);
		}
	};

	const showNotification = (msg: string) => {
		setToastMsg(msg);
		setShowToast(true);
		setTimeout(() => setShowToast(false), 3000);
	};

	const handleToggleRating = async () => {
		if (!currentTa) return;
		setIsToggling(true);
		try {
			const res = await fetch("/api/rating/toggle", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					tahunAjaranId: currentTa.id,
					isRatingActive: !currentTa.isRatingActive
				}),
			});
			if (res.ok) {
				showNotification("Status penilaian berhasil diubah!");
				router.refresh();
			} else {
				alert("Gagal merubah status penilaian.");
			}
		} catch (e) {
			console.error(e);
		} finally {
			setIsToggling(false);
			setShowToggleModal(false);
		}
	};

	// ============================================================================
	// LOGIKA DOWNLOAD PDF
	// ============================================================================

	// VARIABEL KONTROL: Ubah angka 15 di bawah ini untuk mengatur batas maksimal jumlah data per halaman PDF
	const PDF_MAX_ROWS = 15;

	const chunkArray = (arr: any[], size: number) => {
		return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
	};

	const handleDownloadPdf = async () => {
		setIsDownloading(true);

		// Beri waktu sejenak agar teks tombol di UI sempat berubah menjadi "Memproses PDF..."
		setTimeout(async () => {
			try {
				const html2pdf = (await import("html2pdf.js")).default;
				const element = document.getElementById("rating-pdf-content");
				const opt = {
					margin: 0, // Wajib 0 agar ukuran PageContainer paten
					filename: `Laporan_Rating_Guru_${currentTa?.nama.replace(/ /g, "_")}.pdf`,
					image: { type: "jpeg" as const, quality: 1 },
					html2canvas: { scale: 2, useCORS: true },
					jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
					pagebreak: { mode: ['css'] } // Page-break otomatis ditangani oleh isLast pada PageContainer
				};
				await html2pdf().set(opt).from(element).save();
			} catch (error) {
				console.error("Gagal cetak PDF:", error);
				alert("Terjadi kesalahan saat memproses PDF.");
			} finally {
				setIsDownloading(false);
				setShowPdfModal(false);
			}
		}, 300);
	};

	return (
		<div className={styles.container}>
			{/* TOAST NOTIFICATION */}
			{showToast && (
				<div className={styles.toast}>
					{toastMsg}
				</div>
			)}

			{/* HEADER */}
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>Manajemen Penilaian Guru</h1>
					<p className={styles.subtitle}>Kelola dan pantau penilaian kinerja guru oleh siswa secara berkala</p>
				</div>
				<div className={styles.headerActions}>
					<select
						className={styles.taSelect}
						value={selectedTahunId}
						onChange={(e) => {
							setSelectedTahunId(e.target.value);
							setCurrentPage(1);
						}}
					>
						{tahunAjaranList.map(ta => (
							<option key={ta.id} value={ta.id}>{ta.nama}</option>
						))}
					</select>
					<button className={styles.btnPrimary} onClick={() => setShowPdfModal(true)}>
						<Printer size={16} /> Laporan Penilaian
					</button>
				</div>
			</div>

			{/* CARD AKTIVASI */}
			<div className={styles.activationCard}>
				<div>
					<h3 className={styles.activationTitle}>
						Aktivasi Program Penilaian Guru
						<span className={`${styles.statusBadge} ${currentTa?.isRatingActive ? styles.bgGreen : styles.bgRed}`}>
							{currentTa?.isRatingActive ? "Status: Aktif" : "Status: Nonaktif"}
						</span>
					</h3>
					<p className={styles.activationDesc}>Izinkan siswa untuk memberikan penilaian kepada guru mata pelajaran mereka.</p>
				</div>
				<button
					className={currentTa?.isRatingActive ? styles.btnDanger : styles.btnDark}
					disabled={!isCurrentTaActive}
					onClick={() => setShowToggleModal(true)}
					title={!isCurrentTaActive ? "Hanya bisa mengubah status pada tahun ajaran aktif" : ""}
				>
					{currentTa?.isRatingActive ? "Nonaktifkan Penilaian" : "Aktifkan Penilaian"}
				</button>
			</div>

			{/* SUMMARY CARDS */}
			<div className={styles.summaryGrid}>
				<div className={styles.summaryCard}>
					<div className={styles.summaryHeader}>
						<Users size={20} color="#64748b" /> Total Guru Dinilai
					</div>
					<div className={styles.summaryValue}>
						<span className={styles.valueMain}>{totalGuruDinilai}</span>
						<span className={styles.valueSub}>/ {totalGuruAll}</span>
					</div>
				</div>
				<div className={styles.summaryCard}>
					<div className={styles.summaryHeader}>
						<FileBarChart size={20} color="#64748b" /> Rata-rata Penilaian Guru
					</div>
					<div className={styles.summaryValue}>
						<span className={styles.valueMain}>{avgRatingSekolah.toFixed(1)}</span>
						<span className={styles.valueSub}>/ 5.0</span>
						<div className={styles.stars}>
							{[...Array(5)].map((_, i) => (
								<Star key={i} size={16} fill={i < Math.round(avgRatingSekolah) ? "#fbbf24" : "none"} color="#fbbf24" />
							))}
						</div>
					</div>
				</div>
				<div className={styles.summaryCard}>
					<div className={styles.summaryHeader}>
						<Calendar size={20} color="#64748b" /> Jumlah Partisipasi Siswa
					</div>
					<div className={styles.summaryValue}>
						<span className={styles.valueMain}>{pctPartisipasi}%</span>
					</div>
					<div className={styles.progressTrack}>
						<div className={styles.progressBar} style={{ width: `${pctPartisipasi}%` }}></div>
					</div>
				</div>
			</div>

			{/* TABLE */}
			<div className={styles.tableCard}>
				<div className={styles.tableHeader}>
					<h3 className={styles.tableTitle}>Daftar Penilaian Guru</h3>
					<input
						type="text"
						placeholder="Cari nama guru..."
						className={styles.searchInput}
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							setCurrentPage(1);
						}}
					/>
				</div>
				<div className={styles.tableResponsive}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th style={{ width: "5%" }}>No</th>
								<th onClick={() => handleSort("nama")} style={{ cursor: "pointer", width: "25%" }}>
									Nama Guru {sortKey === "nama" && (sortDesc ? "▼" : "▲")}
								</th>
								<th onClick={() => handleSort("mapel")} style={{ cursor: "pointer", width: "20%" }}>
									Mata Pelajaran {sortKey === "mapel" && (sortDesc ? "▼" : "▲")}
								</th>
								<th onClick={() => handleSort("kelas")} style={{ cursor: "pointer", width: "15%" }}>
									Kelas Ajar {sortKey === "kelas" && (sortDesc ? "▼" : "▲")}
								</th>
								<th onClick={() => handleSort("responden")} style={{ cursor: "pointer", width: "15%", textAlign: "center" }}>
									Total Responden {sortKey === "responden" && (sortDesc ? "▼" : "▲")}
								</th>
								<th onClick={() => handleSort("rating")} style={{ cursor: "pointer", width: "10%", textAlign: "center" }}>
									Rata-rata Penilaian {sortKey === "rating" && (sortDesc ? "▼" : "▲")}
								</th>
								<th onClick={() => handleSort("keterangan")} style={{ cursor: "pointer", width: "10%", textAlign: "center" }}>
									Keterangan {sortKey === "keterangan" && (sortDesc ? "▼" : "▲")}
								</th>
								<th style={{ width: "10%", textAlign: "center" }}>Aksi</th>
							</tr>
						</thead>
						<tbody>
							{currentTableData.length === 0 ? (
								<tr>
									<td colSpan={8} style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
										Belum ada data Penilaian.
									</td>
								</tr>
							) : (
								currentTableData.map((row, idx) => (
									<tr key={row.guruId}>
										<td style={{ textAlign: "center" }}>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
										<td style={{ fontWeight: "bold" }}>{row.nama}</td>
										<td>{row.mapel}</td>
										<td>{row.kelas}</td>
										<td style={{ textAlign: "center" }}>{row.responden}</td>
										<td style={{ textAlign: "center", fontWeight: "bold" }}>
											<Star size={12} fill="#fbbf24" color="#fbbf24" style={{ marginRight: 4 }} />
											{row.rating > 0 ? row.rating.toFixed(1) : "-"}
										</td>
										<td style={{ textAlign: "center" }}>
											<span className={styles.badge} data-val={row.keterangan}>{row.keterangan}</span>
										</td>
										<td style={{ textAlign: "center" }}>
											<button
												className={styles.btnOutlineSmall}
												onClick={() => {
													setDetailGuruId(row.guruId);
													setShowDetailModal(true);
												}}
											>
												Detail
											</button>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
				<div className={styles.pagination}>
					<button
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
					>
						<ChevronLeft size={16} />
					</button>
					<span>Halaman {currentPage} dari {totalPages}</span>
					<button
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
					>
						<ChevronRight size={16} />
					</button>
				</div>
			</div>

			{/* MODAL TOGGLE RATING */}
			{showToggleModal && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<h3 className={styles.modalTitle}>Konfirmasi Aktivasi</h3>
						<p className={styles.modalDesc}>
							Apakah Anda yakin ingin {currentTa?.isRatingActive ? "menonaktifkan" : "mengaktifkan"} program penilaian untuk tahun ajaran ini?
						</p>
						<div className={styles.modalFooter}>
							<button className={styles.btnOutline} onClick={() => setShowToggleModal(false)}>Batal</button>
							<button className={styles.btnPrimary} onClick={handleToggleRating} disabled={isToggling}>
								{isToggling ? "Memproses..." : "Ya, Lanjutkan"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* MODAL DETAIL GURU */}
			{showDetailModal && detailGuruId && (() => {
				const guru = tableData.find(d => d.guruId === detailGuruId);
				if (!guru) return null;
				return (
					<div className={styles.modalOverlay}>
						<div className={styles.modalContainerLarge}>
							<div className={styles.modalHeader}>
								<h3 className={styles.modalTitle}>Detail Penilaian: {guru.nama}</h3>
								<button className={styles.modalClose} onClick={() => setShowDetailModal(false)}><X size={20} /></button>
							</div>
							<div className={styles.modalBodyScroll}>
								<table className={styles.table}>
									<thead>
										<tr>
											<th>No</th>
											<th>Nama Siswa</th>
											<th>Mata Pelajaran</th>
											<th style={{ textAlign: "center" }}>Penilaian</th>
											<th>Komentar</th>
										</tr>
									</thead>
									<tbody>
										{guru.ratings.length === 0 ? (
											<tr><td colSpan={5} style={{ textAlign: "center" }}>Tidak ada Penilaian</td></tr>
										) : (
											guru.ratings.map((r, i) => (
												<tr key={r.id}>
													<td>{i + 1}</td>
													<td>{r.siswa.user.nama}</td>
													<td>{r.mapel.nama}</td>
													<td style={{ textAlign: "center", fontWeight: "bold" }}>
														<Star size={12} fill="#fbbf24" color="#fbbf24" style={{ marginRight: 4 }} />{r.rating}
													</td>
													<td>{r.komentar || "-"}</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					</div>
				);
			})()}

			{/* MODAL EXPORT PDF */}
			{showPdfModal && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<h3 className={styles.modalTitle}>Laporan Penilaian Guru</h3>
						<p className={styles.modalDesc}>Ekspor rekapitulasi penilaian guru untuk tahun ajaran {currentTa?.nama}.</p>
						<div className={styles.modalFooter}>
							<button className={styles.btnOutline} onClick={() => setShowPdfModal(false)}>Batal</button>
							<button className={styles.btnPrimary} onClick={handleDownloadPdf} disabled={isDownloading}>
								{isDownloading ? "Memproses PDF..." : "Unduh PDF"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* ================================================================= */}
			{/* AREA TERSEMBUNYI UNTUK CETAK PDF (SISTEM PAGINATION MANUAL) */}
			{/* ================================================================= */}
			<div style={{ position: "absolute", top: "-9999px", left: "-9999px", visibility: "hidden", zIndex: -1 }}>
				<div id="rating-pdf-content" style={{ width: "210mm", backgroundColor: "#fff", color: "#000", fontFamily: "Arial, sans-serif" }}>
					{(() => {
						const chunks = chunkArray(sortedTableData, PDF_MAX_ROWS);
						const totalPages = chunks.length === 0 ? 1 : chunks.length;

						if (chunks.length === 0) {
							return (
								<PageContainer isLast={true}>
									<KopSurat />
									<h3 style={{ textAlign: "center", fontSize: "14pt", margin: "10px 0", fontWeight: "bold", textTransform: "uppercase" }}>
										LAPORAN PENILAIAN GURU
									</h3>
									<p style={{ textAlign: "center", margin: 0, fontSize: "11pt" }}>Tahun Ajaran: {currentTa?.nama}</p>
									<p style={{ textAlign: "center", marginTop: "50px", color: "#64748b" }}>Tidak ada data penilaian.</p>
									<PageFooter current={1} total={1} />
								</PageContainer>
							);
						}

						return chunks.map((chunk, chunkIdx) => (
							<div key={chunkIdx}>
								<PageContainer isLast={chunkIdx === chunks.length - 1}>
									<KopSurat />

									{/* Kop & Judul hanya di halaman pertama */}
									{chunkIdx === 0 ? (
										<div style={{ marginBottom: "20px" }}>
											<h3 style={{ textAlign: "center", fontSize: "14pt", margin: "10px 0", fontWeight: "bold", textTransform: "uppercase" }}>
												LAPORAN PENILAIAN GURU
											</h3>
											<p style={{ textAlign: "center", margin: 0, fontSize: "11pt" }}>Tahun Ajaran: {currentTa?.nama}</p>
										</div>
									) : (
										<h3 style={{ fontSize: "12pt", margin: "10px 0", fontWeight: "bold", textTransform: "uppercase" }}>
											LAPORAN PENILAIAN GURU (Lanjutan)
										</h3>
									)}

									<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt", marginTop: "10px" }}>
										<thead style={{ display: "table-header-group" }}>
											<tr style={{ backgroundColor: "#f1f5f9" }}>
												<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%", textAlign: "center" }}>No</th>
												<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "25%", textAlign: "left" }}>Nama Guru</th>
												<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "20%", textAlign: "left" }}>Mata Pelajaran</th>
												<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%", textAlign: "left" }}>Kelas Ajar</th>
												<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "10%", textAlign: "center" }}>Responden</th>
												<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "10%", textAlign: "center" }}>Penilaian</th>
												<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%", textAlign: "center" }}>Keterangan</th>
											</tr>
										</thead>
										<tbody>
											{chunk.map((row: any, i: number) => (
												<tr key={row.guruId}>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{(chunkIdx * PDF_MAX_ROWS) + i + 1}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", fontWeight: "bold" }}>{row.nama}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{row.mapel}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{row.kelas}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{row.responden}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center", fontWeight: "bold" }}>{row.rating > 0 ? row.rating.toFixed(1) : "-"}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{row.keterangan}</td>
												</tr>
											))}
										</tbody>
									</table>

									<PageFooter current={chunkIdx + 1} total={totalPages} />
								</PageContainer>
							</div>
						));
					})()}
				</div>
			</div>
		</div>
	);
}