"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
	LayoutDashboard,
	BookOpen,
	QrCode,
	History,
	Users,
	Settings,
	LogOut,
	Plus,
	Search,
	Edit2,
	Trash2,
	X,
	CheckCircle2,
	AlertTriangle,
	UploadCloud,
	Download,
	Bell,
	HelpCircle,
} from "lucide-react";
import styles from "./data-siswa.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";
import * as XLSX from "xlsx";
import { tambahSiswaWaliAction, editSiswaWaliAction, hapusSiswaWaliAction, importSiswaWaliAction } from "./actions";

export default function DataSiswaClient({
	kelasData,
	siswaAwal,
	guruName,
}: {
	kelasData: any;
	siswaAwal: any[];
	guruName: string;
}) {
	const router = useRouter();

	// States UI & Modal
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");

	const [toasts, setToasts] = useState<any[]>([]);
	const [loading, setLoading] = useState(false);

	// States Form
	const [editingId, setEditingId] = useState("");
	const [nisn, setNisn] = useState("");
	const [nis, setNis] = useState("");
	const [nama, setNama] = useState("");
	const [jenisKelamin, setJenisKelamin] = useState("");

	// States Filter & Tabel
	const [searchQuery, setSearchQuery] = useState("");
	const [filterStatus, setFilterStatus] = useState("Semua Status");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	// States Upload Excel
	const [fileExcel, setFileExcel] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);

	const showToast = (message: string, type: "success" | "error" = "success") => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
	};

	const resetForm = () => {
		setNisn("");
		setNis("");
		setNama("");
		setJenisKelamin("");
		setEditingId("");
		setModalMode("create");
	};

	// Filter Data
	const filteredSiswa = siswaAwal.filter(
		(siswa) =>
			siswa.user?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			siswa.nisn.includes(searchQuery) ||
			siswa.nis.includes(searchQuery),
		// Placeholder status (asumsi semua aktif saat ini, bisa disesuaikan jika db punya field status)
	);

	// --- LOGIKA CENTANG ---
	const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.checked) setSelectedIds(filteredSiswa.map((s) => s.id));
		else setSelectedIds([]);
	};
	const handleSelectRow = (id: string, isChecked: boolean) => {
		if (isChecked) setSelectedIds((prev) => [...prev, id]);
		else setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
	};

	// --- LOGIKA AKSI CRUD ---
	const handleSimpanData = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		let res;
		if (modalMode === "create") {
			res = await tambahSiswaWaliAction({ nis, nisn, nama, jenisKelamin, kelasId: kelasData.id });
		} else {
			res = await editSiswaWaliAction(editingId, { nis, nisn, nama, jenisKelamin });
		}

		setLoading(false);
		if (res.success) {
			showToast(res.message, "success");
			setIsModalOpen(false);
			resetForm();
			router.refresh();
		} else {
			showToast(res.message, "error");
		}
	};

	const executeDelete = async () => {
		setLoading(true);
		const res = await hapusSiswaWaliAction(selectedIds);
		setLoading(false);
		setIsDeleteModalOpen(false);

		if (res.success) {
			showToast(res.message, "success");
			setSelectedIds([]);
			router.refresh();
		} else {
			showToast(res.message, "error");
		}
	};

	// --- LOGIKA EXCEL ---
	const handleDownloadTemplate = () => {
		const templateData = [{ NISN: "0051234567", NIS: "1234", Nama_Lengkap: "Ahmad Budi", Jenis_Kelamin: "Laki-laki" }];
		const worksheet = XLSX.utils.json_to_sheet(templateData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Siswa");
		XLSX.writeFile(workbook, "Template_Siswa_WaliKelas.xlsx");
	};

	const handleUploadExcel = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!fileExcel) return;
		setLoading(true);

		const formData = new FormData();
		formData.append("file", fileExcel);

		const res = await importSiswaWaliAction(formData, kelasData.id);

		setLoading(false);
		if (res.success) {
			showToast(res.message, "success");
			setIsUploadModalOpen(false);
			setFileExcel(null);
			router.refresh();
		} else {
			showToast(res.message, "error");
		}
	};

	return (
		<div className={styles.layoutWrapper}>
			<div className={styles.toastContainer}>
				{toasts.map((toast) => (
					<div key={toast.id} className={`${styles.toast} ${toast.type === "error" ? styles.toastError : ""}`}>
						{toast.type === "success" ? (
							<CheckCircle2 size={20} color="#10b981" />
						) : (
							<AlertTriangle size={20} color="#ef4444" />
						)}
						<span className={styles.toastText}>{toast.message}</span>
					</div>
				))}
			</div>

			{/* SIDEBAR */}
			<aside className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<div className={styles.logoWrapper}>
						<img src="/logo.jpg" alt="Logo" className={styles.logoImage} />
					</div>
					<div>
						<div className={styles.schoolName}>
							SMAN 2<br />
							Brebes
						</div>
						<div className={styles.portalName}>Teacher Portal</div>
					</div>
				</div>
				<nav className={styles.menuContainer}>
					<Link href="/teacher/dashboard" className={styles.menuItem}>
						<LayoutDashboard size={18} /> Dashboard
					</Link>
					<Link href="/teacher/jurnal" className={styles.menuItem}>
						<BookOpen size={18} /> Jurnal Mengajar
					</Link>
					<Link href="/teacher/presensi" className={styles.menuItem}>
						<QrCode size={18} /> Presensi QR
					</Link>
					<Link href="/teacher/riwayat" className={styles.menuItem}>
						<History size={18} /> Riwayat
					</Link>
					<div className={styles.menuSection}>MENU WALI KELAS</div>
					<Link href="/teacher/data-siswa" className={`${styles.menuItem} ${styles.menuItemActive}`}>
						<Users size={18} /> Data Siswa
					</Link>
					<Link href="/teacher/setelan" className={styles.menuItem}>
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
					<h1 className={styles.greeting}>SMAN 2 Brebes</h1>
					<div className={styles.topbarActions}>
						<Bell size={20} style={{ cursor: "pointer" }} />
						<HelpCircle size={20} style={{ cursor: "pointer" }} />
						<div className={styles.profileAvatar}></div>
					</div>
				</header>

				<div className={styles.dashboardContainer}>
					<div className={styles.pageHeader}>
						<div>
							<h1 className={styles.pageTitle}>Data Siswa - {kelasData.nama}</h1>
							<p className={styles.pageSubtitle}>Wali Kelas: {guruName}</p>
						</div>
						<div className={styles.actionGroup}>
							{selectedIds.length > 0 && (
								<button className={styles.btnDanger} onClick={() => setIsDeleteModalOpen(true)}>
									<Trash2 size={16} /> Hapus ({selectedIds.length})
								</button>
							)}
							<button className={styles.btnOutline} onClick={() => setIsUploadModalOpen(true)}>
								<Download size={16} /> Import Excel
							</button>
							<button
								className={styles.btnPrimary}
								onClick={() => {
									resetForm();
									setIsModalOpen(true);
								}}
							>
								<Plus size={16} /> Tambah Siswa
							</button>
						</div>
					</div>

					<div className={styles.filterBar}>
						<div className={styles.searchBox}>
							<Search size={16} className={styles.searchIcon} />
							<input
								type="text"
								className={styles.searchInput}
								placeholder="Cari nama atau NIS..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<div className={styles.filterGroup}>
							<span className={styles.filterLabel}>Status:</span>
							<select
								className={styles.filterSelect}
								value={filterStatus}
								onChange={(e) => setFilterStatus(e.target.value)}
							>
								<option value="Semua Status">Semua Status</option>
								<option value="Aktif">Aktif</option>
								<option value="Pindahan">Pindahan</option>
							</select>
						</div>
					</div>

					<div className={styles.tableCard}>
						<table className={styles.tableStyle}>
							<thead>
								<tr>
									<th style={{ width: "40px" }}>
										<input
											type="checkbox"
											className={styles.checkbox}
											onChange={handleSelectAll}
											checked={selectedIds.length > 0 && selectedIds.length === filteredSiswa.length}
										/>
									</th>
									<th>NIS</th>
									<th>Nama Siswa</th>
									<th>Jenis Kelamin</th>
									<th>Status</th>
									<th style={{ textAlign: "center" }}>Aksi</th>
								</tr>
							</thead>
							<tbody>
								{filteredSiswa.length === 0 ? (
									<tr>
										<td colSpan={6} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
											Tidak ada siswa di kelas ini.
										</td>
									</tr>
								) : (
									filteredSiswa.map((siswa) => {
										const namaSiswa = siswa.user?.nama || "Siswa";
										const initials = namaSiswa.substring(0, 2).toUpperCase();
										return (
											<tr key={siswa.id}>
												<td>
													<input
														type="checkbox"
														className={styles.checkbox}
														checked={selectedIds.includes(siswa.id)}
														onChange={(e) => handleSelectRow(siswa.id, e.target.checked)}
													/>
												</td>
												<td style={{ fontWeight: 600, color: "#0f172a" }}>{siswa.nis}</td>
												<td>
													<div className={styles.studentProfile}>
														<div className={styles.avatarInitials}>{initials}</div>
														<div>
															<div className={styles.studentName}>{namaSiswa}</div>
															<div className={styles.studentSub}>NISN: {siswa.nisn}</div>
														</div>
													</div>
												</td>
												<td>{siswa.jenisKelamin === "P" ? "Perempuan" : "Laki-laki"}</td>
												<td>
													{/* Simulasi Badge Status */}
													<span className={styles.badgeAktif}>Aktif</span>
												</td>
												<td>
													<div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
														<Edit2
															size={16}
															className={styles.actionIcon}
															onClick={() => {
																setModalMode("edit");
																setEditingId(siswa.id);
																setNisn(siswa.nisn);
																setNis(siswa.nis);
																setNama(namaSiswa);
																setJenisKelamin(siswa.jenisKelamin === "P" ? "Perempuan" : "Laki-laki");
																setIsModalOpen(true);
															}}
														/>
													</div>
												</td>
											</tr>
										);
									})
								)}
							</tbody>
						</table>
					</div>
				</div>
			</main>

			{/* === MODAL TAMBAH / EDIT === */}
			{isModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>{modalMode === "create" ? "Tambah Siswa Baru" : "Edit Data Siswa"}</h2>
							<button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
								<X size={20} />
							</button>
						</div>
						<form onSubmit={handleSimpanData}>
							<div className={styles.modalBody}>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>NISN</label>
									<input
										type="text"
										required
										value={nisn}
										onChange={(e) => setNisn(e.target.value)}
										className={styles.formInput}
										placeholder="Nomor Induk Siswa Nasional"
									/>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>NIS Sekolah</label>
									<input
										type="text"
										required
										value={nis}
										onChange={(e) => setNis(e.target.value)}
										className={styles.formInput}
										placeholder="Nomor Induk Sekolah"
									/>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Nama Lengkap</label>
									<input
										type="text"
										required
										value={nama}
										onChange={(e) => setNama(e.target.value)}
										className={styles.formInput}
										placeholder="Nama lengkap siswa"
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
											Pilih...
										</option>
										<option value="Laki-laki">Laki-laki</option>
										<option value="Perempuan">Perempuan</option>
									</select>
								</div>
							</div>
							<div className={styles.modalFooter}>
								<button
									type="button"
									disabled={loading}
									onClick={() => setIsModalOpen(false)}
									className={styles.btnOutline}
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

			{/* === MODAL IMPORT EXCEL === */}
			{isUploadModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>Import Data Siswa</h2>
							<button
								onClick={() => {
									setIsUploadModalOpen(false);
									setFileExcel(null);
								}}
								className={styles.closeBtn}
							>
								<X size={20} />
							</button>
						</div>
						<form onSubmit={handleUploadExcel}>
							<div className={styles.modalBody}>
								<button
									type="button"
									onClick={handleDownloadTemplate}
									className={styles.btnOutline}
									style={{ width: "100%", justifyContent: "center", marginBottom: "1rem" }}
								>
									⬇️ Download Template Excel (.xlsx)
								</button>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Unggah File Excel</label>
									<div
										className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
										onDragOver={(e) => {
											e.preventDefault();
											setIsDragging(true);
										}}
										onDragLeave={(e) => {
											e.preventDefault();
											setIsDragging(false);
										}}
										onDrop={(e) => {
											e.preventDefault();
											setIsDragging(false);
											if (e.dataTransfer.files?.length) setFileExcel(e.dataTransfer.files[0]);
										}}
										onClick={() => document.getElementById("file-upload")?.click()}
									>
										<UploadCloud size={40} className={styles.dropzoneIcon} />
										<div className={styles.dropzoneText}>
											{fileExcel
												? `File siap: ${fileExcel.name}`
												: "Tarik & lepas file Excel di sini, atau klik untuk mencari"}
										</div>
										<input
											id="file-upload"
											type="file"
											accept=".xlsx, .xls"
											onChange={(e) => setFileExcel(e.target.files ? e.target.files[0] : null)}
											style={{ display: "none" }}
										/>
									</div>
								</div>
							</div>
							<div className={styles.modalFooter}>
								<button
									type="button"
									disabled={loading}
									onClick={() => {
										setIsUploadModalOpen(false);
										setFileExcel(null);
									}}
									className={styles.btnOutline}
								>
									Batal
								</button>
								<button type="submit" disabled={loading || !fileExcel} className={styles.btnPrimary}>
									{loading ? "Memproses..." : "Upload & Proses"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* === MODAL KONFIRMASI HAPUS === */}
			{isDeleteModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer} style={{ maxWidth: "400px" }}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle} style={{ color: "#ef4444" }}>
								Konfirmasi Hapus
							</h2>
						</div>
						<div className={styles.modalBody}>
							Yakin ingin menghapus <strong>{selectedIds.length}</strong> siswa dari sistem? Tindakan ini tidak dapat
							dibatalkan.
						</div>
						<div className={styles.modalFooter}>
							<button
								type="button"
								disabled={loading}
								onClick={() => setIsDeleteModalOpen(false)}
								className={styles.btnOutline}
							>
								Batal
							</button>
							<button type="button" disabled={loading} onClick={executeDelete} className={styles.btnDanger}>
								Ya, Hapus Data
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
