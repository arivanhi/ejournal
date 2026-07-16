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
							{filteredGuru.map((guru) => (
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
