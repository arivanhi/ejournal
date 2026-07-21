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

	const [selectedGuru, setSelectedGuru] = useState<{ id: string; nama: string; npp: string } | null>(null);
	const [selectedMapel, setSelectedMapel] = useState<{ id: string; nama: string } | null>(null);
	const [oldMapelId, setOldMapelId] = useState("");
	const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);
	const [deleteData, setDeleteData] = useState<{ guruId: string; mapelId: string; namaMapel: string } | null>(null);

	const [searchGuruForm, setSearchGuruForm] = useState("");
	const [searchMapelForm, setSearchMapelForm] = useState("");
	const [isGuruDropdownOpen, setIsGuruDropdownOpen] = useState(false);
	const [isMapelDropdownOpen, setIsMapelDropdownOpen] = useState(false);

	const guruRef = useRef<HTMLDivElement>(null);
	const mapelRef = useRef<HTMLDivElement>(null);

	const [filterCariGuru, setFilterCariGuru] = useState("");
	const [filterCariMapel, setFilterCariMapel] = useState("");
	const [filterCariKelas, setFilterCariKelas] = useState("");

	const [isSidebarGuruOpen, setIsSidebarGuruOpen] = useState(false);
	const [isSidebarMapelOpen, setIsSidebarMapelOpen] = useState(false);
	const [isSidebarKelasOpen, setIsSidebarKelasOpen] = useState(false);

	const filterGuruRef = useRef<HTMLDivElement>(null);
	const filterMapelRef = useRef<HTMLDivElement>(null);
	const filterKelasRef = useRef<HTMLDivElement>(null);

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

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (guruRef.current && !guruRef.current.contains(e.target as Node)) setIsGuruDropdownOpen(false);
			if (mapelRef.current && !mapelRef.current.contains(e.target as Node)) setIsMapelDropdownOpen(false);

			if (filterGuruRef.current && !filterGuruRef.current.contains(e.target as Node)) setIsSidebarGuruOpen(false);
			if (filterMapelRef.current && !filterMapelRef.current.contains(e.target as Node)) setIsSidebarMapelOpen(false);
			if (filterKelasRef.current && !filterKelasRef.current.contains(e.target as Node)) setIsSidebarKelasOpen(false);
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
		setOldMapelId(mapel.id);
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
		let hasil =
			modalMode === "create"
				? await assignMapelAction(selectedGuru.id, selectedMapel.id, selectedKelasIds)
				: await editMapelAction(selectedGuru.id, selectedMapel.id, selectedKelasIds, oldMapelId);
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

	const filteredPemetaan = daftarPemetaan.filter((p) => {
		const matchGuru =
			p.guru.nama.toLowerCase().includes(filterCariGuru.toLowerCase()) || p.guru.npp.includes(filterCariGuru);
		const matchMapel =
			filterCariMapel === "" || p.mapels.some((m) => m.nama.toLowerCase().includes(filterCariMapel.toLowerCase()));
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
				{/* === KIRI: FILTERS SIDEBAR === */}
				<div className={styles.leftSidebar}>
					<div className={styles.filterCard}>
						<h3>Filters</h3>
						{/* FILTER GURU */}
						<div
							className={styles.formGroup}
							ref={filterGuruRef}
							style={{ marginBottom: "1rem", position: "relative" }}
						>
							<label className={styles.formLabel}>Cari Guru</label>
							<div
								className={styles.formInput}
								style={{ display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "white" }}
								onClick={() => setIsSidebarGuruOpen(true)}
							>
								<Search size={16} color="#9ca3af" />
								<input
									type="text"
									placeholder="Nama Guru atau NIP"
									style={{
										border: "none",
										outline: "none",
										width: "100%",
										backgroundColor: "transparent",
										padding: 0,
										fontSize: "0.875rem",
									}}
									value={filterCariGuru}
									onChange={(e) => {
										setFilterCariGuru(e.target.value);
										setIsSidebarGuruOpen(true);
									}}
								/>
								{filterCariGuru && (
									<X size={14} color="#9ca3af" style={{ cursor: "pointer" }} onClick={() => setFilterCariGuru("")} />
								)}
							</div>
							{isSidebarGuruOpen && (
								<div className={styles.dropdownList}>
									{guruList.filter(
										(g) =>
											g.nama.toLowerCase().includes(filterCariGuru.toLowerCase()) || g.npp.includes(filterCariGuru),
									).length === 0 ? (
										<div className={styles.dropdownItem} style={{ color: "#9ca3af", cursor: "default" }}>
											Guru tidak ditemukan
										</div>
									) : (
										guruList
											.filter(
												(g) =>
													g.nama.toLowerCase().includes(filterCariGuru.toLowerCase()) || g.npp.includes(filterCariGuru),
											)
											.slice(0, 5)
											.map((g) => (
												<div
													key={g.id}
													className={styles.dropdownItem}
													onClick={() => {
														setFilterCariGuru(g.nama);
														setIsSidebarGuruOpen(false);
													}}
												>
													<div style={{ fontWeight: 500, fontSize: "0.875rem" }}>{g.nama}</div>
												</div>
											))
									)}
								</div>
							)}
						</div>

						{/* FILTER MATA PELAJARAN */}
						<div
							className={styles.formGroup}
							ref={filterMapelRef}
							style={{ marginBottom: "1rem", position: "relative" }}
						>
							<label className={styles.formLabel}>Mata Pelajaran</label>
							<div
								className={styles.formInput}
								style={{ display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "white" }}
								onClick={() => setIsSidebarMapelOpen(true)}
							>
								<Search size={16} color="#9ca3af" />
								<input
									type="text"
									placeholder="Ketik nama mapel..."
									style={{
										border: "none",
										outline: "none",
										width: "100%",
										backgroundColor: "transparent",
										padding: 0,
										fontSize: "0.875rem",
									}}
									value={filterCariMapel}
									onChange={(e) => {
										setFilterCariMapel(e.target.value);
										setIsSidebarMapelOpen(true);
									}}
								/>
								{filterCariMapel && (
									<X size={14} color="#9ca3af" style={{ cursor: "pointer" }} onClick={() => setFilterCariMapel("")} />
								)}
							</div>
							{isSidebarMapelOpen && (
								<div className={styles.dropdownList}>
									{mapelList.filter((m) => m.nama.toLowerCase().includes(filterCariMapel.toLowerCase())).length ===
									0 ? (
										<div className={styles.dropdownItem} style={{ color: "#9ca3af", cursor: "default" }}>
											Mapel tidak ditemukan
										</div>
									) : (
										mapelList
											.filter((m) => m.nama.toLowerCase().includes(filterCariMapel.toLowerCase()))
											.slice(0, 5)
											.map((m) => (
												<div
													key={m.id}
													className={styles.dropdownItem}
													onClick={() => {
														setFilterCariMapel(m.nama);
														setIsSidebarMapelOpen(false);
													}}
												>
													<div style={{ fontSize: "0.875rem" }}>{m.nama}</div>
												</div>
											))
									)}
								</div>
							)}
						</div>

						{/* FILTER KELAS TERDAMPAK */}
						<div className={styles.formGroup} ref={filterKelasRef} style={{ marginBottom: 0, position: "relative" }}>
							<label className={styles.formLabel}>Cari Kelas Terdampak</label>
							<div
								className={styles.formInput}
								style={{ display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "white" }}
								onClick={() => setIsSidebarKelasOpen(true)}
							>
								<Search size={16} color="#9ca3af" />
								<input
									type="text"
									placeholder="Contoh: X MIPA 1"
									style={{
										border: "none",
										outline: "none",
										width: "100%",
										backgroundColor: "transparent",
										padding: 0,
										fontSize: "0.875rem",
									}}
									value={filterCariKelas}
									onChange={(e) => {
										setFilterCariKelas(e.target.value);
										setIsSidebarKelasOpen(true);
									}}
								/>
								{filterCariKelas && (
									<X size={14} color="#9ca3af" style={{ cursor: "pointer" }} onClick={() => setFilterCariKelas("")} />
								)}
							</div>
							{isSidebarKelasOpen && (
								<div className={styles.dropdownList}>
									{kelasList.filter((k) => k.nama.toLowerCase().includes(filterCariKelas.toLowerCase())).length ===
									0 ? (
										<div className={styles.dropdownItem} style={{ color: "#9ca3af", cursor: "default" }}>
											Kelas tidak ditemukan
										</div>
									) : (
										kelasList
											.filter((k) => k.nama.toLowerCase().includes(filterCariKelas.toLowerCase()))
											.slice(0, 5)
											.map((k) => (
												<div
													key={k.id}
													className={styles.dropdownItem}
													onClick={() => {
														setFilterCariKelas(k.nama);
														setIsSidebarKelasOpen(false);
													}}
												>
													<div style={{ fontSize: "0.875rem" }}>{k.nama}</div>
												</div>
											))
									)}
								</div>
							)}
						</div>
					</div>

					<div className={styles.darkSummaryCard}>
						<BookOpen size={100} style={{ position: "absolute", right: "-20px", bottom: "-20px", opacity: 0.1 }} />
						<h4>Total Mapel Aktif</h4>
						<div className={styles.bigNumber}>{kpi.totalMapel}</div>
						<p>Terdistribusi pada {kpi.totalRombel} rombel kelas.</p>
					</div>
				</div>

				{/* === KANAN: TABEL PEMETAAN (DIDESAIN ULANG!) === */}
				<div className={styles.contentCard}>
					<div className={styles.cardHeader}>
						<h2 className={styles.cardTitle}>Daftar Pemetaan</h2>
					</div>

					<table className={styles.dataTable}>
						<thead>
							<tr>
								<th style={{ width: "35%" }}>Nama Guru & NIP</th>
								<th>Detail Penugasan Mengajar</th>
							</tr>
						</thead>
						<tbody>
							{filteredPemetaan.length === 0 ? (
								<tr>
									<td colSpan={2} style={{ textAlign: "center", padding: "2rem" }}>
										Tidak ada data pemetaan yang cocok dengan filter.
									</td>
								</tr>
							) : (
								filteredPemetaan.map((item, index) => (
									<tr key={index}>
										{/* INFO GURU (Diposisikan selalu di atas / align-top) */}
										<td style={{ verticalAlign: "top", paddingTop: "1.25rem" }}>
											<div className={styles.teacherInfo}>
												<div className={styles.avatar}>{getInitials(item.guru.nama)}</div>
												<div>
													<div style={{ fontWeight: 600, color: "#111827" }}>{item.guru.nama}</div>
													<div style={{ fontSize: "0.75rem" }}>{item.guru.npp}</div>
												</div>
											</div>
										</td>

										{/* DETAIL PENUGASAN: MAPEL + KELAS + AKSI DALAM 1 CARD */}
										<td style={{ verticalAlign: "top", paddingTop: "1rem", paddingBottom: "1rem" }}>
											<div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
												{item.mapels.map((m, i) => (
													<div
														key={i}
														style={{
															display: "flex",
															justifyContent: "space-between",
															alignItems: "center",
															backgroundColor: "#f9fafb",
															border: "1px solid #e5e7eb",
															padding: "0.75rem 1rem",
															borderRadius: "0.5rem",
														}}
													>
														{/* BAGIAN KIRI: Mapel & Kelas Target */}
														<div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
															<div>
																<span className={`${styles.badgeMapel} ${getBadgeColor(i)}`}>{m.nama}</span>
															</div>
															<div
																style={{
																	fontSize: "0.75rem",
																	color: "#6b7280",
																	display: "flex",
																	alignItems: "center",
																	gap: "0.35rem",
																}}
															>
																<span>
																	Target Kelas:{" "}
																	<strong style={{ color: "#374151", fontWeight: 600 }}>
																		{m.kelasTarget.join(", ")}
																	</strong>
																</span>
															</div>
														</div>

														{/* BAGIAN KANAN: Tombol Aksi */}
														<div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
															<button className={styles.btnActionList} onClick={() => openEditModal(item.guru, m)}>
																<Edit2 size={14} />{" "}
																<span style={{ display: "none", sm: { display: "block" } }}>Edit</span>
															</button>
															<button
																className={styles.btnActionListDanger}
																onClick={() => {
																	setDeleteData({ guruId: item.guru.id, mapelId: m.id, namaMapel: m.nama });
																	setIsDeleteModalOpen(true);
																}}
															>
																<Trash2 size={14} />
															</button>
														</div>
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
								{modalMode === "create" ? "Assign Mata Pelajaran Baru" : "Edit Pemetaan Mapel & Kelas"}
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

								{/* STEP 2: PILIH MAPEL (DAPAT DIEDIT KAPAN SAJA) */}
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
										style={{ display: "flex", gap: "0.5rem", alignItems: "center", backgroundColor: "white" }}
										onClick={() => setIsMapelDropdownOpen(true)}
									>
										<Search size={16} color="#9ca3af" />
										<input
											type="text"
											placeholder="Ketik nama mata pelajaran..."
											value={selectedMapel ? selectedMapel.nama : searchMapelForm}
											onChange={(e) => {
												setSearchMapelForm(e.target.value);
												setSelectedMapel(null);
												setIsMapelDropdownOpen(true);
											}}
											style={{ border: "none", outline: "none", width: "100%", backgroundColor: "transparent" }}
										/>
										{selectedMapel && (
											<X
												size={14}
												color="#9ca3af"
												style={{ cursor: "pointer" }}
												onClick={(e) => {
													e.stopPropagation();
													setSelectedMapel(null);
													setSearchMapelForm("");
													setIsMapelDropdownOpen(true);
												}}
											/>
										)}
									</div>
									{isMapelDropdownOpen && (
										<div className={styles.dropdownList}>
											{mapelList.filter((m) => m.nama.toLowerCase().includes(searchMapelForm.toLowerCase())).length ===
											0 ? (
												<div className={styles.dropdownItem} style={{ color: "#9ca3af", cursor: "default" }}>
													Mata pelajaran tidak ditemukan
												</div>
											) : (
												mapelList
													.filter((m) => m.nama.toLowerCase().includes(searchMapelForm.toLowerCase()))
													.slice(0, 5)
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
