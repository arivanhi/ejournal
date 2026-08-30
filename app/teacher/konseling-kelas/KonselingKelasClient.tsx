"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "../jurnal-konseling/jurnal-bk.module.css";

const ITEMS_PER_PAGE = 15;

export default function KonselingKelasClient({
	riwayat,
	daftarTahunAjaran,
	selectedTaId,
	namaKelas,
}: {
	riwayat: any[];
	daftarTahunAjaran: any[];
	selectedTaId: string;
	namaKelas: string;
}) {
	const router = useRouter();
	const [currentPage, setCurrentPage] = useState(1);

	// Helper to format sasaran string (group by class)
	const formatSasaran = (sasaranSiswa: any[]) => {
		const filteredSasaran = sasaranSiswa.filter((s: any) => {
			const kelas = s.siswa.riwayatKelas?.[0]?.kelas?.nama;
			return kelas === namaKelas;
		});

		if (filteredSasaran.length === 0) return "-";
		return filteredSasaran.map((s: any) => s.siswa.user.nama).join(", ");
	};

	// Pagination Logic
	const totalPages = Math.ceil(riwayat.length / ITEMS_PER_PAGE);
	const paginatedRiwayat = riwayat.slice(
		(currentPage - 1) * ITEMS_PER_PAGE,
		currentPage * ITEMS_PER_PAGE
	);

	return (
		<div className={styles.pageContainer}>
			<div className={styles.header}>
				<h1 className={styles.title}>Konseling Kelas {namaKelas}</h1>
				<p className={styles.subtitle}>Riwayat bimbingan dan konseling siswa di kelas perwalian Anda</p>
			</div>

			<div className={styles.controls}>
				<select
					className={styles.select}
					value={selectedTaId}
					onChange={(e) => {
						setCurrentPage(1);
						router.push(`/teacher/konseling-kelas?ta=${e.target.value}`);
					}}
				>
					{daftarTahunAjaran.map((ta) => (
						<option key={ta.id} value={ta.id}>
							{ta.nama} {ta.isActive ? "(Aktif)" : ""}
						</option>
					))}
				</select>
			</div>

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
						{riwayat.length === 0 ? (
							<tr>
								<td colSpan={7} className={styles.emptyState}>
									Belum ada catatan konseling untuk kelas ini.
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
										<td>{item.guru.user.nama}</td>
										<td style={{ whiteSpace: 'pre-wrap' }}>{sasaran}</td>
										<td>{item.jenisBimbingan}</td>
										<td style={{ whiteSpace: 'pre-wrap' }}>{item.materi}</td>
										<td style={{ whiteSpace: 'pre-wrap' }}>{item.penilaianSegera}</td>
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
		</div>
	);
}
