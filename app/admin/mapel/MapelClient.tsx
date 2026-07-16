"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Search, X, CheckSquare, Square, BookOpen, Edit2, Trash2 } from "lucide-react";
import styles from "./mapel.module.css";
import { assignMapelAction, editMapelAction, deleteMapelAction } from "./actions";

interface PropMapel {
	guruList: { id: string; nama: string; npp: string }[];
	mapelList: { id: string; nama: string }[];
	kelasList: { id: string; nama: string }[];
	daftarPemetaan: {
		guru: { id: string; nama: string; npp: string };
		mapels: { id: string; nama: string; kelasTarget: string[] }[];
	}[];
	kpi: { totalMapel: number; totalRombel: number };
}

export default function MapelClient({ guruList, mapelList, kelasList, daftarPemetaan, kpi }: PropMapel) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [loading, setLoading] = useState(false);

	// Data Form States
	const [selectedGuru, setSelectedGuru] = useState<{ id: string; nama: string; npp: string } | null>(null);
	const [selectedMapel, setSelectedMapel] = useState<{ id: string; nama: string } | null>(null);
	const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
	const [deleteData, setDeleteData] = useState<{ guruId: string; mapelId: string; namaMapel: string } | null>(null);

	// Custom Auto-fill Search States
	const [searchGuruForm, setSearchGuruForm] = useState("");
	const [searchMapelForm, setSearchMapelForm] = useState("");
	const [isGuruDropdownOpen, setIsGuruDropdownOpen] = useState(false);
	const [isMapelDropdownOpen, setIsMapelDropdownOpen] = useState(false);

	const guruRef = useRef<HTMLDivElement>(null);
	const mapelRef = useRef<HTMLDivElement>(null);

	// Filter Sidebar States
	const [filterCariGuru, setFilterCariGuru] = useState("");
	const [filterMapel, setFilterMapel] = useState("Semua Mapel");
	const [filterCariKelas, setFilterCariKelas] = useState("");

	const getInitials = (name: string) =>
		name
			.split(" ")
			.slice(0, 2)
			.map((n) => n[0])
			.join("")
			.toUpperCase();
	const getBadgeColor = (index: number) => {
		const colors = [styles.badgeBlue, styles.badgeYellow, styles.badgeRed];
		return colors[index % colors.length];
	};

	// Tutup panel rekomendasi jika klik di luar area input
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (guruRef.current && !guruRef.current.contains(e.target as Node)) setIsGuruDropdownOpen(false);
			if (mapelRef.current && !mapelRef.current.contains(e.target as Node)) setIsMapelDropdownOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelectKelas = (id: string) => {
		setSelectedKelasIds((prev) => (prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]));
	};

	const handleSelectAllKelas = () => {
		if (selectedKelasIds.length === kelasList.length) setSelectedKelasIds([]);
		else setSelectedKelasIds(kelasList.map((k) => k.id));
	};

	const openCreateModal = () => {
		setModalMode("create");
		setSelectedGuru(null);
		setSelectedMapel(null);
		setSelectedKelasIds([]);
		setSearchGuruForm("");
		setSearchMapelForm("");
		setIsModalOpen(true);
	};

	const openEditModal = (guru: any, mapel: any) => {
		setModalMode("edit");
		setSelectedGuru(guru);
		setSelectedMapel({ id: mapel.id, nama: mapel.nama });
		setSearchMapelForm(mapel.nama);

		const targetIds = kelasList.filter((k) => mapel.kelasTarget.includes(k.nama)).map((k) => k.id);
		setSelectedKelasIds(targetIds);
		setIsModalOpen(true);
	};

	const handleSimpan = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedGuru || !selectedMapel || selectedKelasIds.length === 0) {
			alert("Lengkapi data Guru, Mata Pelajaran, dan pilih minimal 1 Kelas!");
			return;
		}

		setLoading(true);
		let hasil;
		if (modalMode === "create") {
			hasil = await assignMapelAction(selectedGuru.id, selectedMapel.id, selectedKelasIds);
		} else {
			hasil = await editMapelAction(selectedGuru.id, selectedMapel.id, selectedKelasIds);
		}
		setLoading(false);

		if (hasil.success) setIsModalOpen(false);
		else alert(hasil.message);
	};

	const executeDelete = async () => {
		if (!deleteData) return;
		setLoading(true);
		const hasil = await deleteMapelAction(deleteData.guruId, deleteData.mapelId);
		setLoading(false);

		if (hasil.success) setIsDeleteModalOpen(false);
		else alert(hasil.message);
	};

	// Logika Filter Sidebar
	const filteredPemetaan = daftarPemetaan.filter((p) => {
		const matchGuru =
			p.guru.nama.toLowerCase().includes(filterCariGuru.toLowerCase()) || p.guru.npp.includes(filterCariGuru);
		const matchMapel = filterMapel === "Semua Mapel" || p.mapels.some((m) => m.id === filterMapel);
		const matchKelas =
			filterCariKelas === "" ||
			p.mapels.some((m) => m.kelasTarget.some((k) => k.toLowerCase().includes(filterCariKelas.toLowerCase())));
		return matchGuru && matchMapel && matchKelas;
	});

	return (
		<div className={styles.pageContainer}>
			<div className={styles.pageHeader}>
				<div>
					<h1 className={styles.pageTitle}>Manajemen Mapel</h1>
					<p className={styles.pageSubtitle}>Pemetaan Guru & Mata Pelajaran</p>
				</div>
				<button
					className={styles.btnPrimary}
					style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}
					onClick={openCreateModal}
				>
					<Plus size={16} /> Assign Subject
				</button>
			</div>

			<div className={styles.mainLayout}>
				{/* === KIRI: FILTERS === */}
				<div className={styles.leftSidebar}>
					<div className={styles.filterCard}>
						<h3>Filters</h3>
						<div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
							<label className={styles.formLabel}>Cari Guru</label>
							<input
								type="text"
								placeholder="Nama Guru atau NIP"
								className={styles.formInput}
								value={filterCariGuru}
								onChange={(e) => setFilterCariGuru(e.target.value)}
							/>
						</div>
						<div className={styles.formGroup} style={{ marginBottom: "1rem" }}>
							<label className={styles.formLabel}>Mata Pelajaran</label>
							<select className={styles.formInput} value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)}>
								<option value="Semua Mapel">Semua Mapel</option>
								{mapelList.map((m) => (
									<option key={m.id} value={m.id}>
										{m.nama}
									</option>
								))}
							</select>
						</div>
						<div className={styles.formGroup} style={{ marginBottom: 0 }}>
							<label className={styles.formLabel}>Cari Kelas Terdampak</label>
							<input
								type="text"
								placeholder="Contoh: X MIPA 1"
								className={styles.formInput}
								value={filterCariKelas}
								onChange={(e) => setFilterCariKelas(e.target.value)}
							/>
						</div>
					</div>

					<div className={styles.darkSummaryCard}>
						<BookOpen size={100} style={{ position: "absolute", right: "-20px", bottom: "-20px", opacity: 0.1 }} />
						<h4>Total Mapel Aktif</h4>
						<div className={styles.bigNumber}>{kpi.totalMapel}</div>
						<p>Terdistribusi pada {kpi.totalRombel} rombel kelas.</p>
					</div>
				</div>

				{/* === KANAN: TABEL PEMETAAN === */}
				<div className={styles.contentCard}>
					<div className={styles.cardHeader}>
						<h2 className={styles.cardTitle}>Daftar Pemetaan</h2>
					</div>

					<table className={styles.dataTable}>
						<thead>
							<tr>
								<th>Nama Guru & NIP</th>
								<th>Mata Pelajaran</th>
								<th style={{ width: "35%" }}>Kelas Target</th>
								<th>Aksi</th>
							</tr>
						</thead>
						<tbody>
							{filteredPemetaan.length === 0 ? (
								<tr>
									<td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>
										Tidak ada data pemetaan yang cocok dengan filter.
									</td>
								</tr>
							) : (
								filteredPemetaan.map((item, index) => (
									<tr key={index}>
										<td>
											<div className={styles.teacherInfo}>
												<div className={styles.avatar}>{getInitials(item.guru.nama)}</div>
												<div>
													<div style={{ fontWeight: 600, color: "#111827" }}>{item.guru.nama}</div>
													<div style={{ fontSize: "0.75rem" }}>{item.guru.npp}</div>
												</div>
											</div>
										</td>
										<td>
											<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
												{item.mapels.map((m, i) => (
													<div key={i}>
														<span className={`${styles.badgeMapel} ${getBadgeColor(i)}`}>{m.nama}</span>
													</div>
												))}
											</div>
										</td>
										<td style={{ lineHeight: 1.5 }}>
											<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
												{item.mapels.map((m, i) => (
													<div key={i} style={{ minHeight: "22px" }}>
														{m.kelasTarget.join(", ")}
													</div>
												))}
											</div>
										</td>
										<td>
											<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
												{item.mapels.map((m, i) => (
													<div
														key={i}
														style={{ display: "flex", gap: "0.75rem", minHeight: "22px", alignItems: "center" }}
													>
														<Edit2
															size={16}
															className={styles.actionIcon}
															onClick={() => openEditModal(item.guru, m)}
															style={{ cursor: "pointer", color: "#6b7280" }}
														/>
														<Trash2
															size={16}
															className={styles.actionIcon}
															onClick={() => {
																setDeleteData({ guruId: item.guru.id, mapelId: m.id, namaMapel: m.nama });
																setIsDeleteModalOpen(true);
															}}
															style={{ cursor: "pointer", color: "#ef4444" }}
														/>
													</div>
												))}
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* === MODAL ASSIGN / EDIT MAPEL === */}
			{isModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle}>
								{modalMode === "create" ? "Assign Mata Pelajaran Baru" : "Edit Pemetaan Kelas"}
							</h2>
							<button
								onClick={() => setIsModalOpen(false)}
								style={{ background: "none", border: "none", cursor: "pointer" }}
							>
								<X size={20} />
							</button>
						</div>

						<form onSubmit={handleSimpan}>
							<div className={styles.modalBody}>
								{/* STEP 1: PILIH GURU */}
								<div className={styles.stepHeader}>
									<div className={styles.stepNumber}>1</div>
									<div className={styles.stepTitle}>Pilih Guru</div>
								</div>
								<div className={styles.formGroup} ref={guruRef} style={{ marginLeft: "2.25rem" }}>
									<label className={styles.formLabel} style={{ fontWeight: 400 }}>
										Cari & Pilih Guru Pengampu
									</label>
									<div
										className={styles.formInput}
										style={{
											display: "flex",
											gap: "0.5rem",
											alignItems: "center",
											backgroundColor: modalMode === "edit" ? "#f3f4f6" : "white",
										}}
										onClick={() => modalMode === "create" && setIsGuruDropdownOpen(true)}
									>
										<Search size={16} color="#9ca3af" />
										<input
											type="text"
											placeholder="Ketik nama atau NIP guru..."
											value={selectedGuru ? selectedGuru.nama : searchGuruForm}
											onChange={(e) => {
												setSearchGuruForm(e.target.value);
												setSelectedGuru(null);
												setIsGuruDropdownOpen(true);
											}}
											disabled={modalMode === "edit"}
											style={{ border: "none", outline: "none", width: "100%", backgroundColor: "transparent" }}
										/>
									</div>
									{isGuruDropdownOpen && modalMode === "create" && (
										<div className={styles.dropdownList}>
											{guruList
												.filter((g) => g.nama.toLowerCase().includes(searchGuruForm.toLowerCase()))
												.map((g) => (
													<div
														key={g.id}
														className={styles.dropdownItem}
														onClick={() => {
															setSelectedGuru(g);
															setIsGuruDropdownOpen(false);
														}}
													>
														<div className={styles.avatar} style={{ width: "2rem", height: "2rem" }}>
															{getInitials(g.nama)}
														</div>
														<div>
															<div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{g.nama}</div>
															<div style={{ fontSize: "0.75rem", color: "#6b7280" }}>NIP: {g.npp}</div>
														</div>
													</div>
												))}
										</div>
									)}
								</div>

								{/* STEP 2: PILIH MAPEL (REVISI: FORM INPUT AUTOFILL MODERN) */}
								<div className={styles.stepHeader} style={{ marginTop: "2rem" }}>
									<div className={styles.stepNumber}>2</div>
									<div className={styles.stepTitle}>Pilih Mata Pelajaran</div>
								</div>
								<div className={styles.formGroup} ref={mapelRef} style={{ marginLeft: "2.25rem" }}>
									<label className={styles.formLabel} style={{ fontWeight: 400 }}>
										Mata Pelajaran yang akan diajarkan
									</label>
									<div
										className={styles.formInput}
										style={{
											display: "flex",
											gap: "0.5rem",
											alignItems: "center",
											backgroundColor: modalMode === "edit" ? "#f3f4f6" : "white",
										}}
										onClick={() => modalMode === "create" && setIsMapelDropdownOpen(true)}
									>
										<Search size={16} color="#9ca3af" />
										<input
											type="text"
											placeholder="Ketik nama mata pelajaran untuk memicu autofill..."
											value={selectedMapel ? selectedMapel.nama : searchMapelForm}
											onChange={(e) => {
												setSearchMapelForm(e.target.value);
												setSelectedMapel(null);
												setIsMapelDropdownOpen(true);
											}}
											disabled={modalMode === "edit"}
											style={{ border: "none", outline: "none", width: "100%", backgroundColor: "transparent" }}
										/>
									</div>
									{/* Panel Rekomendasi Autofill Melayang Modern */}
									{isMapelDropdownOpen && modalMode === "create" && (
										<div className={styles.dropdownList}>
											{mapelList.filter((m) => m.nama.toLowerCase().includes(searchMapelForm.toLowerCase())).length ===
											0 ? (
												<div className={styles.dropdownItem} style={{ color: "#9ca3af", cursor: "default" }}>
													Mata pelajaran tidak ditemukan
												</div>
											) : (
												mapelList
													.filter((m) => m.nama.toLowerCase().includes(searchMapelForm.toLowerCase()))
													.map((m) => (
														<div
															key={m.id}
															className={styles.dropdownItem}
															onClick={() => {
																setSelectedMapel(m);
																setIsMapelDropdownOpen(false);
															}}
														>
															<div style={{ fontWeight: 500, fontSize: "0.875rem", color: "#111827" }}>{m.nama}</div>
														</div>
													))
											)}
										</div>
									)}
								</div>

								{/* STEP 3: PILIH KELAS TARGET */}
								<div className={styles.stepHeader} style={{ marginTop: "2rem" }}>
									<div className={styles.stepNumber}>3</div>
									<div className={styles.stepTitle}>Pilih Kelas Target</div>
								</div>
								<div style={{ marginLeft: "2.25rem" }}>
									<div
										style={{
											display: "flex",
											justifyContent: "space-between",
											marginBottom: "0.5rem",
											fontSize: "0.75rem",
											color: "#6b7280",
										}}
									>
										<span>Pilih satu atau lebih kelas</span>
										<span
											style={{ color: "#0369a1", cursor: "pointer", fontWeight: 600 }}
											onClick={handleSelectAllKelas}
										>
											Tandai Semua
										</span>
									</div>

									<div className={styles.kelasGrid}>
										{kelasList.map((kelas) => (
											<label
												key={kelas.id}
												className={`${styles.kelasPill} ${selectedKelasIds.includes(kelas.id) ? styles.kelasPillActive : ""}`}
											>
												<input
													type="checkbox"
													hidden
													checked={selectedKelasIds.includes(kelas.id)}
													onChange={() => handleSelectKelas(kelas.id)}
												/>
												{selectedKelasIds.includes(kelas.id) ? (
													<CheckSquare size={16} />
												) : (
													<Square size={16} color="#d1d5db" />
												)}
												{kelas.nama}
											</label>
										))}
									</div>
									<div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.75rem" }}>
										ⓘ {selectedKelasIds.length} kelas terpilih
									</div>
								</div>
							</div>

							<div className={styles.modalFooter}>
								<button type="button" onClick={() => setIsModalOpen(false)} className={styles.btnOutline}>
									Batal
								</button>
								<button type="submit" disabled={loading} className={styles.btnPrimary}>
									{loading ? "Menyimpan..." : "Simpan Penugasan"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* === MODAL KONFIRMASI HAPUS === */}
			{isDeleteModalOpen && deleteData && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer} style={{ maxWidth: "400px" }}>
						<div className={styles.modalHeader}>
							<h2 className={styles.modalTitle} style={{ color: "#ef4444" }}>
								Hapus Pemetaan
							</h2>
							<button
								onClick={() => setIsDeleteModalOpen(false)}
								style={{ background: "none", border: "none", cursor: "pointer" }}
							>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", lineHeight: "1.5" }}>
								Yakin ingin mencabut seluruh kelas untuk mata pelajaran <strong>{deleteData.namaMapel}</strong> dari
								guru ini?
							</p>
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
							<button
								type="button"
								disabled={loading}
								onClick={executeDelete}
								className={styles.btnPrimary}
								style={{ backgroundColor: "#ef4444" }}
							>
								Ya, Hapus
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
