"use client";

import { useState, useEffect } from "react";
import {
	LayoutDashboard,
	Users,
	Clock,
	BookOpen,
	FileBarChart,
	Settings,
	LogOut,
	Search,
	Filter,
	ArrowLeft,
	CheckCircle2,
	AlertTriangle,
	Calculator,
	Microscope,
	Globe,
	FlaskConical,
	Bell,
	Building,
	User,
} from "lucide-react";
import styles from "./monitoring.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function MonitoringClient({ user, dataMonitoring }: any) {
	const [viewMode, setViewMode] = useState<"list" | "detail">("list");
	const [selectedItem, setSelectedItem] = useState<any>(null);

	// State Filter Pencarian Grid
	const [searchTerm, setSearchTerm] = useState("");

	// Paginasi Card
	const [currentCardPage, setCurrentCardPage] = useState(1);
	const cardsPerPage = 6;

	// Fitur Pencarian & Sortir di Tabel
	const [searchTopik, setSearchTopik] = useState("");
	const [sortConfig, setSortConfig] = useState({ key: "pertemuanKe", direction: "desc" });
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 5;

	// Reset pagination ketika melakukan pencarian grid (Autofill filter)
	useEffect(() => {
		setCurrentCardPage(1);
	}, [searchTerm]);

	const handleLihatDetail = (item: any) => {
		setSelectedItem(item);
		setSearchTopik("");
		setCurrentPage(1);
		setSortConfig({ key: "pertemuanKe", direction: "desc" });
		setViewMode("detail");
	};

	const handleSort = (key: string) => {
		let direction = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
		setSortConfig({ key, direction });
	};

	// Filter Grid KBM (Mencari Mapel, Guru, atau Kelas)
	const filteredData = dataMonitoring.filter(
		(item: any) =>
			item.mapelNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.guruNama.toLowerCase().includes(searchTerm.toLowerCase()) ||
			item.kelasNama.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const totalCardPages = Math.max(1, Math.ceil(filteredData.length / cardsPerPage));
	const paginatedCards = filteredData.slice((currentCardPage - 1) * cardsPerPage, currentCardPage * cardsPerPage);

	const processedRiwayat = [...(selectedItem?.riwayat || [])]
		.filter((row: any) => row.topik.toLowerCase().includes(searchTopik.toLowerCase()))
		.sort((a: any, b: any) => {
			if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "asc" ? -1 : 1;
			if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "asc" ? 1 : -1;
			return 0;
		});

	const paginatedRiwayat = processedRiwayat.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
	const totalPages = Math.max(1, Math.ceil(processedRiwayat.length / itemsPerPage));

	const getMapelIcon = (mapelNama: string) => {
		const name = mapelNama.toLowerCase();
		if (name.includes("matematika")) return <Calculator size={20} color="#64748b" />;
		if (name.includes("biologi")) return <Microscope size={20} color="#64748b" />;
		if (name.includes("inggris")) return <Globe size={20} color="#64748b" />;
		if (name.includes("fisika") || name.includes("kimia")) return <FlaskConical size={20} color="#64748b" />;
		return <BookOpen size={20} color="#64748b" />;
	};

	const renderSortIcon = (columnName: string) => {
		if (sortConfig.key === columnName) {
			return sortConfig.direction === "asc" ? " ↑" : " ↓";
		}
		return "";
	};

	return (
		<div className={styles.layoutWrapper}>
			<aside className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<div className={styles.logoWrapper}>
						<img src="/logo.jpg" alt="Logo" className={styles.logoImage} />
					</div>
					<div>
						<div className={styles.schoolName}>SMAN 2 Brebes</div>
						<div className={styles.portalName}>Dashboard Pimpinan</div>
					</div>
				</div>

				<nav className={styles.menuContainer}>
					<Link href="/pimpinan/dashboard" className={styles.menuItem}>
						<LayoutDashboard size={18} /> Dashboard
					</Link>
					<Link href="/pimpinan/kehadiran" className={styles.menuItem}>
						<Users size={18} /> Kehadiran Siswa
					</Link>
					<Link href="/pimpinan/monitoring" className={`${styles.menuItem} ${styles.menuItemActive}`}>
						<Clock size={18} /> Monitoring KBM
					</Link>
					<Link href="/pimpinan/jurnal" className={styles.menuItem}>
						<BookOpen size={18} /> Jurnal Mengajar
					</Link>
					<Link href="/pimpinan/report" className={styles.menuItem}>
						<FileBarChart size={18} /> Laporan Rekapitulasi
					</Link>
					<Link href="/pimpinan/setelan" className={styles.menuItem}>
						<Settings size={18} /> Setelan
					</Link>
				</nav>

				<div className={styles.sidebarFooter}>
					<button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
						<LogOut size={18} /> Keluar
					</button>
				</div>
			</aside>

			<main className={styles.mainContent}>
				<header className={styles.topbar}>
					<div>
						<h1 className={styles.topbarTitle}>E-Journal & Presensi</h1>
					</div>
					<div className={styles.topbarActions}>
						<Bell size={20} className={styles.iconAction} />
						<Settings size={20} className={styles.iconAction} />
						<div className={styles.profileSection}>
							<div className={styles.profileInfo}>
								<span className={styles.profileName}>{user.nama}</span>
								<span className={styles.profileRole}>
									{user.role === "KEPSEK" ? "Kepala Sekolah" : "Wakil Kepala Sekolah"}
								</span>
							</div>
						</div>
					</div>
				</header>

				<div className={styles.dashboardContainer}>
					{viewMode === "list" && (
						<div>
							<div className={styles.sectionHeader}>
								<div>
									<h2 className={styles.sectionTitle}>Monitoring Jurnal Mengajar</h2>
									<p className={styles.sectionDate}>Overview of teaching journals across all subjects and classes.</p>
								</div>
								{/* PERBAIKAN: Menambahkan Kotak Pencarian di View 1 */}
								<div className={styles.headerButtons}>
									<div className={styles.searchBoxCard}>
										<Search size={16} className={styles.searchIcon} />
										<input
											type="text"
											placeholder="Cari Mapel, Kelas, atau Guru..."
											className={styles.searchInput}
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
										/>
									</div>
									<button className={styles.btnOutline}>
										<Filter size={16} /> Filter
									</button>
								</div>
							</div>

							<div className={styles.gridCards}>
								{paginatedCards.length === 0 ? (
									<div className={styles.emptyState}>Tidak ada kelas yang cocok dengan pencarian.</div>
								) : (
									paginatedCards.map((item: any) => (
										<div key={item.id} className={styles.kbmCard}>
											<div className={styles.kbmCardHeader}>
												<div>
													<h3 className={styles.kbmMapel}>{item.mapelNama}</h3>
													<p className={styles.kbmKelas}>{item.kelasNama}</p>
												</div>
												<div className={styles.iconMapel}>{getMapelIcon(item.mapelNama)}</div>
											</div>

											<div className={styles.guruProfileBox}>
												<div className={styles.guruAvatar}>{item.guruInitials}</div>
												<div>
													<div className={styles.guruName}>{item.guruNama}</div>
													<div className={styles.guruRole}>Teacher</div>
												</div>
											</div>

											<div className={styles.progressSection}>
												<div className={styles.progressLabels}>
													<span>Jumlah Jurnal</span>
													<span style={{ fontWeight: 800 }}>
														{item.terisi}/{item.totalSesi}{" "}
														<span style={{ fontSize: "0.75rem", fontWeight: 500, color: "#64748b" }}>Sesi</span>
													</span>
												</div>
												<div className={styles.progressTrack}>
													<div
														className={styles.progressBar}
														style={{
															width: `${item.totalSesi > 0 ? (item.terisi / item.totalSesi) * 100 : 0}%`,
															backgroundColor:
																item.jamKosong > 0 ? (item.terisi === 0 ? "#ef4444" : "#f59e0b") : "#10b981",
														}}
													></div>
												</div>
											</div>

											<button className={styles.btnOutlineFull} onClick={() => handleLihatDetail(item)}>
												Lihat Detail
											</button>
										</div>
									))
								)}
							</div>

							{totalCardPages > 1 && (
								<div className={styles.paginationCenter}>
									<div className={styles.pageButtons}>
										<button
											className={styles.pageBtn}
											disabled={currentCardPage === 1}
											onClick={() => setCurrentCardPage((p) => p - 1)}
										>
											&lt; Prev
										</button>
										<span className={styles.pageIndicator}>
											Halaman {currentCardPage} dari {totalCardPages}
										</span>
										<button
											className={styles.pageBtn}
											disabled={currentCardPage === totalCardPages}
											onClick={() => setCurrentCardPage((p) => p + 1)}
										>
											Next &gt;
										</button>
									</div>
								</div>
							)}
						</div>
					)}

					{viewMode === "detail" && selectedItem && (
						<div>
							<button className={styles.btnBack} onClick={() => setViewMode("list")}>
								<ArrowLeft size={16} /> Detail Jurnal & Monitoring
							</button>

							<div className={styles.detailHeaderGrid}>
								<div className={styles.detailSummaryCard}>
									<div className={styles.iconBoxBlue}>
										<BookOpen size={24} color="#3b82f6" />
									</div>
									<div>
										<h2 className={styles.detailTitleBig}>{selectedItem.mapelNama}</h2>
										<div className={styles.detailSubInfo}>
											<div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
												<Building size={14} color="#64748b" /> {selectedItem.kelasNama}
											</div>
											<span style={{ color: "#cbd5e1" }}>•</span>
											<div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
												<User size={14} color="#64748b" /> {selectedItem.guruNama}
											</div>
											<span style={{ color: "#cbd5e1" }}>•</span>
											<span style={{ color: "#94a3b8" }}>(NPP: {selectedItem.guruNpp})</span>
										</div>
									</div>
								</div>
								<div className={styles.alertSummaryCard}>
									<AlertTriangle size={24} color="#ef4444" style={{ marginBottom: "0.5rem" }} />
									<div style={{ color: "#64748b", fontSize: "0.875rem", fontWeight: 600 }}>Total Jam Kosong</div>
									<div style={{ color: "#ef4444", fontSize: "2rem", fontWeight: 800 }}>
										{selectedItem.jamKosong} <span style={{ fontSize: "1rem", fontWeight: 600 }}>Sesi</span>
									</div>
								</div>
							</div>

							<div className={styles.tableCard}>
								<div className={styles.tableHeader}>
									<h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>Riwayat Sesi Pembelajaran</h3>
									<div className={styles.headerButtons}>
										<div className={styles.searchBoxCard}>
											<Search size={16} className={styles.searchIcon} />
											<input
												type="text"
												placeholder="Cari topik..."
												className={styles.searchInput}
												value={searchTopik}
												onChange={(e) => {
													setSearchTopik(e.target.value);
													setCurrentPage(1);
												}}
											/>
										</div>
									</div>
								</div>

								<div className={styles.tableWrapper}>
									<table className={styles.dataTable}>
										<thead>
											<tr>
												<th
													className={styles.sortableTh}
													onClick={() => handleSort("pertemuanKe")}
													style={{ width: "130px" }}
												>
													PERTEMUAN KE-{renderSortIcon("pertemuanKe")}
												</th>
												<th
													className={styles.sortableTh}
													onClick={() => handleSort("tanggalRaw")}
													style={{ width: "150px" }}
												>
													TANGGAL{renderSortIcon("tanggalRaw")}
												</th>
												<th
													className={styles.sortableTh}
													onClick={() => handleSort("jamStr")}
													style={{ width: "150px" }}
												>
													JAM{renderSortIcon("jamStr")}
												</th>
												<th className={styles.sortableTh} onClick={() => handleSort("topik")}>
													TOPIK PEMBELAJARAN{renderSortIcon("topik")}
												</th>
												<th
													className={styles.sortableTh}
													onClick={() => handleSort("status")}
													style={{ width: "150px", textAlign: "center" }}
												>
													STATUS{renderSortIcon("status")}
												</th>
											</tr>
										</thead>
										<tbody>
											{paginatedRiwayat.length === 0 ? (
												<tr>
													<td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
														Tidak ada riwayat yang cocok dengan pencarian.
													</td>
												</tr>
											) : (
												paginatedRiwayat.map((row: any, i: number) => (
													<tr key={i}>
														<td style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0f172a" }}>
															{String(row.pertemuanKe).padStart(2, "0")}
														</td>
														<td style={{ color: "#475569", fontWeight: 600 }}>{row.tanggalStr}</td>
														<td style={{ color: "#475569" }}>{row.jamStr}</td>
														<td style={{ color: "#334155" }}>{row.topik}</td>
														<td style={{ textAlign: "center" }}>
															{row.status === "Terisi" ? (
																<span className={styles.badgeSolidBlue}>
																	<CheckCircle2 size={12} /> Terisi
																</span>
															) : (
																<span className={styles.badgeSolidRed}>
																	<AlertTriangle size={12} /> Jam Kosong
																</span>
															)}
														</td>
													</tr>
												))
											)}
										</tbody>
									</table>
								</div>

								<div className={styles.pagination}>
									<span style={{ color: "#64748b", fontSize: "0.875rem" }}>
										Menampilkan {processedRiwayat.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} -{" "}
										{Math.min(currentPage * itemsPerPage, processedRiwayat.length)} dari {processedRiwayat.length}{" "}
										pertemuan
									</span>
									<div className={styles.pageButtons}>
										<button
											className={styles.pageBtn}
											disabled={currentPage === 1}
											onClick={() => setCurrentPage((prev) => prev - 1)}
										>
											&lt;
										</button>
										<button
											className={styles.pageBtn}
											disabled={currentPage === totalPages || processedRiwayat.length === 0}
											onClick={() => setCurrentPage((prev) => prev + 1)}
										>
											&gt;
										</button>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
