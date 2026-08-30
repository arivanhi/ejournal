"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../../teacher/jurnal-konseling/jurnal-bk.module.css";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

const ITEMS_PER_PAGE = 15;

export default function PimpinanKonselingClient({
	riwayat,
	daftarTahunAjaran,
	selectedTaId,
}: {
	riwayat: any[];
	daftarTahunAjaran: any[];
	selectedTaId: string;
}) {
	const router = useRouter();
	const [selectedKelas, setSelectedKelas] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	// Karena database tidak menyimpan kelas pada jurnal, kita harus mencari kelas unik dari sasaran siswanya
	const unikKelasSet = new Set<string>();
	riwayat.forEach((r) => {
		r.sasaranSiswa.forEach((s: any) => {
			if (s.siswa.riwayatKelas?.[0]?.kelas?.nama) {
				unikKelasSet.add(s.siswa.riwayatKelas[0].kelas.nama);
			}
		});
	});
	const unikKelas = Array.from(unikKelasSet).sort();
	
	// Data untuk tabel (jika kelas sudah dipilih)
	const filteredRiwayat = riwayat.filter((item) => {
		return item.sasaranSiswa.some((s: any) => s.siswa.riwayatKelas?.[0]?.kelas?.nama === selectedKelas);
	});

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
	const totalPages = Math.ceil(filteredRiwayat.length / ITEMS_PER_PAGE);
	const paginatedRiwayat = filteredRiwayat.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE
	);

	return (
		<div className={styles.pageContainer}>
			<div className={styles.header}>
				<h1 className={styles.title}>Laporan Konseling (BK)</h1>
				<p className={styles.subtitle}>Rekapitulasi riwayat bimbingan dan konseling siswa</p>
			</div>

			<div className={styles.controls}>
				<select
					className={styles.select}
					value={selectedTaId}
					onChange={(e) => {
						setSelectedKelas(null);
						setCurrentPage(1);
						router.push(`/pimpinan/konseling?ta=${e.target.value}`);
					}}
				>
					{daftarTahunAjaran.map((ta) => (
						<option key={ta.id} value={ta.id}>
							{ta.nama} {ta.isActive ? "(Aktif)" : ""}
						</option>
					))}
				</select>
			</div>

			{!selectedKelas ? (
				<>
					<h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Pilih Kelas</h3>
					{unikKelas.length === 0 ? (
						<p className={styles.emptyState}>Belum ada catatan konseling di Tahun Ajaran ini.</p>
					) : (
						<div className={styles.cardGrid}>
							{unikKelas.map(kelas => {
								const count = riwayat.filter(r => 
									r.sasaranSiswa.some((s: any) => s.siswa.riwayatKelas?.[0]?.kelas?.nama === kelas)
								).length;
								return (
									<div 
										key={kelas} 
										className={styles.card}
										onClick={() => {
											setSelectedKelas(kelas);
											setCurrentPage(1);
										}}
									>
										<h4 className={styles.cardTitle}>Kelas {kelas}</h4>
										<p className={styles.cardSubtitle}>{count} Catatan Konseling</p>
									</div>
								);
							})}
						</div>
					)}
				</>
			) : (
				<>
					<button 
						className={styles.backButton}
						onClick={() => setSelectedKelas(null)}
					>
						<ArrowLeft size={16} /> Kembali ke Pilihan Kelas
					</button>

					<h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>
						Data Konseling Kelas {selectedKelas}
					</h3>

					<div className={styles.tableContainer}>
						<table className={styles.table}>
							<thead>
								<tr>
									<th style={{ width: '40px' }}>No</th>
									<th style={{ width: '120px' }}>Hari/Tanggal</th>
									<th style={{ width: '150px' }}>Guru BK</th>
									<th style={{ width: '150px' }}>Sasaran Siswa</th>
									<th style={{ width: '180px' }}>Jenis Bimbingan & Layanan</th>
									<th>Materi</th>
									<th>Penilaian Segera</th>
								</tr>
							</thead>
							<tbody>
								{paginatedRiwayat.map((item, idx) => {
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
											<td>{item.guru.user.nama}</td>
											<td style={{ whiteSpace: 'pre-wrap' }}>{sasaran}</td>
											<td>{item.jenisBimbingan}</td>
											<td style={{ whiteSpace: 'pre-wrap' }}>{item.materi}</td>
											<td style={{ whiteSpace: 'pre-wrap' }}>{item.penilaianSegera}</td>
										</tr>
									);
								})}
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
				</>
			)}
		</div>
	);
}
