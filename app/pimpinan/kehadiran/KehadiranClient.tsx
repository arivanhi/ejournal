"use client";

import { useState } from "react";
import {
	LayoutDashboard,
	Users,
	Clock,
	BookOpen,
	FileBarChart,
	Bell,
	Settings,
	LogOut,
	ArrowRight,
	ArrowLeft,
	Search,
	Download,
	UsersRound,
	BarChart3,
	CheckCircle2,
	AlertTriangle,
	AlertCircle,
	FileSpreadsheet,
	FileText,
	X,
	Check,
} from "lucide-react";
import styles from "./kehadiran.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";
import * as XLSX from "xlsx";

export default function KehadiranClient({ user, tahunAjaran, dataKelas }: any) {
	const [viewMode, setViewMode] = useState<"list" | "detail">("list");
	const [selectedKelas, setSelectedKelas] = useState<any>(null);
	const [activeTab, setActiveTab] = useState<"presensi" | "jadwal">("presensi");
	const [searchTermCard, setSearchTermCard] = useState("");
	const [searchSiswa, setSearchSiswa] = useState("");

	// PERBAIKAN: Pagination State untuk Card
	const [currentPage, setCurrentPage] = useState(1);
	const cardsPerPage = 6;

	const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
	const [toastMessage, setToastMessage] = useState<string | null>(null);

	const HARI_MAP = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

	const showToast = (message: string) => {
		setToastMessage(message);
		setTimeout(() => setToastMessage(null), 3000);
	};

	const handleLihatDetail = (kelas: any) => {
		setSelectedKelas(kelas);
		setActiveTab("presensi");
		setViewMode("detail");
		setSearchSiswa("");
	};

	// --- LOGIKA FILTER & PAGINASI CARD ---
	const filteredKelas = dataKelas.filter((k: any) => k.nama.toLowerCase().includes(searchTermCard.toLowerCase()));
	const totalPages = Math.max(1, Math.ceil(filteredKelas.length / cardsPerPage));
	const paginatedKelas = filteredKelas.slice((currentPage - 1) * cardsPerPage, currentPage * cardsPerPage);

	const filteredSiswa =
		selectedKelas?.siswaList?.filter(
			(s: any) =>
				s.nama.toLowerCase().includes(searchSiswa.toLowerCase()) ||
				s.nisn.toLowerCase().includes(searchSiswa.toLowerCase()),
		) || [];

	const exportToExcel = () => {
		const excelData = filteredSiswa.map((siswa: any, index: number) => ({
			NO: index + 1,
			"NAMA SISWA": siswa.nama,
			NISN: siswa.nisn || "-",
			HADIR: siswa.detailKehadiran.H,
			SAKIT: siswa.detailKehadiran.S,
			IZIN: siswa.detailKehadiran.I,
			ALPA: siswa.detailKehadiran.A,
			"TOTAL SESI": siswa.totalSesi,
			"% HADIR": `${siswa.persentase}%`,
			"STATUS HARI INI":
				siswa.statusHariIni === "H"
					? "Hadir"
					: siswa.statusHariIni === "S"
						? "Sakit"
						: siswa.statusHariIni === "I"
							? "Izin"
							: siswa.statusHariIni === "A"
								? "Alpa"
								: "Belum Ada",
		}));

		const ws = XLSX.utils.json_to_sheet(excelData);
		const colWidths = [
			{ wch: 5 },
			{ wch: 30 },
			{ wch: 15 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 10 },
			{ wch: 12 },
			{ wch: 10 },
			{ wch: 20 },
		];
		ws["!cols"] = colWidths;

		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, `Presensi ${selectedKelas.nama}`);
		XLSX.writeFile(wb, `Presensi_Kelas_${selectedKelas.nama.replace(/\s+/g, "_")}.xlsx`);

		setIsDownloadModalOpen(false);
		showToast("File Excel berhasil diunduh!");
	};

	const exportToPDF = () => {
		setIsDownloadModalOpen(false);
		setTimeout(() => {
			window.print();
			showToast("Jendela cetak PDF berhasil dibuka!");
		}, 300);
	};

	return (
		<div className={styles.layoutWrapper}>
			{toastMessage && (
				<div className={styles.toastContainer}>
					<div className={styles.toastIcon}>
						<Check size={16} />
					</div>
					<span className={styles.toastText}>{toastMessage}</span>
				</div>
			)}

			{isDownloadModalOpen && selectedKelas && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContainer}>
						<div className={styles.modalHeader}>
							<h3 className={styles.modalTitle}>Ekspor Data Presensi</h3>
							<button className={styles.modalCloseBtn} onClick={() => setIsDownloadModalOpen(false)}>
								<X size={20} />
							</button>
						</div>
						<div className={styles.modalBody}>
							<p style={{ fontSize: "0.875rem", color: "#374151", marginBottom: "1.5rem", textAlign: "center" }}>
								Pilih format dokumen untuk daftar presensi kelas <strong>{selectedKelas.nama}</strong>:
							</p>
							<div className={styles.exportOptions}>
								<div className={styles.btnExportCard} onClick={exportToExcel}>
									<FileSpreadsheet size={40} color="#16a34a" />
									<span className={styles.exportCardTitle}>Excel (.xlsx)</span>
								</div>
								<div className={styles.btnExportCard} onClick={exportToPDF}>
									<FileText size={40} color="#ef4444" />
									<span className={styles.exportCardTitle}>PDF (.pdf)</span>
								</div>
							</div>
							<p style={{ fontSize: "0.75rem", color: "#6b7280", textAlign: "center", marginTop: "1rem" }}>
								*Untuk format PDF, silakan pilih "Save as PDF" pada jendela Print yang muncul.
							</p>
						</div>
					</div>
				</div>
			)}

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
					<Link href="/pimpinan/kehadiran" className={`${styles.menuItem} ${styles.menuItemActive}`}>
						<Users size={18} /> Kehadiran Siswa
					</Link>
					<Link href="/pimpinan/monitoring" className={styles.menuItem}>
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
									<h2 className={styles.sectionTitle}>Kehadiran Siswa - Ringkasan Kelas</h2>
									<p className={styles.sectionDate}>
										{tahunAjaran ? `Tahun Ajaran ${tahunAjaran.nama}` : "Tahun Ajaran Aktif"}
									</p>
								</div>
								<div className={styles.headerButtons}>
									<div className={styles.searchBoxCard}>
										<Search size={16} className={styles.searchIcon} />
										<input
											type="text"
											placeholder="Cari Kelas..."
											className={styles.searchInput}
											value={searchTermCard}
											onChange={(e) => {
												setSearchTermCard(e.target.value);
												setCurrentPage(1); // Reset page ke 1 saat ngetik
											}}
										/>
									</div>
									<button className={styles.btnOutline}>Semua Tingkat</button>
								</div>
							</div>

							<div className={styles.gridCards}>
								{paginatedKelas.map((kelas: any) => (
									<div key={kelas.id} className={styles.classCard}>
										<div className={styles.cardTopRow}>
											<h3 className={styles.cardTitle}>{kelas.nama}</h3>
											{kelas.statusCard === "Terekap" && (
												<span className={styles.badgeSuccess}>
													<CheckCircle2 size={12} /> Terekap
												</span>
											)}
											{kelas.statusCard === "Proses" && (
												<span className={styles.badgeWarning}>
													<AlertCircle size={12} /> Proses
												</span>
											)}
											{kelas.statusCard === "Belum" && (
												<span className={styles.badgeDanger}>
													<AlertTriangle size={12} /> Belum
												</span>
											)}
											{kelas.statusCard === "Libur/Kosong" && (
												<span className={styles.badgeNeutral}>Tidak Ada Jadwal</span>
											)}
										</div>
										<p className={styles.waliText}>Wali: {kelas.waliKelas}</p>

										<div className={styles.progressSection}>
											<div className={styles.progressHeader}>
												<span>Kehadiran Hari Ini</span>
												<span style={{ fontWeight: 800, color: "#0f172a" }}>{kelas.kehadiranHariIni.persentase}%</span>
											</div>
											<div className={styles.progressTrack}>
												<div
													className={styles.progressBarYellow}
													style={{
														width: `${kelas.kehadiranHariIni.persentase}%`,
														backgroundColor: kelas.kehadiranHariIni.persentase >= 90 ? "#10b981" : "#f59e0b",
													}}
												></div>
											</div>
										</div>

										<div className={styles.statBoxes}>
											<div className={styles.statBox}>
												<span className={styles.statLabel}>Total</span>
												<span className={styles.statValDark}>{kelas.totalSiswa}</span>
											</div>
											<div className={styles.statBox}>
												<span className={styles.statLabel}>Hadir</span>
												<span className={styles.statValGreen}>{kelas.kehadiranHariIni.H}</span>
											</div>
											<div className={styles.statBox}>
												<span className={styles.statLabel}>Alfa</span>
												<span className={styles.statValRed}>{kelas.kehadiranHariIni.A}</span>
											</div>
											<div className={styles.statBox}>
												<span className={styles.statLabel}>I/S</span>
												<span className={styles.statValYellow}>{kelas.kehadiranHariIni.IS}</span>
											</div>
										</div>

										<button className={styles.btnPrimaryFull} onClick={() => handleLihatDetail(kelas)}>
											Lihat Detail <ArrowRight size={16} />
										</button>
									</div>
								))}
							</div>

							{/* PERBAIKAN: Pagination Card Container */}
							{totalPages > 1 && (
								<div className={styles.paginationCenter}>
									<div className={styles.pageButtons}>
										<button
											className={styles.pageBtn}
											disabled={currentPage === 1}
											onClick={() => setCurrentPage((p) => p - 1)}
										>
											&lt; Prev
										</button>
										<span className={styles.pageIndicator}>
											Halaman {currentPage} dari {totalPages}
										</span>
										<button
											className={styles.pageBtn}
											disabled={currentPage === totalPages}
											onClick={() => setCurrentPage((p) => p + 1)}
										>
											Next &gt;
										</button>
									</div>
								</div>
							)}
						</div>
					)}

					{viewMode === "detail" && selectedKelas && (
						<div>
							<button className={styles.btnBack} onClick={() => setViewMode("list")}>
								<ArrowLeft size={16} /> Kembali ke Ringkasan Kelas
							</button>

							<div className={styles.sectionHeader} style={{ marginTop: "1rem" }}>
								<div>
									<h2 className={styles.detailTitleBig}>Detail Kehadiran Kelas {selectedKelas.nama}</h2>
									<p className={styles.sectionDate}>
										Kelola daftar kehadiran dan jadwal pelajaran kelas secara detail.
									</p>
								</div>
							</div>

							<div className={styles.detailInfoGrid}>
								<div className={styles.infoCard}>
									{/* PERBAIKAN: Avatar Wali menggunakan Initials */}
									<div className={styles.infoAvatarInitials}>{selectedKelas.waliKelasInitials}</div>
									<div>
										<div className={styles.infoLabel}>Wali Kelas</div>
										<div className={styles.infoName}>{selectedKelas.waliKelas}</div>
										<div className={styles.infoSub}>NPP: {selectedKelas.waliKelasNpp}</div>
									</div>
								</div>
								<div className={styles.infoCardRow}>
									<div>
										<div className={styles.infoLabel}>Total Siswa</div>
										<div className={styles.infoValBox}>
											<span className={styles.infoValLarge}>{selectedKelas.totalSiswa}</span>
											<span className={styles.infoValUnit}>Siswa</span>
										</div>
									</div>
									<div className={styles.iconBoxGray}>
										<UsersRound size={24} color="#64748b" />
									</div>
								</div>
								<div className={styles.infoCardRow}>
									<div>
										<div className={styles.infoLabel}>Rata-rata Kehadiran</div>
										<div className={styles.infoValBox}>
											<span className={styles.infoValLargeYellow}>{selectedKelas.rataRataKelas}%</span>
											<span className={styles.infoValUnit}>Semester Ini</span>
										</div>
									</div>
									<div className={styles.iconBoxYellow}>
										<BarChart3 size={24} color="#ca8a04" />
									</div>
								</div>
							</div>

							<div className={styles.tabsWrapper}>
								<div className={styles.tabHeader}>
									<button
										className={`${styles.tabBtn} ${activeTab === "presensi" ? styles.tabActive : ""}`}
										onClick={() => setActiveTab("presensi")}
									>
										Daftar Presensi Siswa
									</button>
									<button
										className={`${styles.tabBtn} ${activeTab === "jadwal" ? styles.tabActive : ""}`}
										onClick={() => setActiveTab("jadwal")}
									>
										Jadwal & Guru
									</button>
								</div>

								<div className={styles.tabContent}>
									{activeTab === "presensi" && (
										<div>
											<div className={styles.tableToolbar}>
												<div className={styles.searchBoxCard} style={{ flex: 1, maxWidth: "400px" }}>
													<Search size={16} className={styles.searchIcon} />
													<input
														type="text"
														placeholder="Cari nama atau NISN..."
														className={styles.searchInput}
														value={searchSiswa}
														onChange={(e) => setSearchSiswa(e.target.value)}
													/>
												</div>
												<div style={{ display: "flex", gap: "1rem" }}>
													<button className={styles.btnOutline}>Semua Status</button>
													<button className={styles.btnPrimaryDark} onClick={() => setIsDownloadModalOpen(true)}>
														<Download size={16} /> Export
													</button>
												</div>
											</div>

											<div className={styles.tableWrapper}>
												<table className={styles.dataTable}>
													<thead>
														<tr>
															<th>NO</th>
															<th>NAMA SISWA</th>
															<th>NISN</th>
															{/* PERBAIKAN: Kolom Detail Presensi H/S/I/A */}
															<th
																colSpan={4}
																style={{
																	textAlign: "center",
																	borderLeft: "1px solid #f1f5f9",
																	borderRight: "1px solid #f1f5f9",
																}}
															>
																REKAP PRESENSI
															</th>
															<th style={{ textAlign: "center" }}>% HADIR</th>
															<th>STATUS HARI INI</th>
														</tr>
														<tr>
															<th></th>
															<th></th>
															<th></th>
															{/* Sub-header untuk H/S/I/A */}
															<th style={{ textAlign: "center", color: "#10b981" }}>H</th>
															<th style={{ textAlign: "center", color: "#d97706" }}>S</th>
															<th style={{ textAlign: "center", color: "#d97706" }}>I</th>
															<th style={{ textAlign: "center", color: "#ef4444", borderRight: "1px solid #f1f5f9" }}>
																A
															</th>
															<th></th>
															<th></th>
														</tr>
													</thead>
													<tbody>
														{filteredSiswa.length === 0 ? (
															<tr>
																<td colSpan={9} style={{ textAlign: "center", padding: "2rem", color: "#94a3b8" }}>
																	Tidak ada siswa yang cocok dengan pencarian.
																</td>
															</tr>
														) : (
															filteredSiswa.map((siswa: any, index: number) => {
																let statusBadge = <span className={styles.badgeNeutral}>Belum Ada</span>;
																if (siswa.statusHariIni === "H")
																	statusBadge = <span className={styles.badgeGreenLight}>Hadir</span>;
																if (siswa.statusHariIni === "S")
																	statusBadge = <span className={styles.badgeYellowLight}>Sakit</span>;
																if (siswa.statusHariIni === "I")
																	statusBadge = <span className={styles.badgeYellowLight}>Izin</span>;
																if (siswa.statusHariIni === "A")
																	statusBadge = <span className={styles.badgeRedLight}>Alpa</span>;

																return (
																	<tr key={siswa.id}>
																		<td>{index + 1}</td>
																		<td style={{ fontWeight: 600, color: "#0f172a" }}>{siswa.nama}</td>
																		<td style={{ color: "#64748b" }}>{siswa.nisn || "-"}</td>

																		{/* Data Detail Presensi */}
																		<td
																			style={{
																				textAlign: "center",
																				fontWeight: 700,
																				color: "#10b981",
																				backgroundColor: "#f8fafc",
																			}}
																		>
																			{siswa.detailKehadiran.H}
																		</td>
																		<td
																			style={{
																				textAlign: "center",
																				fontWeight: 700,
																				color: "#d97706",
																				backgroundColor: "#f8fafc",
																			}}
																		>
																			{siswa.detailKehadiran.S}
																		</td>
																		<td
																			style={{
																				textAlign: "center",
																				fontWeight: 700,
																				color: "#d97706",
																				backgroundColor: "#f8fafc",
																			}}
																		>
																			{siswa.detailKehadiran.I}
																		</td>
																		<td
																			style={{
																				textAlign: "center",
																				fontWeight: 700,
																				color: "#ef4444",
																				backgroundColor: "#f8fafc",
																				borderRight: "1px solid #f1f5f9",
																			}}
																		>
																			{siswa.detailKehadiran.A}
																		</td>

																		<td style={{ textAlign: "center", fontWeight: 600 }}>{siswa.persentase}%</td>
																		<td>{statusBadge}</td>
																	</tr>
																);
															})
														)}
													</tbody>
												</table>
											</div>
										</div>
									)}

									{activeTab === "jadwal" && (
										<div>
											<div className={styles.jadwalHeaderRow}>
												<h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
													Jadwal Pelajaran Mingguan
												</h3>
												<span className={styles.badgeGrayRounded}>Tahun Ajaran {tahunAjaran?.nama}</span>
											</div>

											<div className={styles.weeklyGrid}>
												{[1, 2, 3, 4, 5].map((hariIdx) => {
													const jadwalHariIni = selectedKelas.jadwalMingguan.filter((j: any) => j.hari === hariIdx);
													return (
														<div key={hariIdx} className={styles.dayColumn}>
															<div className={styles.dayHeader}>{HARI_MAP[hariIdx]}</div>
															<div className={styles.dayCards}>
																{jadwalHariIni.length === 0 ? (
																	<div className={styles.emptyJadwal}>Kosong</div>
																) : (
																	jadwalHariIni.map((jadwal: any) => (
																		<div key={jadwal.id} className={styles.scheduleCard}>
																			<div className={styles.scheduleTime}>Jam ke {jadwal.jamStr}</div>
																			<div className={styles.scheduleMapel}>{jadwal.mapel}</div>
																			<div className={styles.scheduleGuru}>
																				<div className={styles.guruInitialsSmall}>{jadwal.guruInitials}</div>
																				<span className={styles.guruNameText}>{jadwal.guruNama}</span>
																			</div>
																		</div>
																	))
																)}
															</div>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</div>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
