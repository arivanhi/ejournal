// app/admin/master/MasterClient.tsx
"use client";

import { useState } from "react";
import { Plus, Users, Search, Edit2, ChevronLeft, ChevronRight, X, CheckCircle2, AlertCircle } from "lucide-react";
import styles from "./adminMaster.module.css";
import { tambahSiswaAction, tambahGuruAction } from "./actions";

interface SiswaProps {
	id: string;
	nisn: string;
	nis: string;
	nama: string;
	jenisKelamin: string;
	kelasSkarang: string;
}

interface GuruProps {
	id: string;
	npp: string;
	nama: string;
	jenisKelamin: string;
	status: boolean;
}

export default function MasterClient({
	initialSiswa,
	initialGuru,
}: {
	initialSiswa: SiswaProps[];
	initialGuru: GuruProps[];
}) {
	const [activeTab, setActiveTab] = useState<"siswa" | "guru">("siswa");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);

	const [toast, setToast] = useState({ show: false, message: "", type: "success" });

	// Form States
	const [identifier, setIdentifier] = useState("");
	const [nis, setNis] = useState("");
	const [nama, setNama] = useState("");
	const [jenisKelamin, setJenisKelamin] = useState("");
	const [kelasAwal, setKelasAwal] = useState("");

	const resetForm = () => {
		setIdentifier("");
		setNis("");
		setNama("");
		setJenisKelamin("");
		setKelasAwal("");
	};

	const handleSimpanData = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		let hasil;
		if (activeTab === "siswa") {
			hasil = await tambahSiswaAction({
				nis: nis,
				nisn: identifier,
				nama,
				jenisKelamin,
				kelasNama: kelasAwal,
			});
		} else {
			hasil = await tambahGuruAction({
				nipNpp: identifier,
				nama,
				jenisKelamin,
			});
		}

		setLoading(false);

		if (hasil.success) {
			setToast({ show: true, message: hasil.message, type: "success" });
			setIsModalOpen(false);
			resetForm();
		} else {
			setToast({ show: true, message: hasil.message, type: "error" });
		}

		setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
	};

	return (
		<>
			<div className={styles.pageContainer}>
				{/* HEADER */}
				<div className={styles.pageHeader}>
					<div>
						<h1 className={styles.pageTitle}>Data Master Akademik</h1>
						<p className={styles.pageSubtitle}>
							Kelola data {activeTab === "siswa" ? "siswa dan pemetaan kelas" : "guru dan status mengajar"} untuk tahun
							ajaran aktif.
						</p>
					</div>
					<div className={styles.actionButtons}>
						{activeTab === "siswa" && (
							<button className={styles.btnSecondary}>
								<Users size={16} />
								Assign Kelas Massal
							</button>
						)}

						<button
							className={styles.btnPrimary}
							onClick={() => {
								resetForm();
								setIsModalOpen(true);
							}}
						>
							<Plus size={16} />
							Tambah {activeTab === "siswa" ? "Siswa" : "Guru"}
						</button>
					</div>
				</div>

				{/* TAB NAVIGATION */}
				<div className={styles.tabContainer}>
					<button
						className={`${styles.tabButton} ${activeTab === "siswa" ? styles.tabButtonActive : ""}`}
						onClick={() => {
							setActiveTab("siswa");
							resetForm();
						}}
					>
						Data Siswa
					</button>
					<button
						className={`${styles.tabButton} ${activeTab === "guru" ? styles.tabButtonActive : ""}`}
						onClick={() => {
							setActiveTab("guru");
							resetForm();
						}}
					>
						Data Guru
					</button>
				</div>

				{/* MAIN CONTENT CARD */}
				<div className={styles.contentCard}>
					{/* FILTER SECTION */}
					<div className={styles.filterSection}>
						{activeTab === "siswa" ? (
							<>
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Tahun Ajaran</label>
									<select className={styles.filterSelect} defaultValue="2024/2025 - Ganjil">
										<option value="2024/2025 - Ganjil">2024/2025 - Ganjil</option>
										<option value="2024/2025 - Genap">2024/2025 - Genap</option>
									</select>
								</div>
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Filter Kelas</label>
									<select className={styles.filterSelect} defaultValue="Semua Kelas">
										<option value="Semua Kelas">Semua Kelas</option>
									</select>
								</div>
							</>
						) : (
							<>
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Status Guru</label>
									<select className={styles.filterSelect} defaultValue="Semua Status">
										<option value="Semua Status">Semua Status</option>
										<option value="Aktif">Aktif Mengajar</option>
										<option value="Nonaktif">Nonaktif / Cuti</option>
									</select>
								</div>
							</>
						)}

						<div className={styles.searchGroup}>
							<Search size={18} className={styles.searchIcon} />
							<input
								type="text"
								placeholder={`Cari nama atau ${activeTab === "siswa" ? "NISN" : "NIP/NPP"}...`}
								className={styles.searchInput}
							/>
						</div>
					</div>

					{/* TABLE SECTION (RENDERING DATA ASLI DATABASE) */}
					<div className={styles.tableWrapper}>
						<table className={styles.dataTable}>
							<thead>
								<tr>
									<th style={{ width: "40px" }}>
										<input type="checkbox" className={styles.checkbox} />
									</th>
									<th>{activeTab === "siswa" ? "NISN" : "NIP / NPP"}</th>
									<th>Nama Lengkap</th>
									<th>Jenis Kelamin</th>
									<th>{activeTab === "siswa" ? "Kelas Saat Ini" : "Status"}</th>
									<th>Aksi</th>
								</tr>
							</thead>
							<tbody>
								{activeTab === "siswa" ? (
									initialSiswa.length === 0 ? (
										<tr>
											<td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
												Belum ada data siswa di database. Klik "Tambah Siswa" untuk mengisi data.
											</td>
										</tr>
									) : (
										initialSiswa.map((siswa) => (
											<tr key={siswa.id}>
												<td>
													<input type="checkbox" className={styles.checkbox} />
												</td>
												<td>{siswa.nisn}</td>
												<td>{siswa.nama}</td>
												<td>{siswa.jenisKelamin || "-"}</td>
												<td>
													<span
														className={
															siswa.kelasSkarang === "Belum Diassign" ? styles.badgeUnassigned : styles.badgeClass
														}
													>
														{siswa.kelasSkarang}
													</span>
												</td>
												<td>
													<Edit2 size={16} className={styles.actionIcon} />
												</td>
											</tr>
										))
									)
								) : initialGuru.length === 0 ? (
									<tr>
										<td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
											Belum ada data guru di database. Klik "Tambah Guru" untuk mengisi data.
										</td>
									</tr>
								) : (
									initialGuru.map((guru) => (
										<tr key={guru.id}>
											<td>
												<input type="checkbox" className={styles.checkbox} />
											</td>
											<td>{guru.npp}</td>
											<td>{guru.nama}</td>
											<td>{guru.jenisKelamin || "-"}</td>
											<td>
												<span className={guru.status ? styles.badgeActive : styles.badgeUnassigned}>
													{guru.status ? "Aktif" : "Nonaktif"}
												</span>
											</td>
											<td>
												<Edit2 size={16} className={styles.actionIcon} />
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					{/* PAGINATION SECTION */}
					<div className={styles.paginationSection}>
						<div className={styles.paginationText}>
							Menampilkan {activeTab === "siswa" ? initialSiswa.length : initialGuru.length} data dari database
						</div>
						<div className={styles.paginationControls}>
							<button className={styles.pageBtn}>
								<ChevronLeft size={18} />
							</button>
							<button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
							<button className={styles.pageBtn}>
								<ChevronRight size={18} />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* === MODAL POP-UP TAMBAH DATA === */}
			{isModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>Tambah Data {activeTab === "siswa" ? "Siswa Baru" : "Guru Baru"}</h2>
							<button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSimpanData}>
							<div className={styles.modalBody}>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>
										{activeTab === "siswa" ? "NISN (Username)" : "NIP / NPP (Username)"}
									</label>
									<input
										type="text"
										required
										value={identifier}
										onChange={(e) => setIdentifier(e.target.value)}
										className={styles.formInput}
										placeholder={activeTab === "siswa" ? "Masukkan 10 digit NISN" : "Masukkan NIP atau NPP"}
									/>
									<span className={styles.formHelpText}>Nomor ini akan digunakan sebagai Username untuk login.</span>
								</div>

								{activeTab === "siswa" && (
									<div className={styles.formGroup}>
										<label className={styles.formLabel}>NIS Sekolah</label>
										<input
											type="text"
											required
											value={nis}
											onChange={(e) => setNis(e.target.value)}
											className={styles.formInput}
											placeholder="Masukkan NIS Sekolah (Cth: 12345)"
										/>
									</div>
								)}

								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Nama Lengkap</label>
									<input
										type="text"
										required
										value={nama}
										onChange={(e) => setNama(e.target.value)}
										className={styles.formInput}
										placeholder="Contoh: Budi Santoso"
									/>
								</div>

								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Jenis Kelamin</label>
									<select
										required
										value={jenisKelamin}
										onChange={(e) => setJenisKelamin(e.target.value)}
										className={styles.formSelect}
									>
										<option value="" disabled>
											Pilih Jenis Kelamin
										</option>
										<option value="Laki-laki">Laki-laki</option>
										<option value="Perempuan">Perempuan</option>
									</select>
								</div>

								{activeTab === "siswa" && (
									<div className={styles.formGroup}>
										<label className={styles.formLabel}>Kelas Awal</label>
										<input
											type="text"
											required
											value={kelasAwal}
											onChange={(e) => setKelasAwal(e.target.value)}
											className={styles.formInput}
											placeholder="Contoh: X MIPA 1"
										/>
									</div>
								)}

								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Password Default</label>
									<input type="text" disabled className={styles.formInput} value="smanda123" />
									<span className={styles.formHelpText}>
										Pengguna dapat mengubah password ini setelah berhasil login.
									</span>
								</div>
							</div>

							<div className={styles.modalFooter}>
								<button
									type="button"
									disabled={loading}
									onClick={() => setIsModalOpen(false)}
									className={styles.btnCancel}
								>
									Batal
								</button>
								<button type="submit" disabled={loading} className={styles.btnPrimary}>
									{loading ? "Menyimpan..." : "Simpan Data"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* === TOAST NOTIFICATION === */}
			{toast.show && (
				<div className={styles.toastOverlay}>
					<div className={`${styles.toastContent} ${toast.type === "error" ? styles.toastError : ""}`}>
						{toast.type === "success" ? (
							<CheckCircle2 size={24} className={styles.toastIconSuccess} />
						) : (
							<AlertCircle size={24} className={styles.toastIconError} />
						)}
						<span className={styles.toastMessage}>{toast.message}</span>
					</div>
				</div>
			)}
		</>
	);
}
