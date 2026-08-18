"use client";

import { useState } from "react";
import { Plus, Search, Filter, GraduationCap, CheckCircle, AlertTriangle, X } from "lucide-react";
import styles from "./role.module.css";
import { assignWaliKelasAction } from "./actions";

interface GuruRole {
	id: string;
	npp: string;
	nama: string;
	kelasWaliId: string | null;
	namaKelas: string;
}

interface KelasOption {
	id: string;
	nama: string;
	isAssigned: boolean;
}

export default function RoleClient({
	guruData,
	kelasData,
	kpi,
}: {
	guruData: GuruRole[];
	kelasData: KelasOption[];
	kpi: { totalKelas: number; terisiWali: number; belumTerisi: number };
}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedGuru, setSelectedGuru] = useState<GuruRole | null>(null);
	const [selectedKelasId, setSelectedKelasId] = useState<string>("");
	const [loading, setLoading] = useState(false);

	// Fungsi membuat inisial nama (Misal: "Budi Darmawan" -> "BD")
	const getInitials = (name: string) => {
		return name
			.split(" ")
			.slice(0, 2)
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	};

	// Filter pencarian
	const filteredGuru = guruData.filter(
		(guru) => guru.nama.toLowerCase().includes(searchQuery.toLowerCase()) || guru.npp.includes(searchQuery),
	);

	// Pagination Logic
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 15;
	const totalItems = filteredGuru.length;
	const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
	const startIndex = (currentPage - 1) * itemsPerPage;
	const paginatedGuru = filteredGuru.slice(startIndex, startIndex + itemsPerPage);

	const openAssignModal = (guru: GuruRole) => {
		setSelectedGuru(guru);
		setSelectedKelasId(guru.kelasWaliId || "");
		setIsModalOpen(true);
	};

	const handleSimpan = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedGuru) return;

		setLoading(true);
		// Jika value kosong, set null untuk mencabut tugas wali kelas
		const kelasIdToAssign = selectedKelasId === "" ? null : selectedKelasId;

		const hasil = await assignWaliKelasAction(selectedGuru.id, kelasIdToAssign);

		setLoading(false);
		if (hasil.success) {
			setIsModalOpen(false);
		} else {
			alert(hasil.message);
		}
	};

	return (
		<div className={styles.pageContainer}>
			{/* HEADER SECTION */}
			<div className={styles.pageHeader}>
				<div>
					<h1 className={styles.pageTitle}>Manajemen Role - Penugasan Wali Kelas</h1>
					<p className={styles.pageSubtitle}>Kelola penugasan guru sebagai wali kelas untuk tahun ajaran aktif.</p>
				</div>
			</div>

			{/* SUMMARY CARDS (KPI) */}
			<div className={styles.summaryContainer}>
				<div className={styles.summaryCard}>
					<div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
						<GraduationCap size={24} />
					</div>
					<div className={styles.summaryInfo}>
						<h3>TOTAL KELAS AKTIF</h3>
						<p>{kpi.totalKelas}</p>
					</div>
				</div>
				<div className={styles.summaryCard}>
					<div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
						<CheckCircle size={24} />
					</div>
					<div className={styles.summaryInfo}>
						<h3>TERISI WALI KELAS</h3>
						<p className={styles.textGreen}>{kpi.terisiWali}</p>
					</div>
				</div>
				<div className={styles.summaryCard}>
					<div className={`${styles.iconWrapper} ${styles.iconRed}`}>
						<AlertTriangle size={24} />
					</div>
					<div className={styles.summaryInfo}>
						<h3>BELUM TERISI</h3>
						<p className={styles.textRed}>{kpi.belumTerisi}</p>
					</div>
				</div>
			</div>

			{/* MAIN DATA TABLE */}
			<div className={styles.contentCard}>
				<div className={styles.cardHeader}>
					<h2 className={styles.cardTitle}>Daftar Guru & Status Wali Kelas</h2>
					<div className={styles.searchGroup}>
						<div className={styles.searchBox}>
							<Search size={16} className={styles.searchIcon} />
							<input
								type="text"
								placeholder="Cari nama guru..."
								className={styles.searchInput}
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<button className={styles.filterBtn}>
							<Filter size={16} />
						</button>
					</div>
				</div>

				<div className={styles.tableWrapper}>
					<table className={styles.dataTable}>
						<thead>
							<tr>
								<th>Nama Guru</th>
								<th>NIP</th>
								<th>Status Tugas</th>
								<th>Kelas Saat Ini</th>
								<th>Aksi</th>
							</tr>
						</thead>
						<tbody>
							{paginatedGuru.map((guru) => (
								<tr key={guru.id}>
									<td>
										<div className={styles.teacherInfo}>
											<div className={styles.avatar}>{getInitials(guru.nama)}</div>
											{guru.nama}
										</div>
									</td>
									<td>{guru.npp}</td>
									<td>
										{guru.kelasWaliId ? (
											<span className={styles.badgeWali}>Wali Kelas Aktif</span>
										) : (
											<span className={styles.badgeMapel}>Guru Mapel</span>
										)}
									</td>
									<td style={{ fontWeight: guru.kelasWaliId ? "600" : "400", color: "#111827" }}>{guru.namaKelas}</td>
									<td>
										<button className={styles.btnOutline} onClick={() => openAssignModal(guru)}>
											{guru.kelasWaliId ? "Ubah" : "Assign"}
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* PAGINATION UI */}
				<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", padding: "1rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)" }}>
					<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
						Menampilkan {totalItems === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} dari {totalItems} data
					</span>
					<div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
						<button
							disabled={currentPage === 1}
							onClick={() => setCurrentPage(currentPage - 1)}
							style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPage === 1 ? "#f1f5f9" : "white", color: currentPage === 1 ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
						>
							Prev
						</button>
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
							<button
								key={p}
								onClick={() => setCurrentPage(p)}
								style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPage === p ? "#1e3a8a" : "white", color: currentPage === p ? "white" : "#334155", border: "1px solid", borderColor: currentPage === p ? "#1e3a8a" : "#e2e8f0", cursor: "pointer" }}
							>
								{p}
							</button>
						))}
						<button
							disabled={currentPage === totalPages}
							onClick={() => setCurrentPage(currentPage + 1)}
							style={{ padding: "0.375rem 0.75rem", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: 500, backgroundColor: currentPage === totalPages ? "#f1f5f9" : "white", color: currentPage === totalPages ? "#94a3b8" : "#334155", border: "1px solid #e2e8f0", cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
						>
							Next
						</button>
					</div>
				</div>
			</div>

			{/* MODAL ASSIGN WALI KELAS */}
			{isModalOpen && selectedGuru && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>Assign Wali Kelas</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								className={styles.btnOutline}
								style={{ border: "none", padding: "0.2rem" }}
							>
								<X size={20} />
							</button>
						</div>
						<form onSubmit={handleSimpan}>
							<div className={styles.modalBody}>
								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Nama Guru</label>
									<input
										type="text"
										disabled
										value={selectedGuru.nama}
										className={styles.formSelect}
										style={{ backgroundColor: "#f9fafb" }}
									/>
								</div>

								<div className={styles.formGroup}>
									<label className={styles.formLabel}>Tugaskan ke Kelas</label>
									<select
										className={styles.formSelect}
										value={selectedKelasId}
										onChange={(e) => setSelectedKelasId(e.target.value)}
									>
										<option value="">-- Hapus Penugasan / Tidak Ada Kelas --</option>
										{kelasData.map((k) => (
											<option key={k.id} value={k.id}>
												{k.nama} {k.isAssigned && k.id !== selectedGuru.kelasWaliId ? "(Sudah Terisi)" : ""}
											</option>
										))}
									</select>
								</div>
							</div>
							<div className={styles.modalFooter}>
								<button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnOutline}>
									Batal
								</button>
								<button
									type="submit"
									disabled={loading}
									className={styles.btnPrimary}
									style={{ backgroundColor: "#0a2540" }}
								>
									{loading ? "Menyimpan..." : "Simpan Penugasan"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
}
