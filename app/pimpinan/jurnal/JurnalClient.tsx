"use client";

import { useState, useMemo, useEffect } from "react";
import {
	LayoutDashboard,
	Users,
	Clock,
	BookOpen,
	FileBarChart,
	Settings,
	LogOut,
	Search,
	ArrowLeft,
	Printer,
	UsersRound,
	CalendarCheck,
	CheckSquare,
	ChevronRight,
	Bell,
	User,
	TrendingUp,
	BarChart2,
	FileText,
} from "lucide-react";
import styles from "./jurnal.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function JurnalClient({ user, daftarTahunAjaran, riwayatData }: any) {
	const [viewMode, setViewMode] = useState<"list" | "detail">("list");
	const [selectedItem, setSelectedItem] = useState<any>(null);

	const [selectedTahun, setSelectedTahun] = useState<string>("");
	const [selectedSemester, setSelectedSemester] = useState<string>("");

	const [currentCardPage, setCurrentCardPage] = useState(1);
	const cardsPerPage = 6;

	const [searchTopik, setSearchTopik] = useState("");
	const [currentTablePage, setCurrentTablePage] = useState(1);
	const tableRowsPerPage = 5;

	const { tahunList, semesterList } = useMemo(() => {
		const tList = new Set<string>();
		const sList = new Set<string>();

		daftarTahunAjaran.forEach((ta: any) => {
			const parts = ta.nama.trim().split(" ");
			if (parts.length >= 2) {
				tList.add(parts[0]);
				sList.add(parts[1].toLowerCase() === "ganjil" ? "Ganjil" : "Genap");
			}
		});

		const arrTahun = Array.from(tList).sort().reverse();
		const arrSem = Array.from(sList);

		return { tahunList: arrTahun, semesterList: arrSem };
	}, [daftarTahunAjaran]);

	useEffect(() => {
		if (tahunList.length > 0 && !selectedTahun) setSelectedTahun(tahunList[0]);
		if (semesterList.length > 0 && !selectedSemester) setSelectedSemester("Ganjil");
	}, [tahunList, semesterList]);

	useEffect(() => {
		setCurrentCardPage(1);
	}, [selectedTahun, selectedSemester]);

	const handleLihatAnalisa = (item: any) => {
		setSelectedItem(item);
		setSearchTopik("");
		setCurrentTablePage(1);
		setViewMode("detail");
	};

	const filteredData = useMemo(() => {
		return riwayatData.filter((item: any) => {
			const targetFormat = `${selectedTahun} ${selectedSemester}`.toLowerCase();
			return item.tahunAjaranAsli.toLowerCase().includes(targetFormat);
		});
	}, [riwayatData, selectedTahun, selectedSemester]);

	const totalCardPages = Math.max(1, Math.ceil(filteredData.length / cardsPerPage));
	const paginatedCards = filteredData.slice((currentCardPage - 1) * cardsPerPage, currentCardPage * cardsPerPage);

	const filteredSesi = useMemo(() => {
		if (!selectedItem) return [];
		return selectedItem.detailSesi.filter((sesi: any) =>
			(sesi.topik || "").toLowerCase().includes(searchTopik.toLowerCase()),
		);
	}, [selectedItem, searchTopik]);

	const totalTablePages = Math.max(1, Math.ceil(filteredSesi.length / tableRowsPerPage));
	const paginatedSesi = filteredSesi.slice(
		(currentTablePage - 1) * tableRowsPerPage,
		currentTablePage * tableRowsPerPage,
	);

	return (
		<div className={styles.layoutWrapper}>
			{/* SIDEBAR */}
			<aside className={styles.sidebar}>
				<div className={styles.sidebarHeader}>
					<div className={styles.logoWrapper}>
						<img src="/logo.jpg" alt="Logo SMAN 2 Brebes" className={styles.logoImage} />
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
					<Link href="/pimpinan/monitoring" className={styles.menuItem}>
						<Clock size={18} /> Monitoring KBM
					</Link>
					<Link href="/pimpinan/jurnal" className={`${styles.menuItem} ${styles.menuItemActive}`}>
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

			{/* MAIN CONTENT */}
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
					{/* VIEW 1: FILTER & KARTU JURNAL */}
					{viewMode === "list" && (
						<div>
							<div className={styles.sectionHeader}>
								<div>
									<h2 className={styles.sectionTitle}>Riwayat Jurnal Mengajar</h2>
									<p className={styles.sectionDate}>Pilih periode akademik untuk melihat riwayat jurnal mengajar.</p>
								</div>
							</div>

							<div className={styles.filterBox}>
								<div className={styles.filterGroup}>
									<h4 className={styles.filterLabel}>Tahun Ajaran</h4>
									<div className={styles.pillContainer}>
										{tahunList.map((tahun) => (
											<button
												key={tahun}
												className={`${styles.pillBtn} ${selectedTahun === tahun ? styles.pillActive : ""}`}
												onClick={() => setSelectedTahun(tahun)}
											>
												{tahun}
											</button>
										))}
									</div>
								</div>
								<div className={styles.filterGroup}>
									<h4 className={styles.filterLabel}>Semester</h4>
									<div className={styles.pillContainer}>
										{["Ganjil", "Genap"].map((sem) => (
											<button
												key={sem}
												className={`${styles.pillBtn} ${selectedSemester === sem ? styles.pillActive : ""}`}
												onClick={() => setSelectedSemester(sem)}
											>
												{sem}
											</button>
										))}
									</div>
								</div>
							</div>

							<div className={styles.gridCards}>
								{paginatedCards.length === 0 ? (
									<div className={styles.emptyState}>Tidak ada data jurnal untuk periode ini.</div>
								) : (
									paginatedCards.map((item: any) => (
										<div key={item.id} className={styles.jurnalCard}>
											<div className={styles.cardTopRow}>
												<div>
													<h3 className={styles.cardMapel}>{item.mapelNama}</h3>
													<p className={styles.cardKelas}>{item.kelasNama}</p>
												</div>
												<div className={styles.badgeSesi}>
													{item.terisi}/{item.targetSesi} Sesi
												</div>
											</div>

											<div className={styles.guruProfileBox}>
												<div className={styles.guruAvatarInitials}>{item.guruInitials}</div>
												<div>
													<div className={styles.guruName}>{item.guruNama}</div>
													<div className={styles.guruRole}>Guru Pengampu</div>
												</div>
											</div>

											<button className={styles.btnOutlineFull} onClick={() => handleLihatAnalisa(item)}>
												Lihat Analisa
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

					{/* VIEW 2: DETAIL ANALISA JURNAL */}
					{viewMode === "detail" && selectedItem && (
						<div>
							<div className={styles.detailTopbar}>
								<button className={styles.btnBack} onClick={() => setViewMode("list")}>
									<ArrowLeft size={16} /> Detail Analisa
								</button>
								<button className={styles.btnPrint} onClick={() => window.print()}>
									<Printer size={20} />
								</button>
							</div>

							<div className={styles.heroCard}>
								<span className={styles.badgeSemester}>
									<BookOpen size={14} /> Semester {selectedSemester} {selectedTahun}
								</span>
								<h1 className={styles.heroTitle}>
									{selectedItem.mapelNama} - {selectedItem.kelasNama}
								</h1>
								{/* PERBAIKAN: Icon Monochromatic dari Lucide */}
								<div className={styles.heroSub}>
									<div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
										<User size={14} color="#64748b" /> {selectedItem.guruNama}
									</div>
									<span style={{ color: "#cbd5e1" }}>•</span>
									<div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
										<Clock size={14} color="#64748b" /> {selectedItem.jadwalText}
									</div>
								</div>
								<div className={styles.heroAvatarInitials}>{selectedItem.guruInitials}</div>
							</div>

							{/* PERBAIKAN: Icon Monochromatic dari Lucide */}
							<h3 className={styles.sectionSubtitle}>
								<TrendingUp size={20} color="#475569" /> Statistik Utama
							</h3>
							<div className={styles.statGrid}>
								<div className={styles.statCard}>
									<div className={styles.statCardHeader}>
										<div className={styles.iconBoxMono}>
											<UsersRound size={20} color="#475569" />
										</div>
										<span className={styles.badgeGreenSmall}>+2%</span>
									</div>
									<p className={styles.statLabel}>Persentase Kehadiran</p>
									<h2 className={styles.statValue}>{selectedItem.persentaseKehadiran}%</h2>
								</div>
								<div className={styles.statCard}>
									<div className={styles.statCardHeader}>
										<div className={styles.iconBoxMono}>
											<CalendarCheck size={20} color="#475569" />
										</div>
									</div>
									<p className={styles.statLabel}>Jumlah Sesi (Semester Ini)</p>
									<h2 className={styles.statValue}>
										{selectedItem.terisi} <span className={styles.statSub}>/ {selectedItem.targetSesi}</span>
									</h2>
								</div>
								<div className={styles.statCard}>
									<div className={styles.statCardHeader}>
										<div className={styles.iconBoxMono}>
											<CheckSquare size={20} color="#475569" />
										</div>
									</div>
									<p className={styles.statLabel}>Ketercapaian Materi</p>
									<h2 className={styles.statValue}>{selectedItem.ketercapaian}%</h2>
									<div className={styles.progressTrackBar}>
										<div className={styles.progressBarDark} style={{ width: `${selectedItem.ketercapaian}%` }}></div>
									</div>
								</div>
							</div>

							<div className={styles.bottomGrid}>
								<div className={styles.chartCard}>
									{/* PERBAIKAN: Icon Monochromatic dari Lucide */}
									<h3 className={styles.chartTitle}>
										<BarChart2 size={18} color="#475569" /> Tren Kehadiran Siswa
									</h3>
									<div className={styles.barChartArea}>
										{[1, 2, 3, 4, 5].map((val, idx) => (
											<div key={idx} className={styles.barColumn}>
												<div className={styles.barWrapper}>
													<div
														className={idx === 1 ? styles.barFillDark : styles.barFillLight}
														style={{ height: `${50 + Math.random() * 50}%` }}
													></div>
												</div>
												<span className={styles.barLabel}>M{val}</span>
											</div>
										))}
									</div>
								</div>

								<div className={styles.tableCard}>
									<div className={styles.tableHeader}>
										{/* PERBAIKAN: Icon Monochromatic dari Lucide */}
										<h3 className={styles.chartTitle}>
											<FileText size={18} color="#475569" /> Detail Sesi & Presensi
										</h3>
										<div className={styles.searchBoxTable}>
											<Search size={14} className={styles.searchIconTable} />
											<input
												type="text"
												placeholder="Cari Topik..."
												className={styles.searchInputTable}
												value={searchTopik}
												onChange={(e) => {
													setSearchTopik(e.target.value);
													setCurrentTablePage(1);
												}}
											/>
										</div>
									</div>

									<div className={styles.tableWrapper}>
										<table className={styles.dataTable}>
											<thead>
												<tr>
													<th>Pert.</th>
													<th>Tanggal</th>
													<th>Materi / Topik</th>
													<th style={{ textAlign: "center" }}>Hadir</th>
													<th style={{ textAlign: "center" }}>Status</th>
												</tr>
											</thead>
											<tbody>
												{paginatedSesi.length === 0 ? (
													<tr>
														<td colSpan={5} className={styles.emptyTable}>
															Tidak ada topik yang cocok dengan pencarian.
														</td>
													</tr>
												) : (
													paginatedSesi.map((sesi: any) => (
														<tr key={sesi.id}>
															<td className={styles.tdBold}>{sesi.pertemuanKeDesc}</td>
															<td className={styles.tdGray}>{sesi.tanggal}</td>
															<td>
																<div className={styles.topikTitle}>{sesi.topik}</div>
															</td>
															<td className={styles.tdBoldCenter}>
																{sesi.hadir} <span className={styles.tdGray}>/{selectedItem.totalSiswa}</span>
															</td>
															<td style={{ textAlign: "center" }}>
																<span
																	className={
																		sesi.status === "Lengkap" || sesi.status === "Terisi"
																			? styles.badgeSuccess
																			: styles.badgeWarning
																	}
																>
																	{sesi.status === "Lengkap" || sesi.status === "Terisi" ? "TERKIRIM" : "DRAFT"}
																</span>
																<ChevronRight
																	size={16}
																	color="#94a3b8"
																	style={{ marginLeft: "0.5rem", verticalAlign: "middle" }}
																/>
															</td>
														</tr>
													))
												)}
											</tbody>
										</table>
									</div>

									<div className={styles.paginationTable}>
										<span className={styles.pageIndicatorInfo}>
											Menampilkan {filteredSesi.length === 0 ? 0 : (currentTablePage - 1) * tableRowsPerPage + 1} -{" "}
											{Math.min(currentTablePage * tableRowsPerPage, filteredSesi.length)} dari {filteredSesi.length}
										</span>
										<div className={styles.pageButtonsMini}>
											<button
												className={styles.pageBtnMini}
												disabled={currentTablePage === 1}
												onClick={() => setCurrentTablePage((p) => p - 1)}
											>
												&lt;
											</button>
											<button
												className={styles.pageBtnMini}
												disabled={currentTablePage === totalTablePages || filteredSesi.length === 0}
												onClick={() => setCurrentTablePage((p) => p + 1)}
											>
												&gt;
											</button>
										</div>
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
