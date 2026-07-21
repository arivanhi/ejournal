"use client";

import { useState } from "react";
import {
	Plus,
	Users,
	Search,
	Edit2,
	Trash2,
	ChevronLeft,
	ChevronRight,
	X,
	CheckCircle2,
	AlertCircle,
	UploadCloud,
	ArrowUpDown,
	Network, // Ikon tambahan untuk tombol Mapping
} from "lucide-react";
import styles from "./adminMaster.module.css";
import * as XLSX from "xlsx";
import {
	tambahSiswaAction,
	tambahGuruAction,
	tambahMapelAction,
	editSiswaAction,
	editGuruAction,
	editMapelAction,
	hapusSiswaAction,
	hapusGuruAction,
	hapusMapelAction,
	assignKelasMassalAction,
	importGuruMassalAction,
	importMapelMassalAction,
	tambahTahunAjarAction,
	editTahunAjarAction,
	hapusTahunAjarAction,
	simpanPemetaanMapelAction,
} from "./actions";

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
interface MapelProps {
	id: string;
	kode: string;
	nama: string;
}

interface TahunAjarProps {
	id: string;
	nama: string;
	isActive: boolean;
	mataPelajaran?: any[];
}

export default function MasterClient({
	initialSiswa,
	initialGuru,
	initialMapel,
	initialTahunAjar, // <-- Tambahkan baris ini
}: {
	initialSiswa: SiswaProps[];
	initialGuru: GuruProps[];
	initialMapel: MapelProps[];
	initialTahunAjar: TahunAjarProps[]; // <-- Tambahkan baris ini
}) {
	// 1. TAMBAH STATE TAHUN AJAR
	const [activeTab, setActiveTab] = useState<"siswa" | "guru" | "mapel" | "tahunAjar">("siswa");

	// States untuk Modal
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");

	// States untuk Data & Centang Massal
	const [editingId, setEditingId] = useState("");
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [idsToDelete, setIdsToDelete] = useState<string[]>([]);

	// States untuk Filter & Pencarian
	const [searchQuery, setSearchQuery] = useState("");
	const [filterKelas, setFilterKelas] = useState("Semua Kelas");
	const [filterStatusGuru, setFilterStatusGuru] = useState("Semua Status");

	const [sortBy, setSortBy] = useState<string>("kelas");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

	const [fileExcel, setFileExcel] = useState<File | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [loading, setLoading] = useState(false);
	const [toast, setToast] = useState({ show: false, message: "", type: "success" });

	// Form States
	const [identifier, setIdentifier] = useState("");
	const [nis, setNis] = useState("");
	const [nama, setNama] = useState("");
	const [jenisKelamin, setJenisKelamin] = useState("");
	const [kelasAwal, setKelasAwal] = useState("");
	const [statusGuru, setStatusGuru] = useState(true);
	const [namaTahun, setNamaTahun] = useState("");
	const [isActiveTahun, setIsActiveTahun] = useState(true);
	// --- TAMBAHKAN 3 STATE INI UNTUK MAPPING ---
	const [isMappingModalOpen, setIsMappingModalOpen] = useState(false);
	const [selectedTahunAjarId, setSelectedTahunAjarId] = useState("");
	const [mappedMapelIds, setMappedMapelIds] = useState<string[]>([]);

	// --- FILTER & LOGIKA DATA ---
	const uniqueClasses = Array.from(new Set(initialSiswa.map((s) => s.kelasSkarang)))
		.filter((k) => k !== "Belum Diassign")
		.sort();

	const filteredSiswa = initialSiswa.filter(
		(siswa) =>
			(siswa.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
				siswa.nisn.includes(searchQuery) ||
				siswa.nis.includes(searchQuery)) &&
			(filterKelas === "Semua Kelas" ? true : siswa.kelasSkarang === filterKelas),
	);

	const filteredGuru = initialGuru.filter(
		(guru) =>
			(guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) || guru.npp.includes(searchQuery)) &&
			(filterStatusGuru === "Semua Status"
				? true
				: filterStatusGuru === "Aktif"
					? guru.status === true
					: guru.status === false),
	);

	const filteredMapel = initialMapel.filter(
		(mapel) =>
			mapel.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
			mapel.kode.toLowerCase().includes(searchQuery.toLowerCase()),
	);
	const filteredTahunAjar = (initialTahunAjar || []).filter((tahun) =>
		tahun.nama.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// --- LOGIKA SORTING ---
	const handleSort = (column: string) => {
		if (sortBy === column) setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		else {
			setSortBy(column);
			setSortOrder("asc");
		}
	};

	const sortedSiswa = [...filteredSiswa].sort((a, b) => {
		let valA = a.kelasSkarang;
		let valB = b.kelasSkarang;
		if (sortBy === "nama") {
			valA = a.nama;
			valB = b.nama;
		} else if (sortBy === "jenisKelamin") {
			valA = a.jenisKelamin;
			valB = b.jenisKelamin;
		} else if (sortBy === "nisn") {
			valA = a.nisn;
			valB = b.nisn;
		}
		return valA < valB ? (sortOrder === "asc" ? -1 : 1) : valA > valB ? (sortOrder === "asc" ? 1 : -1) : 0;
	});

	const sortedGuru = [...filteredGuru].sort((a, b) => {
		let valA = b.status ? "1" : "0";
		let valB = a.status ? "1" : "0";
		if (sortBy === "nama") {
			valA = a.nama;
			valB = b.nama;
		} else if (sortBy === "jenisKelamin") {
			valA = a.jenisKelamin;
			valB = b.jenisKelamin;
		} else if (sortBy === "npp") {
			valA = a.npp;
			valB = b.npp;
		}
		return valA < valB ? (sortOrder === "asc" ? -1 : 1) : valA > valB ? (sortOrder === "asc" ? 1 : -1) : 0;
	});

	const sortedMapel = [...filteredMapel].sort((a, b) => {
		let valA = sortBy === "kode" ? a.kode : a.nama;
		let valB = sortBy === "kode" ? b.kode : b.nama;
		return valA < valB ? (sortOrder === "asc" ? -1 : 1) : valA > valB ? (sortOrder === "asc" ? 1 : -1) : 0;
	});
	const sortedTahunAjar = [...filteredTahunAjar].sort((a, b) => {
		let valA = sortBy === "nama" ? a.nama : a.isActive ? "1" : "0";
		let valB = sortBy === "nama" ? b.nama : b.isActive ? "1" : "0";
		return valA < valB ? (sortOrder === "asc" ? -1 : 1) : valA > valB ? (sortOrder === "asc" ? 1 : -1) : 0;
	});

	// --- LOGIKA CENTANG MASSAL ---
	const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.checked) {
			const allIds =
				activeTab === "siswa"
					? sortedSiswa.map((s) => s.id)
					: activeTab === "guru"
						? sortedGuru.map((g) => g.id)
						: activeTab === "mapel"
							? sortedMapel.map((m) => m.id)
							: sortedTahunAjar.map((t) => t.id);
			setSelectedIds(allIds);
		} else setSelectedIds([]);
	};

	const handleSelectRow = (id: string, isChecked: boolean) => {
		if (isChecked) setSelectedIds((prev) => [...prev, id]);
		else setSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
	};

	const handleTabChange = (tab: "siswa" | "guru" | "mapel" | "tahunAjar") => {
		setActiveTab(tab);
		resetForm();
		setSelectedIds([]);
		setSearchQuery("");
		setFilterKelas("Semua Kelas");
		setFilterStatusGuru("Semua Status");
		setSortBy(tab === "siswa" ? "kelas" : tab === "guru" ? "npp" : tab === "mapel" ? "kode" : "tahun");
		setSortOrder("asc");
	};

	const resetForm = () => {
		setIdentifier("");
		setNis("");
		setNama("");
		setJenisKelamin("");
		setKelasAwal("");
		setStatusGuru(true);
		setEditingId("");
		setModalMode("create");
		setNamaTahun("");
		setIsActiveTahun(true);
	};

	// --- LOGIKA EDIT BUTTON ---
	const handleEditSiswa = (siswa: SiswaProps) => {
		setModalMode("edit");
		setEditingId(siswa.id);
		setIdentifier(siswa.nisn);
		setNis(siswa.nis);
		setNama(siswa.nama);
		setJenisKelamin(siswa.jenisKelamin || "");
		setKelasAwal(siswa.kelasSkarang !== "Belum Diassign" ? siswa.kelasSkarang : "");
		setIsModalOpen(true);
	};

	const handleEditGuru = (guru: GuruProps) => {
		setModalMode("edit");
		setEditingId(guru.id);
		setIdentifier(guru.npp);
		setNama(guru.nama);
		setJenisKelamin(guru.jenisKelamin || "");
		setStatusGuru(guru.status);
		setIsModalOpen(true);
	};

	const handleEditMapel = (mapel: MapelProps) => {
		setModalMode("edit");
		setEditingId(mapel.id);
		setIdentifier(mapel.kode);
		setNama(mapel.nama);
		setIsModalOpen(true);
	};

	const handleEditTahun = (tahun: TahunAjarProps) => {
		setModalMode("edit");
		setEditingId(tahun.id);
		setNamaTahun(tahun.nama);
		setIsActiveTahun(tahun.isActive);
		setIsModalOpen(true);
	};

	// --- LOGIKA HAPUS BUTTON ---
	const confirmDelete = (ids: string[]) => {
		setIdsToDelete(ids);
		setIsDeleteModalOpen(true);
	};

	// --- LOGIKA MAPPING MAPEL ---
	const handleOpenMapping = (tahun: TahunAjarProps) => {
		setSelectedTahunAjarId(tahun.id);

		// Ubah mapels menjadi mataPelajaran
		if (tahun.mataPelajaran && tahun.mataPelajaran.length > 0) {
			setMappedMapelIds(tahun.mataPelajaran.map((m: any) => m.id));
		} else {
			setMappedMapelIds([]);
		}
		setIsMappingModalOpen(true);
	};

	const handleToggleMapelMapping = (mapelId: string, isChecked: boolean) => {
		if (isChecked) {
			setMappedMapelIds((prev) => [...prev, mapelId]);
		} else {
			setMappedMapelIds((prev) => prev.filter((id) => id !== mapelId));
		}
	};

	const handleSimpanMapping = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		const hasil = await simpanPemetaanMapelAction(selectedTahunAjarId, mappedMapelIds);

		setLoading(false);
		if (hasil.success) {
			setToast({ show: true, message: hasil.message, type: "success" });
			setIsMappingModalOpen(false);
		} else {
			setToast({ show: true, message: hasil.message, type: "error" });
		}
		setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
	};

	const executeDelete = async () => {
		setLoading(true);
		let hasil;
		if (activeTab === "siswa") hasil = await hapusSiswaAction(idsToDelete);
		else if (activeTab === "guru") hasil = await hapusGuruAction(idsToDelete);
		else if (activeTab === "mapel") hasil = await hapusMapelAction(idsToDelete);
		else if (activeTab === "tahunAjar") hasil = await hapusTahunAjarAction(idsToDelete);

		setLoading(false);
		setIsDeleteModalOpen(false);
		if (hasil?.success) {
			setToast({ show: true, message: hasil.message, type: "success" });
			setSelectedIds([]);
		} else setToast({ show: true, message: hasil?.message || "Gagal menghapus", type: "error" });
		setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
	};

	// --- LOGIKA SIMPAN DATA FORM (CREATE/EDIT) ---
	const handleSimpanData = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		let hasil;
		if (activeTab === "siswa") {
			if (modalMode === "create")
				hasil = await tambahSiswaAction({ nis, nisn: identifier, nama, jenisKelamin, kelasNama: kelasAwal });
			else
				hasil = await editSiswaAction(editingId, { nis, nisn: identifier, nama, jenisKelamin, kelasNama: kelasAwal });
		} else if (activeTab === "guru") {
			if (modalMode === "create") hasil = await tambahGuruAction({ nipNpp: identifier, nama, jenisKelamin });
			else hasil = await editGuruAction(editingId, { nipNpp: identifier, nama, jenisKelamin, status: statusGuru });
		} else if (activeTab === "mapel") {
			if (modalMode === "create") hasil = await tambahMapelAction({ kode: identifier, nama });
			else hasil = await editMapelAction(editingId, { kode: identifier, nama });
		} else if (activeTab === "tahunAjar") {
			if (modalMode === "create") hasil = await tambahTahunAjarAction({ nama: namaTahun, isActive: isActiveTahun });
			else hasil = await editTahunAjarAction(editingId, { nama: namaTahun, isActive: isActiveTahun });
		}

		setLoading(false);
		if (hasil?.success) {
			setToast({ show: true, message: hasil.message, type: "success" });
			setIsModalOpen(false);
			resetForm();
		} else setToast({ show: true, message: hasil?.message || "Terjadi kesalahan", type: "error" });
		setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
	};

	// --- LOGIKA DRAG & DROP AREA EXCEL ---
	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};
	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};
	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile.name.endsWith(".xlsx") || droppedFile.name.endsWith(".xls")) setFileExcel(droppedFile);
			else setToast({ show: true, message: "Hanya file Excel yang diizinkan!", type: "error" });
		}
	};

	const handleDownloadTemplate = () => {
		let templateData = [];
		let fileName = "";
		if (activeTab === "siswa") {
			templateData = [
				{
					NISN: "0051234567",
					NIS: "1234",
					Nama_Lengkap: "Ahmad Budi",
					Jenis_Kelamin: "Laki-laki",
					Kelas_Tujuan: "X MIPA 1",
				},
			];
			fileName = "Template_Import_Siswa_Massal.xlsx";
		} else if (activeTab === "guru") {
			templateData = [{ NPP: "198501232010011001", Nama_Lengkap: "Drs. Hartono, M.Pd", Jenis_Kelamin: "Laki-laki" }];
			fileName = "Template_Import_Guru_Massal.xlsx";
		} else if (activeTab === "mapel") {
			templateData = [
				{ Kode_Mapel: "MAT-WAJIB", Nama_Mapel: "Matematika Wajib" },
				{ Kode_Mapel: "BIG-LINMAT", Nama_Mapel: "Bahasa Inggris Lintas Minat" },
			];
			fileName = "Template_Import_Mapel_Massal.xlsx";
		}
		const worksheet = XLSX.utils.json_to_sheet(templateData);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(
			workbook,
			worksheet,
			activeTab === "siswa" ? "Data_Siswa" : activeTab === "guru" ? "Data_Guru" : "Data_Mapel",
		);
		XLSX.writeFile(workbook, fileName);
	};

	const handleUploadExcel = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!fileExcel) return;
		setLoading(true);
		const formData = new FormData();
		formData.append("file", fileExcel);

		let hasil;
		if (activeTab === "siswa") hasil = await assignKelasMassalAction(formData);
		else if (activeTab === "guru") hasil = await importGuruMassalAction(formData);
		else hasil = await importMapelMassalAction(formData);

		setLoading(false);
		if (hasil?.success) {
			setToast({ show: true, message: hasil.message, type: "success" });
			setIsUploadModalOpen(false);
			setFileExcel(null);
		} else setToast({ show: true, message: hasil?.message || "Error saat upload", type: "error" });
		setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
	};

	const titleLabels = { siswa: "Siswa", guru: "Guru", mapel: "Mata Pelajaran", tahunAjar: "Tahun Ajar" };

	return (
		<>
			<div className={styles.pageContainer}>
				{/* HEADER */}
				<div className={styles.pageHeader}>
					<div>
						<h1 className={styles.pageTitle}>Data Master Akademik</h1>
						<p className={styles.pageSubtitle}>Kelola data master referensi sekolah untuk tahun ajaran aktif.</p>
					</div>
					<div className={styles.actionButtons}>
						{selectedIds.length > 0 && (
							<button className={styles.btnDanger} onClick={() => confirmDelete(selectedIds)}>
								<Trash2 size={16} /> Hapus {selectedIds.length} Terpilih
							</button>
						)}

						{/* Sembunyikan tombol Import Massal jika berada di tab Tahun Ajar */}
						{activeTab !== "tahunAjar" && (
							<button className={styles.btnSecondary} onClick={() => setIsUploadModalOpen(true)}>
								<Users size={16} />
								{activeTab === "siswa"
									? "Import Siswa Massal"
									: activeTab === "guru"
										? "Import Guru Massal"
										: "Import Mapel Massal"}
							</button>
						)}

						<button
							className={styles.btnPrimary}
							onClick={() => {
								resetForm();
								setIsModalOpen(true);
							}}
						>
							<Plus size={16} /> Tambah {titleLabels[activeTab]}
						</button>
					</div>
				</div>

				{/* TAB NAVIGATION */}
				<div className={styles.tabContainer}>
					<button
						className={`${styles.tabButton} ${activeTab === "siswa" ? styles.tabButtonActive : ""}`}
						onClick={() => handleTabChange("siswa")}
					>
						Data Siswa
					</button>
					<button
						className={`${styles.tabButton} ${activeTab === "guru" ? styles.tabButtonActive : ""}`}
						onClick={() => handleTabChange("guru")}
					>
						Data Guru
					</button>
					<button
						className={`${styles.tabButton} ${activeTab === "mapel" ? styles.tabButtonActive : ""}`}
						onClick={() => handleTabChange("mapel")}
					>
						Data Mapel
					</button>

					{/* TAB BARU: TAHUN AJAR */}
					<button
						className={`${styles.tabButton} ${activeTab === "tahunAjar" ? styles.tabButtonActive : ""}`}
						onClick={() => handleTabChange("tahunAjar")}
					>
						Data Tahun Ajar
					</button>
				</div>

				{/* MAIN CONTENT CARD */}
				<div className={styles.contentCard}>
					{/* FILTER SECTION */}
					{activeTab !== "tahunAjar" && (
						<div className={styles.filterSection}>
							{activeTab === "siswa" && (
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Filter Kelas</label>
									<select
										className={styles.filterSelect}
										value={filterKelas}
										onChange={(e) => setFilterKelas(e.target.value)}
									>
										<option value="Semua Kelas">Semua Kelas</option>
										{uniqueClasses.map((kelas) => (
											<option key={kelas} value={kelas}>
												{kelas}
											</option>
										))}
										<option value="Belum Diassign">Belum Diassign</option>
									</select>
								</div>
							)}
							{activeTab === "guru" && (
								<div className={styles.filterGroup}>
									<label className={styles.filterLabel}>Status Guru</label>
									<select
										className={styles.filterSelect}
										value={filterStatusGuru}
										onChange={(e) => setFilterStatusGuru(e.target.value)}
									>
										<option value="Semua Status">Semua Status</option>
										<option value="Aktif">Aktif Mengajar</option>
										<option value="Nonaktif">Nonaktif / Cuti</option>
									</select>
								</div>
							)}
							{activeTab === "mapel" && <div className={styles.filterGroup}></div>}

							<div className={styles.searchGroup}>
								<Search size={18} className={styles.searchIcon} />
								<input
									type="text"
									placeholder={`Cari ${activeTab === "mapel" ? "kode atau nama mapel" : activeTab === "siswa" ? "nama atau NISN" : "nama atau NPP"}...`}
									className={styles.searchInput}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</div>
					)}

					{/* TABLE SECTION */}
					<div className={styles.tableWrapper}>
						<table className={styles.dataTable}>
							<thead>
								{activeTab === "tahunAjar" ? (
									<tr>
										<th style={{ width: "40px" }}>
											<input
												type="checkbox"
												className={styles.checkbox}
												onChange={handleSelectAll}
												checked={selectedIds.length > 0 && selectedIds.length === sortedTahunAjar.length}
											/>
										</th>
										<th style={{ cursor: "pointer" }} onClick={() => handleSort("nama")}>
											<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
												Nama Tahun Ajaran & Semester <ArrowUpDown size={12} />
											</div>
										</th>
										<th style={{ cursor: "pointer" }} onClick={() => handleSort("status")}>
											<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
												Status <ArrowUpDown size={12} />
											</div>
										</th>
										<th style={{ textAlign: "right" }}>Aksi Pemetaan</th>
									</tr>
								) : (
									<tr>
										<th style={{ width: "40px" }}>
											<input
												type="checkbox"
												className={styles.checkbox}
												onChange={handleSelectAll}
												checked={
													selectedIds.length > 0 &&
													selectedIds.length ===
														(activeTab === "siswa"
															? sortedSiswa.length
															: activeTab === "guru"
																? sortedGuru.length
																: sortedMapel.length)
												}
											/>
										</th>
										{activeTab !== "mapel" ? (
											<>
												<th
													style={{ cursor: "pointer" }}
													onClick={() => handleSort(activeTab === "siswa" ? "nisn" : "npp")}
												>
													<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
														{activeTab === "siswa" ? "NISN / NIS" : "NIP / NPP"} <ArrowUpDown size={12} />
													</div>
												</th>
												<th style={{ cursor: "pointer" }} onClick={() => handleSort("nama")}>
													<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
														Nama Lengkap <ArrowUpDown size={12} />
													</div>
												</th>
												<th style={{ cursor: "pointer" }} onClick={() => handleSort("jenisKelamin")}>
													<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
														Jenis Kelamin <ArrowUpDown size={12} />
													</div>
												</th>
												<th
													style={{ cursor: "pointer" }}
													onClick={() => handleSort(activeTab === "siswa" ? "kelas" : "status")}
												>
													<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
														{activeTab === "siswa" ? "Kelas Saat Ini" : "Status"} <ArrowUpDown size={12} />
													</div>
												</th>
											</>
										) : (
											<>
												<th style={{ cursor: "pointer" }} onClick={() => handleSort("kode")}>
													<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
														Kode Mapel <ArrowUpDown size={12} />
													</div>
												</th>
												<th style={{ cursor: "pointer" }} onClick={() => handleSort("nama")}>
													<div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
														Nama Mata Pelajaran <ArrowUpDown size={12} />
													</div>
												</th>
											</>
										)}
										<th>Aksi</th>
									</tr>
								)}
							</thead>
							<tbody>
								{/* RENDER KHUSUS TAHUN AJAR (PLACEHOLDER) */}
								{activeTab === "tahunAjar" &&
									(sortedTahunAjar.length === 0 ? (
										<tr>
											<td colSpan={4} style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
												Tidak ada data Tahun Ajaran.
											</td>
										</tr>
									) : (
										sortedTahunAjar.map((tahun) => (
											<tr key={tahun.id}>
												<td>
													<input
														type="checkbox"
														className={styles.checkbox}
														checked={selectedIds.includes(tahun.id)}
														onChange={(e) => handleSelectRow(tahun.id, e.target.checked)}
													/>
												</td>
												<td style={{ fontWeight: 600, color: "#111827", fontSize: "0.95rem" }}>{tahun.nama}</td>
												<td>
													<span className={tahun.isActive ? styles.badgeActive : styles.badgeUnassigned}>
														{tahun.isActive ? "Aktif" : "Tidak Aktif"}
													</span>
												</td>
												<td>
													<div
														style={{
															display: "flex",
															gap: "0.75rem",
															justifyContent: "flex-end",
															alignItems: "center",
														}}
													>
														<button
															className={styles.btnSecondary}
															style={{ padding: "0.3rem 0.75rem", fontSize: "0.8rem", height: "auto" }}
															onClick={() => handleOpenMapping(tahun)} // <--- UBAH BAGIAN INI
														>
															<Network size={14} /> Pemetaan Mapel
														</button>
														<div
															style={{ width: "1px", height: "20px", backgroundColor: "#e5e7eb", margin: "0 4px" }}
														></div>
														<Edit2 size={16} className={styles.actionIcon} onClick={() => handleEditTahun(tahun)} />
														<Trash2
															size={16}
															className={styles.actionIcon}
															style={{ color: "#ef4444" }}
															onClick={() => confirmDelete([tahun.id])}
														/>
													</div>
												</td>
											</tr>
										))
									))}

								{activeTab === "siswa" &&
									(sortedSiswa.length === 0 ? (
										<tr>
											<td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
												Tidak ada data siswa ditemukan.
											</td>
										</tr>
									) : (
										sortedSiswa.map((siswa) => (
											<tr key={siswa.id}>
												<td>
													<input
														type="checkbox"
														className={styles.checkbox}
														checked={selectedIds.includes(siswa.id)}
														onChange={(e) => handleSelectRow(siswa.id, e.target.checked)}
													/>
												</td>
												<td>
													{siswa.nisn} <br />
													<span style={{ fontSize: "0.75rem", color: "#6b7280" }}>NIS: {siswa.nis}</span>
												</td>
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
													<div style={{ display: "flex", gap: "0.75rem" }}>
														<Edit2 size={16} className={styles.actionIcon} onClick={() => handleEditSiswa(siswa)} />
														<Trash2
															size={16}
															className={styles.actionIcon}
															style={{ color: "#ef4444" }}
															onClick={() => confirmDelete([siswa.id])}
														/>
													</div>
												</td>
											</tr>
										))
									))}
								{activeTab === "guru" &&
									(sortedGuru.length === 0 ? (
										<tr>
											<td colSpan={6} style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
												Tidak ada data guru ditemukan.
											</td>
										</tr>
									) : (
										sortedGuru.map((guru) => (
											<tr key={guru.id}>
												<td>
													<input
														type="checkbox"
														className={styles.checkbox}
														checked={selectedIds.includes(guru.id)}
														onChange={(e) => handleSelectRow(guru.id, e.target.checked)}
													/>
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
													<div style={{ display: "flex", gap: "0.75rem" }}>
														<Edit2 size={16} className={styles.actionIcon} onClick={() => handleEditGuru(guru)} />
														<Trash2
															size={16}
															className={styles.actionIcon}
															style={{ color: "#ef4444" }}
															onClick={() => confirmDelete([guru.id])}
														/>
													</div>
												</td>
											</tr>
										))
									))}
								{activeTab === "mapel" &&
									(sortedMapel.length === 0 ? (
										<tr>
											<td colSpan={4} style={{ textAlign: "center", color: "#6b7280", padding: "2rem" }}>
												Tidak ada data mata pelajaran ditemukan.
											</td>
										</tr>
									) : (
										sortedMapel.map((mapel) => (
											<tr key={mapel.id}>
												<td>
													<input
														type="checkbox"
														className={styles.checkbox}
														checked={selectedIds.includes(mapel.id)}
														onChange={(e) => handleSelectRow(mapel.id, e.target.checked)}
													/>
												</td>
												<td style={{ fontWeight: 600, color: "#0369a1" }}>{mapel.kode}</td>
												<td>{mapel.nama}</td>
												<td>
													<div style={{ display: "flex", gap: "0.75rem" }}>
														<Edit2 size={16} className={styles.actionIcon} onClick={() => handleEditMapel(mapel)} />
														<Trash2
															size={16}
															className={styles.actionIcon}
															style={{ color: "#ef4444" }}
															onClick={() => confirmDelete([mapel.id])}
														/>
													</div>
												</td>
											</tr>
										))
									))}
							</tbody>
						</table>
					</div>

					<div className={styles.paginationSection}>
						<div className={styles.paginationText}>
							Menampilkan{" "}
							{activeTab === "siswa"
								? sortedSiswa.length
								: activeTab === "guru"
									? sortedGuru.length
									: activeTab === "mapel"
										? sortedMapel.length
										: 0}{" "}
							data
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

			{/* MODAL DAN TOAST TETAP SAMA, TIDAK ADA PERUBAHAN */}
			{/* === MODAL TAMBAH / EDIT FORM === */}
			{isModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>
								{modalMode === "create" ? "Tambah Data" : "Edit Data"} {titleLabels[activeTab]}
							</h2>
							<button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSimpanData}>
							<div className={styles.modalBody}>
								{/* KHUSUS UNTUK TAHUN AJAR - Placeholder Form Sementara */}
								{activeTab === "tahunAjar" ? (
									<>
										<div className={styles.formGroup}>
											<label className={styles.formLabel}>Nama Tahun Ajaran & Semester</label>
											<input
												type="text"
												required
												value={namaTahun}
												onChange={(e) => setNamaTahun(e.target.value)}
												className={styles.formInput}
												placeholder="Contoh: 2026/2027 Ganjil"
											/>
										</div>
										<div className={styles.formGroup}>
											<label className={styles.formLabel}>Status Aktif</label>
											<select
												required
												value={isActiveTahun ? "true" : "false"}
												onChange={(e) => setIsActiveTahun(e.target.value === "true")}
												className={styles.formSelect}
											>
												<option value="true">Aktif (Berjalan Saat Ini)</option>
												<option value="false">Tidak Aktif (Riwayat Lama)</option>
											</select>
										</div>
									</>
								) : (
									<>
										<div className={styles.formGroup}>
											<label className={styles.formLabel}>
												{activeTab === "siswa"
													? "NISN (Username)"
													: activeTab === "guru"
														? "NIP / NPP (Username)"
														: "Kode Mata Pelajaran"}
											</label>
											<input
												type="text"
												required
												value={identifier}
												onChange={(e) => setIdentifier(e.target.value)}
												className={styles.formInput}
												placeholder={
													activeTab === "mapel" ? "Contoh: BIG-01, MAT-WAJIB" : "Masukkan Nomor Identitas..."
												}
											/>
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
													placeholder="Masukkan NIS Sekolah"
												/>
											</div>
										)}

										<div className={styles.formGroup}>
											<label className={styles.formLabel}>
												{activeTab === "mapel" ? "Nama Mata Pelajaran" : "Nama Lengkap"}
											</label>
											<input
												type="text"
												required
												value={nama}
												onChange={(e) => setNama(e.target.value)}
												className={styles.formInput}
												placeholder={
													activeTab === "mapel" ? "Contoh: Bahasa Inggris Lintas Minat" : "Contoh: Budi Santoso"
												}
											/>
										</div>

										{activeTab !== "mapel" && (
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
										)}

										{activeTab === "guru" && modalMode === "edit" && (
											<div className={styles.formGroup}>
												<label className={styles.formLabel}>Status Mengajar</label>
												<select
													required
													value={statusGuru ? "true" : "false"}
													onChange={(e) => setStatusGuru(e.target.value === "true")}
													className={styles.formSelect}
												>
													<option value="true">Aktif Mengajar</option>
													<option value="false">Nonaktif / Cuti</option>
												</select>
											</div>
										)}

										{activeTab === "siswa" && (
											<div className={styles.formGroup}>
												<label className={styles.formLabel}>Kelas</label>
												<input
													type="text"
													required
													value={kelasAwal}
													onChange={(e) => setKelasAwal(e.target.value)}
													className={styles.formInput}
													placeholder="Contoh: X MIPA 1"
													list="daftar-kelas"
												/>
												<datalist id="daftar-kelas">
													{uniqueClasses.map((kelas) => (
														<option key={kelas} value={kelas} />
													))}
												</datalist>
											</div>
										)}

										{modalMode === "create" && activeTab !== "mapel" && (
											<div className={styles.formGroup}>
												<label className={styles.formLabel}>Password Default</label>
												<input type="text" disabled className={styles.formInput} value="smanda123" />
											</div>
										)}
									</>
								)}
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

			{/* SISA MODAL IMPORT DAN DELETE TETAP SAMA */}
			{isUploadModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>
								{activeTab === "siswa"
									? "Import Siswa Massal"
									: activeTab === "guru"
										? "Import Data Guru Massal"
										: "Import Mapel Massal"}
							</h2>
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
								<div
									style={{
										padding: "1rem",
										backgroundColor: "#f0fdf4",
										borderRadius: "0.5rem",
										marginBottom: "1.5rem",
										border: "1px solid #bbf7d0",
									}}
								>
									<h3 style={{ fontSize: "0.875rem", fontWeight: "600", color: "#166534", marginBottom: "0.5rem" }}>
										Langkah-langkah:
									</h3>
									<ol
										style={{
											fontSize: "0.875rem",
											color: "#15803d",
											paddingLeft: "1.2rem",
											margin: 0,
											lineHeight: "1.5",
										}}
									>
										<li>Unduh template Excel dengan menekan tombol di bawah.</li>
										<li>
											Isikan data{" "}
											{activeTab === "siswa"
												? "Siswa (NISN, NIS, Nama, JK, Kelas)"
												: activeTab === "guru"
													? "Guru (NPP, Nama, Jenis Kelamin)"
													: "Mata Pelajaran (Kode_Mapel, Nama_Mapel)"}
											.
										</li>
										<li>Seret atau unggah file tersebut kembali ke form ini.</li>
									</ol>
								</div>
								<div className={styles.formGroup} style={{ marginBottom: "1.5rem" }}>
									<button
										type="button"
										onClick={handleDownloadTemplate}
										className={styles.btnSecondary}
										style={{ width: "100%", justifyContent: "center" }}
									>
										⬇️ Download Template Excel (.xlsx)
									</button>
								</div>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Unggah File Excel</label>
									<div
										className={`${styles.dropzone} ${isDragging ? styles.dropzoneDragging : ""}`}
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop}
										onClick={() => document.getElementById("file-upload")?.click()}
									>
										<UploadCloud size={40} className={styles.dropzoneIcon} />
										{fileExcel ? (
											<div className={styles.dropzoneText}>
												File siap: <strong>{fileExcel.name}</strong>
											</div>
										) : (
											<div className={styles.dropzoneText}>
												Tarik & lepas file Excel di sini, atau <strong>klik untuk mencari file</strong>
											</div>
										)}
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
									className={styles.btnCancel}
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

			{isDeleteModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer} style={{ maxWidth: "400px" }}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle} style={{ color: "#ef4444" }}>
								Konfirmasi Hapus
							</h2>
							<button onClick={() => setIsDeleteModalOpen(false)} className={styles.closeBtn}>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: "1.5" }}>
								Apakah Anda yakin ingin menghapus{" "}
								<strong>
									{idsToDelete.length} data {titleLabels[activeTab]}
								</strong>{" "}
								ini?
							</p>
						</div>
						<div className={styles.modalFooter}>
							<button
								type="button"
								disabled={loading}
								onClick={() => setIsDeleteModalOpen(false)}
								className={styles.btnCancel}
							>
								Batal
							</button>
							<button type="button" disabled={loading} onClick={executeDelete} className={styles.btnDangerSolid}>
								Ya, Hapus Data
							</button>
						</div>
					</div>
				</div>
			)}
			{/* === MODAL PEMETAAN (MAPPING) MAPEL === */}
			{isMappingModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>Pemetaan Mata Pelajaran</h2>
							<button onClick={() => setIsMappingModalOpen(false)} className={styles.closeBtn}>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSimpanMapping}>
							<div className={styles.modalBody}>
								<p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1rem" }}>
									Pilih mata pelajaran yang akan diajarkan pada Tahun Ajaran ini.
								</p>

								{/* Kotak Daftar Mapel yang bisa di-scroll */}
								<div
									style={{
										maxHeight: "300px",
										overflowY: "auto",
										border: "1px solid #e5e7eb",
										borderRadius: "0.5rem",
										padding: "0.5rem",
									}}
								>
									{initialMapel.length === 0 ? (
										<div style={{ padding: "1rem", textAlign: "center", color: "#9ca3af" }}>
											Belum ada data Mata Pelajaran.
										</div>
									) : (
										initialMapel.map((mapel) => (
											<label
												key={mapel.id}
												style={{
													display: "flex",
													alignItems: "center",
													gap: "0.75rem",
													padding: "0.75rem",
													borderBottom: "1px solid #f3f4f6",
													cursor: "pointer",
												}}
											>
												<input
													type="checkbox"
													className={styles.checkbox}
													checked={mappedMapelIds.includes(mapel.id)}
													onChange={(e) => handleToggleMapelMapping(mapel.id, e.target.checked)}
												/>
												<div style={{ display: "flex", flexDirection: "column" }}>
													<span style={{ fontWeight: 600, color: "#374151", fontSize: "0.9rem" }}>{mapel.nama}</span>
													<span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Kode: {mapel.kode}</span>
												</div>
											</label>
										))
									)}
								</div>

								<div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#10b981", fontWeight: 600 }}>
									Total terpilih: {mappedMapelIds.length} Mata Pelajaran
								</div>
							</div>

							<div className={styles.modalFooter}>
								<button
									type="button"
									disabled={loading}
									onClick={() => setIsMappingModalOpen(false)}
									className={styles.btnCancel}
								>
									Batal
								</button>
								<button type="submit" disabled={loading} className={styles.btnPrimary}>
									{loading ? "Menyimpan..." : "Simpan Pemetaan"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

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
