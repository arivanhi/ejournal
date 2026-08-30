"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buatJurnalKonselingAction, hapusJurnalKonselingAction, editJurnalKonselingAction, getSiswaByKelas } from "./actions";
import { Plus, Trash2, X, ChevronLeft, ChevronRight, Pencil, Download, FileBarChart } from "lucide-react";
import styles from "./jurnal-bk.module.css";
import Select from "react-select";

const ITEMS_PER_PAGE = 15;

export default function JurnalKonselingClient({
	riwayat,
	daftarTahunAjaran,
	selectedTaId,
	daftarKelas,
	guruId,
	guruData,
	kepsekData,
}: {
	riwayat: any[];
	daftarTahunAjaran: any[];
	selectedTaId: string;
	daftarKelas: any[];
	guruId: string;
	guruData: any;
	kepsekData: any;
}) {
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [siswaList, setSiswaList] = useState<any[]>([]);
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [editId, setEditId] = useState<string | null>(null);

	// PDF Export State
	const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
	const [pdfStartDate, setPdfStartDate] = useState("");
	const [pdfEndDate, setPdfEndDate] = useState("");
	const [isExporting, setIsExporting] = useState(false);
	const MAX_ROWS_PDF = 5;

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);

	// Form State
	const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
	const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
	const [jenisBimbingan, setJenisBimbingan] = useState("");
	const [materi, setMateri] = useState("");
	const [penilaianSegera, setPenilaianSegera] = useState("");
	const [selectedSiswaOptions, setSelectedSiswaOptions] = useState<any[]>([]);

	useEffect(() => {
		if (selectedKelasIds.length > 0) {
			getSiswaByKelas(selectedKelasIds, selectedTaId).then((data) => {
				const formattedOptions = data.map(siswa => ({
					value: siswa.id,
					label: `${siswa.user.nama} (${siswa.kelasNama})`
				}));
				setSiswaList(formattedOptions);
				// Filter selectedSiswaOptions to only include those still in siswaList
				setSelectedSiswaOptions(prev => prev.filter(p => formattedOptions.some(f => f.value === p.value)));
			});
		} else {
			setSiswaList([]);
			setSelectedSiswaOptions([]);
		}
	}, [selectedKelasIds, selectedTaId]);

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => {
			setToastMessage(null);
		}, 3000);
	};

	const handleKelasToggle = (id: string) => {
		setSelectedKelasIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
		);
	};

	const openCreateModal = () => {
		setEditId(null);
		setTanggal(new Date().toISOString().split("T")[0]);
		setSelectedKelasIds([]);
		setJenisBimbingan("");
		setMateri("");
		setPenilaianSegera("");
		setSelectedSiswaOptions([]);
		setIsModalOpen(true);
	};

	const openEditModal = (item: any) => {
		setEditId(item.id);
		setTanggal(new Date(item.tanggal).toISOString().split("T")[0]);
		setJenisBimbingan(item.jenisBimbingan);
		setMateri(item.materi);
		setPenilaianSegera(item.penilaianSegera);

		const unikKelasIds = new Set<string>();
		const initialSiswaOpts = item.sasaranSiswa.map((s: any) => {
			const kelasId = s.siswa.riwayatKelas?.[0]?.kelas?.id;
			const kelasNama = s.siswa.riwayatKelas?.[0]?.kelas?.nama || "Unknown";
			if (kelasId) unikKelasIds.add(kelasId);
			return {
				value: s.siswa.id,
				label: `${s.siswa.user.nama} (${kelasNama})`
			};
		});

		setSelectedKelasIds(Array.from(unikKelasIds));
		setSelectedSiswaOptions(initialSiswaOpts);
		setIsModalOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (selectedSiswaOptions.length === 0) return alert("Pilih minimal 1 siswa sasaran!");
		if (!jenisBimbingan || !materi || !penilaianSegera) return alert("Lengkapi semua field text!");

		setLoading(true);
		const sasaranSiswaIds = selectedSiswaOptions.map(opt => opt.value);

		let res;
		if (editId) {
			res = await editJurnalKonselingAction({
				id: editId,
				tanggal,
				jenisBimbingan,
				materi,
				penilaianSegera,
				sasaranSiswaIds,
			});
		} else {
			res = await buatJurnalKonselingAction({
				tanggal,
				guruId,
				tahunAjaranId: selectedTaId,
				jenisBimbingan,
				materi,
				penilaianSegera,
				sasaranSiswaIds,
			});
		}

		setLoading(false);

		if (res.success) {
			showToast("Berhasil disimpan!");
			setIsModalOpen(false);
			setSelectedKelasIds([]);
			setJenisBimbingan("");
			setMateri("");
			setPenilaianSegera("");
			setSelectedSiswaOptions([]);
		} else {
			alert(res.message);
		}
	};

	const handleDelete = async (id: string) => {
		if (confirm("Yakin ingin menghapus riwayat ini?")) {
			await hapusJurnalKonselingAction(id);
			showToast("Data berhasil dihapus!");
		}
	};

	// Helper to format sasaran string (group by class)
	const formatSasaran = (sasaranSiswa: any[]) => {
		const grouped: Record<string, string[]> = {};
		sasaranSiswa.forEach((s: any) => {
			const kelas = s.siswa.riwayatKelas?.[0]?.kelas?.nama || "Unknown";
			const nama = s.siswa.user.nama;
			if (!grouped[kelas]) grouped[kelas] = [];
			grouped[kelas].push(nama);
		});

		const lines = Object.keys(grouped).map(kelas => {
			return `${kelas}:\n` + grouped[kelas].join(", ");
		});

		return lines.join("\n\n");
	};

	// Pagination Logic
	const totalPages = Math.ceil(riwayat.length / ITEMS_PER_PAGE);
	const paginatedRiwayat = riwayat.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE
	);

	// --- PDF EXPORT LOGIC ---
	const jurnalForPdf = riwayat.filter((j: any) => {
		if (!pdfStartDate || !pdfEndDate) return false;
		// Ensure j.tanggal is handled whether it's a string or Date object
		const dateStr = new Date(j.tanggal).toISOString().split("T")[0];
		return dateStr >= pdfStartDate && dateStr <= pdfEndDate;
	});

	const chunkArray = (arr: any[], size: number) => {
		const result = [];
		for (let i = 0; i < arr.length; i += size) {
			result.push(arr.slice(i, i + size));
		}
		return result;
	};

	const pdfChunks = chunkArray(jurnalForPdf, MAX_ROWS_PDF);
	const totalPdfPages = 1 + (jurnalForPdf.length === 0 ? 1 : pdfChunks.length) + 1; // Cover + Tabel + TTD

	const handleExportPdf = async () => {
		if (!pdfStartDate || !pdfEndDate) {
			alert("Silakan lengkapi rentang tanggal.");
			return;
		}
		setIsExporting(true);
		showToast("Memproses PDF...");

		setTimeout(async () => {
			try {
				const html2pdf = (await import("html2pdf.js")).default;
				const element = document.getElementById("pdf-jurnal-konseling");

				const taNama = daftarTahunAjaran.find(t => t.id === selectedTaId)?.nama || "TA";
				const formatTgl = (d: string) => new Date(d).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
				const periode = `${formatTgl(pdfStartDate)}`;

				const opt = {
					margin: 0,
					filename: `Laporan_Konseling_${taNama.replace(/\//g, "-")}_${periode}.pdf`,
					image: { type: "jpeg", quality: 0.98 },
					html2canvas: { scale: 2, useCORS: true },
					jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
				};

				await html2pdf().set(opt).from(element).save();
				showToast("PDF berhasil diunduh!");
			} catch (error) {
				console.error("Gagal men-generate PDF:", error);
				alert("Terjadi kesalahan saat memproses PDF.");
			} finally {
				setIsExporting(false);
				setIsPdfModalOpen(false);
			}
		}, 500);
	};

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

	const PageFooter = ({ current, total }: { current: number; total: number }) => (
		<div style={{ textAlign: "right", fontSize: "10pt", marginTop: "auto", paddingTop: "10px", borderTop: "1px solid #e2e8f0" }}>
			Halaman {current} dari {total}
		</div>
	);

	const PdfPageContainer = ({ children, isLast }: { children: React.ReactNode; isLast?: boolean }) => (
		<div
			style={{
				width: "296mm",
				height: "209mm",
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

	const tglSekarang = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
	const taActiveNama = daftarTahunAjaran.find(t => t.id === selectedTaId)?.nama || "";

	return (
		<div className={styles.pageContainer}>
			<div className={styles.header}>
				<h1 className={styles.title}>Jurnal Konseling</h1>
				<p className={styles.subtitle}>Kelola riwayat layanan Bimbingan dan Konseling</p>
			</div>

			<div className={styles.controls}>
				<select
					className={styles.select}
					value={selectedTaId}
					onChange={(e) => {
						setCurrentPage(1);
						router.push(`/teacher/jurnal-konseling?ta=${e.target.value}`);
					}}
				>
					{daftarTahunAjaran.map((ta) => (
						<option key={ta.id} value={ta.id}>
							{ta.nama} {ta.isActive ? "(Aktif)" : ""}
						</option>
					))}
				</select>
				<div style={{ display: 'flex', gap: '12px' }}>
					<button
						onClick={() => setIsPdfModalOpen(true)}
						className={styles.btnPrimary}
						style={{ backgroundColor: '#10b981' }}
					>
						<Download size={16} /> Ekspor PDF
					</button>
					<button
						onClick={openCreateModal}
						className={styles.btnPrimary}
					>
						<Plus size={16} /> Jurnal Baru
					</button>
				</div>
			</div>

			<div className={styles.tableContainer}>
				<table className={styles.table}>
					<thead>
						<tr>
							<th style={{ width: '40px' }}>No</th>
							<th style={{ width: '120px' }}>Hari/Tanggal</th>
							<th style={{ width: '200px' }}>Sasaran</th>
							<th style={{ width: '180px' }}>Jenis Bimbingan & Layanan</th>
							<th>Materi</th>
							<th>Penilaian Segera</th>
							<th style={{ width: '60px' }}>Aksi</th>
						</tr>
					</thead>
					<tbody>
						{riwayat.length === 0 ? (
							<tr>
								<td colSpan={7} className={styles.emptyState}>
									Tidak ada riwayat konseling pada Tahun Ajaran ini.
								</td>
							</tr>
						) : (
							paginatedRiwayat.map((item, idx) => {
								const dateObj = new Date(item.tanggal);
								const hariTanggal = dateObj.toLocaleDateString("id-ID", {
									weekday: "long",
									day: "numeric",
									month: "long",
									year: "numeric"
								});

								const sasaran = formatSasaran(item.sasaranSiswa);

								return (
									<tr key={item.id}>
										<td style={{ textAlign: 'center' }}>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
										<td>{hariTanggal}</td>
										<td style={{ whiteSpace: 'pre-wrap', fontSize: '13px' }}>{sasaran}</td>
										<td>{item.jenisBimbingan}</td>
										<td style={{ whiteSpace: 'pre-wrap' }}>{item.materi}</td>
										<td style={{ whiteSpace: 'pre-wrap' }}>{item.penilaianSegera}</td>
										<td className={styles.actionCell}>
											<button
												onClick={() => openEditModal(item)}
												className={styles.btnEdit}
												title="Edit"
											>
												<Pencil size={16} />
											</button>
											<button
												onClick={() => handleDelete(item.id)}
												className={styles.btnDelete}
												title="Hapus"
											>
												<Trash2 size={16} />
											</button>
										</td>
									</tr>
								);
							})
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination Controls */}
			{totalPages > 1 && (
				<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '8px', alignItems: 'center' }}>
					<button
						className={styles.btnPrimary}
						disabled={currentPage === 1}
						onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
					>
						<ChevronLeft size={16} /> Sebelumnya
					</button>
					<span style={{ fontSize: '14px', margin: '0 8px' }}>
						Halaman {currentPage} dari {totalPages}
					</span>
					<button
						className={styles.btnPrimary}
						disabled={currentPage === totalPages}
						onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
					>
						Selanjutnya <ChevronRight size={16} />
					</button>
				</div>
			)}

			{/* Modal Form Jurnal */}
			{isModalOpen && (
				<div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
					<div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>{editId ? "Edit Jurnal" : "Jurnal Baru"}</h2>
							<button className={styles.btnClose} onClick={() => setIsModalOpen(false)}>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSubmit}>
							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Tanggal</label>
								<input
									type="date"
									value={tanggal}
									onChange={(e) => setTanggal(e.target.value)}
									className={styles.formControl}
									required
								/>
							</div>

							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Pilih Kelas Terlibat (Bisa lebih dari 1)</label>
								<div className={styles.checkboxGrid} style={{ maxHeight: '120px' }}>
									{daftarKelas.map(k => (
										<label key={k.id} className={styles.checkboxLabel}>
											<input
												type="checkbox"
												checked={selectedKelasIds.includes(k.id)}
												onChange={() => handleKelasToggle(k.id)}
											/>
											<span>{k.nama}</span>
										</label>
									))}
								</div>
							</div>

							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Pilih Siswa Sasaran</label>
								<Select
									isMulti
									name="siswa"
									options={siswaList}
									className="basic-multi-select"
									classNamePrefix="select"
									placeholder={selectedKelasIds.length === 0 ? "Centang kelas di atas dulu..." : "Ketik untuk mencari nama siswa..."}
									value={selectedSiswaOptions}
									onChange={(selected: any) => setSelectedSiswaOptions(selected || [])}
									isDisabled={selectedKelasIds.length === 0}
									noOptionsMessage={() => "Siswa tidak ditemukan"}
								/>
							</div>

							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Jenis Bimbingan & Layanan</label>
								<input
									type="text"
									placeholder="Contoh: Pribadi Belajar, Mediasi, dll"
									value={jenisBimbingan}
									onChange={(e) => setJenisBimbingan(e.target.value)}
									className={styles.formControl}
									required
								/>
							</div>

							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Materi</label>
								<textarea
									placeholder="Topik atau materi yang dibahas..."
									value={materi}
									onChange={(e) => setMateri(e.target.value)}
									className={styles.formControl}
									required
								/>
							</div>

							<div className={styles.formGroup}>
								<label className={styles.formLabel}>Penilaian Segera</label>
								<textarea
									placeholder="Tindak lanjut atau hasil dari layanan..."
									value={penilaianSegera}
									onChange={(e) => setPenilaianSegera(e.target.value)}
									className={styles.formControl}
									required
								/>
							</div>

							<div className={styles.modalFooter}>
								<button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnCancel}>Batal</button>
								<button type="submit" disabled={loading} className={styles.btnSubmit}>
									{loading ? "Menyimpan..." : "Simpan"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Modal PDF Export */}
			{isPdfModalOpen && (
				<div className={styles.modalOverlay} onClick={() => setIsPdfModalOpen(false)}>
					<div className={styles.modalContent} style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>Ekspor Laporan PDF</h2>
							<button className={styles.btnClose} onClick={() => setIsPdfModalOpen(false)}>
								<X size={20} />
							</button>
						</div>

						<div className={styles.formGroup}>
							<label className={styles.formLabel}>Tanggal Mulai</label>
							<input
								type="date"
								value={pdfStartDate}
								onChange={(e) => setPdfStartDate(e.target.value)}
								className={styles.formControl}
							/>
						</div>
						<div className={styles.formGroup}>
							<label className={styles.formLabel}>Tanggal Akhir</label>
							<input
								type="date"
								value={pdfEndDate}
								onChange={(e) => setPdfEndDate(e.target.value)}
								className={styles.formControl}
							/>
						</div>

						<div className={styles.modalFooter}>
							<button type="button" onClick={() => setIsPdfModalOpen(false)} className={styles.btnCancel}>Batal</button>
							<button type="button" onClick={handleExportPdf} disabled={isExporting} className={styles.btnSubmit}>
								{isExporting ? "Memproses..." : "Ya, Ekspor"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Template PDF (Tersembunyi) */}
			<div style={{ position: "absolute", top: "-9999px", left: "-9999px", visibility: "hidden", zIndex: -1 }}>
				<div id="pdf-jurnal-konseling" style={{ width: "297mm", backgroundColor: "#fff", color: "#000", fontFamily: "Arial, sans-serif" }}>

					{/* Halaman 1: Cover */}
					<PdfPageContainer>
						<div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
							<h2 style={{ fontSize: "18pt", fontWeight: 800, marginBottom: "0.5rem" }}>
								LAPORAN JURNAL BIMBINGAN DAN KONSELING
							</h2>
							<h1 style={{ fontSize: "24pt", fontWeight: 900, color: "#0a2540", marginBottom: "0.5rem", textAlign: "center" }}>
								SMAN 2 BREBES
							</h1>
							<p style={{ fontSize: "12pt", fontWeight: 600 }}>Tahun Akademik {taActiveNama}</p>

							<p style={{ fontSize: "12pt", fontWeight: 600, marginTop: "0.5rem", color: "#dc2626" }}>
								Periode: {pdfStartDate && pdfEndDate ? `${new Date(pdfStartDate).toLocaleDateString("id-ID")} - ${new Date(pdfEndDate).toLocaleDateString("id-ID")}` : "-"}
							</p>

							<div style={{ margin: "3rem 0", display: "flex", justifyContent: "center" }}>
								<img src="/logo.jpg" alt="Logo SMAN 2 Brebes" style={{ width: "160px", height: "160px", objectFit: "contain" }} />
							</div>

							<div style={{ textAlign: "center" }}>
								<p style={{ fontSize: "11pt", marginBottom: "0.5rem" }}><strong>GURU KONSELING:</strong></p>
								<p style={{ fontSize: "14pt", fontWeight: 700, color: "#0a2540", margin: 0 }}>{guruData?.nama || "Guru BK"}</p>
								<p style={{ fontSize: "11pt", marginTop: "0.5rem" }}>NIP: {guruData?.nip || "-"}</p>
							</div>
						</div>
						<PageFooter current={1} total={totalPdfPages} />
					</PdfPageContainer>

					{/* Halaman Tabel */}
					{jurnalForPdf.length === 0 ? (
						<PdfPageContainer>
							<KopSurat />
							<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px", textAlign: "center" }}>REKAPITULASI JURNAL BIMBINGAN KONSELING</h3>
							<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
								<thead>
									<tr style={{ backgroundColor: "#f1f5f9" }}>
										<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>No</th>
										<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>Tanggal</th>
										<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "20%" }}>Sasaran</th>
										<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>Jenis Layanan</th>
										<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "25%" }}>Materi / Topik</th>
										<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "20%" }}>Penilaian Segera</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td colSpan={6} style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>Tidak ada data pada periode ini.</td>
									</tr>
								</tbody>
							</table>
							<PageFooter current={2} total={totalPdfPages} />
						</PdfPageContainer>
					) : (
						pdfChunks.map((chunk, chunkIdx) => (
							<PdfPageContainer key={`Tabel-${chunkIdx}`}>
								<KopSurat />
								<h3 style={{ fontSize: "12pt", fontWeight: "bold", marginBottom: "15px", textAlign: "center" }}>REKAPITULASI JURNAL BIMBINGAN KONSELING {chunkIdx > 0 ? "(Lanjutan)" : ""}</h3>
								<table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10pt" }}>
									<thead>
										<tr style={{ backgroundColor: "#f1f5f9" }}>
											<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "5%" }}>No</th>
											<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>Tanggal</th>
											<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "20%" }}>Sasaran</th>
											<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "15%" }}>Jenis Layanan</th>
											<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "25%" }}>Materi / Topik</th>
											<th style={{ border: "1px solid #cbd5e1", padding: "8px", width: "20%" }}>Penilaian Segera</th>
										</tr>
									</thead>
									<tbody>
										{chunk.map((item: any, idx: number) => {
											const no = chunkIdx * MAX_ROWS_PDF + idx + 1;
											const tgl = new Date(item.tanggal).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
											return (
												<tr key={item.id}>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{no}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "center" }}>{tgl}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", whiteSpace: "pre-wrap", textAlign: 'center' }}>{formatSasaran(item.sasaranSiswa)}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px" }}>{item.jenisBimbingan}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", whiteSpace: "pre-wrap" }}>{item.materi}</td>
													<td style={{ border: "1px solid #cbd5e1", padding: "8px", whiteSpace: "pre-wrap" }}>{item.penilaianSegera}</td>
												</tr>
											);
										})}
									</tbody>
								</table>
								<PageFooter current={2 + chunkIdx} total={totalPdfPages} />
							</PdfPageContainer>
						))
					)}

					{/* Halaman TTD */}
					<PdfPageContainer isLast>
						<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
							<KopSurat />
							<div style={{ display: "flex", justifyContent: "space-between", marginTop: "2rem", padding: "0 20px" }}>
								<div style={{ textAlign: "center", width: "300px" }}>
									<p style={{ marginBottom: "100px", fontSize: "11pt" }}>Mengetahui,<br />Kepala Sekolah</p>
									<p style={{ margin: 0, fontWeight: "bold", fontSize: "11pt", textDecoration: "underline" }}>{kepsekData?.nama || ".............................."}</p>
									<p style={{ margin: 0, fontSize: "11pt" }}>NIP. {kepsekData?.nip || ".............................."}</p>
								</div>
								<div style={{ textAlign: "center", width: "300px" }}>
									<p style={{ marginBottom: "100px", fontSize: "11pt" }}>Brebes, {tglSekarang}<br />Guru BK</p>
									<p style={{ margin: 0, fontWeight: "bold", fontSize: "11pt", textDecoration: "underline" }}>{guruData?.nama || ".............................."}</p>
									<p style={{ margin: 0, fontSize: "11pt" }}>NIP. {guruData?.nip || ".............................."}</p>
								</div>
							</div>
						</div>
						<PageFooter current={totalPdfPages} total={totalPdfPages} />
					</PdfPageContainer>
				</div>
			</div>

			{/* Toast Notification */}
			{toastMessage && (
				<div className={styles.toastContainer}>
					<div className={styles.toast}>
						{toastMessage}
					</div>
				</div>
			)}
		</div>
	);
}
