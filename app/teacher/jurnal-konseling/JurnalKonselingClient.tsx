"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buatJurnalKonselingAction, hapusJurnalKonselingAction, editJurnalKonselingAction, getSiswaByKelas } from "./actions";
import { Plus, Trash2, X, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import styles from "./jurnal-bk.module.css";
import Select from "react-select";

const ITEMS_PER_PAGE = 15;

export default function JurnalKonselingClient({
	riwayat,
	daftarTahunAjaran,
	selectedTaId,
	daftarKelas,
	guruId,
}: {
	riwayat: any[];
	daftarTahunAjaran: any[];
	selectedTaId: string;
	daftarKelas: any[];
	guruId: string;
}) {
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [siswaList, setSiswaList] = useState<any[]>([]);
	const [toastMessage, setToastMessage] = useState<string | null>(null);
	const [editId, setEditId] = useState<string | null>(null);
	
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
				<button
					onClick={openCreateModal}
					className={styles.btnPrimary}
				>
					<Plus size={16} /> Jurnal Baru
				</button>
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
