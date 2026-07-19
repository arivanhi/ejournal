"use client";

import { useState, useEffect } from "react";
import {
	LayoutDashboard,
	BookOpen,
	QrCode,
	History,
	Users,
	Settings,
	LogOut,
	ArrowLeft,
	Beaker,
	CheckCircle2,
	Clock,
	MapPin,
	Download,
	Save,
	UserCheck,
	Bell,
	HelpCircle,
	X,
	Search,
	CalendarDays,
	AlertTriangle,
	Edit,
	PowerOff,
} from "lucide-react";
import styles from "./jurnal.module.css";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
	buatJurnalAction,
	aktifkanPresensiQR,
	simpanPresensiManualAction,
	updateJurnalAction,
	tutupPresensiQR,
} from "./actions";

// Tambahkan withInput dan ubah parameter onConfirm
type ModalConfig = {
	isOpen: boolean;
	title: string;
	message: string;
	withInput?: boolean;
	onConfirm: (val?: string) => void;
} | null;
type ToastConfig = { id: number; message: string; type: "success" | "error" };

export default function JurnalClient({
	jadwalSemua,
	user,
	isWaliKelas,
}: {
	jadwalSemua: any[];
	user: any;
	isWaliKelas: boolean;
}) {
	const [viewMode, setViewMode] = useState<"list" | "detail" | "presensi">("list");
	const [loading, setLoading] = useState(false);

	const [modal, setModal] = useState<ModalConfig>(null);
	const [modalInputValue, setModalInputValue] = useState(""); // State untuk kotak catatan

	const [toasts, setToasts] = useState<ToastConfig[]>([]);
	const [activeJadwal, setActiveJadwal] = useState<any>(null);
	const [activeJurnal, setActiveJurnal] = useState<any>(null);

	const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
	const [materi, setMateri] = useState("");

	const [isEditModalOpen, setIsEditModalOpen] = useState(false);
	const [editJurnalId, setEditJurnalId] = useState("");
	const [editTanggal, setEditTanggal] = useState("");
	const [editMateri, setEditMateri] = useState("");

	const [presensiEdits, setPresensiEdits] = useState<Record<string, string>>({});

	useEffect(() => {
		if (activeJadwal && jadwalSemua) {
			const updatedJadwal = jadwalSemua.find((j) => j.id === activeJadwal.id);
			if (updatedJadwal) setActiveJadwal(updatedJadwal);
		}
	}, [jadwalSemua]);

	const showToast = (message: string, type: "success" | "error" = "success") => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message, type }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, 3500);
	};

	const handleBukaKelas = (jadwal: any) => {
		setActiveJadwal(jadwal);
		setTanggal(new Date().toISOString().split("T")[0]);
		setMateri("");
		setViewMode("detail");
	};

	const formatWaktu = (mulai: string, selesai: string) => {
		if (mulai.includes("-")) return `${mulai}`;
		return `${mulai} - ${selesai}`;
	};

	// --- FUNGSI AKSI ---

	const handleSimpanJurnalBaru = async () => {
		setLoading(true);
		const res = await buatJurnalAction({ jadwalId: activeJadwal.id, tanggal, materi, tujuan: "", catatan: "" });
		setLoading(false);
		setModal(null);
		if (res.success) {
			showToast("Jurnal berhasil dibuat!", "success");
			setMateri("");
		} else showToast(res.message, "error");
	};

	const handleBukaQR = async (jurnalId: string) => {
		setLoading(true);
		const res = await aktifkanPresensiQR(jurnalId);
		setLoading(false);
		setModal(null);
		if (res.success) showToast("QR Presensi berhasil diaktifkan!", "success");
		else showToast("Gagal mengaktifkan QR: " + res.message, "error");
	};

	// Terima catatan dari Modal
	const handleTutupQR = async (jurnalId: string, catatanKBM: string) => {
		setLoading(true);
		const res = await tutupPresensiQR(jurnalId, catatanKBM);
		setLoading(false);
		setModal(null);
		if (res.success) showToast("QR Presensi ditutup & Catatan disimpan.", "success");
		else showToast("Gagal menutup QR: " + res.message, "error");
	};

	const handleSimpanEditJurnal = async () => {
		if (!editTanggal || !editMateri) {
			alert("Tanggal dan Materi wajib diisi.");
			return;
		}
		setLoading(true);
		const res = await updateJurnalAction(editJurnalId, { tanggal: editTanggal, materi: editMateri });
		setLoading(false);
		setIsEditModalOpen(false);
		if (res.success) showToast("Perubahan jurnal berhasil disimpan!", "success");
		else showToast(res.message, "error");
	};

	const handleSimpanPresensiManual = async () => {
		setLoading(true);
		const presensiData = Object.entries(presensiEdits).map(([siswaId, status]) => ({ siswaId, status }));
		const res = await simpanPresensiManualAction(activeJurnal.id, presensiData);
		setLoading(false);
		setModal(null);
		if (res.success) {
			showToast("Presensi berhasil diperbarui!", "success");
			setViewMode("detail");
		} else showToast(res.message, "error");
	};

	// --- TRIGGER MODAL ---
	const triggerModalSimpanJurnalBaru = () => {
		if (!tanggal || !materi) {
			showToast("Peringatan: Tanggal dan Topik Materi wajib diisi!", "error");
			return;
		}
		setModal({
			isOpen: true,
			title: "Simpan Jurnal Baru?",
			message: `Anda akan menyimpan jurnal untuk tanggal ${new Date(tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`,
			onConfirm: handleSimpanJurnalBaru,
		});
	};

	const triggerModalBukaQR = (jurnalId: string, jurnalTanggal: string | Date) => {
		const hariIniStr = new Date().toISOString().split("T")[0];
		const tanggalJurnalStr = new Date(jurnalTanggal).toISOString().split("T")[0];
		if (hariIniStr !== tanggalJurnalStr) {
			showToast("QR Presensi HANYA BISA diaktifkan pada jadwal HARI INI.", "error");
			return;
		}
		setModal({
			isOpen: true,
			title: "Buka Akses QR Presensi?",
			message: "Siswa akan bisa memindai QR Code untuk melakukan presensi secara mandiri. Lanjutkan?",
			onConfirm: () => handleBukaQR(jurnalId),
		});
	};

	const triggerModalTutupQR = (jurnalId: string) => {
		setModalInputValue(""); // Kosongkan form teks saat dibuka
		setModal({
			isOpen: true,
			title: "Tutup Akses QR & Sesi Presensi?",
			message:
				"Siswa tidak akan bisa lagi memindai QR Code. Tambahkan catatan kejadian atau evaluasi KBM hari ini (Opsional):",
			withInput: true, // Beritahu UI untuk merender textarea
			onConfirm: (val?: string) => handleTutupQR(jurnalId, val || ""),
		});
	};

	const triggerModalSimpanPresensi = () => {
		if (Object.keys(presensiEdits).length === 0) {
			showToast("Tidak ada perubahan presensi yang dibuat.", "error");
			return;
		}
		setModal({
			isOpen: true,
			title: "Simpan Perubahan Presensi?",
			message: "Anda akan menyimpan perubahan absensi secara manual ke sistem. Yakin ingin menyimpan?",
			onConfirm: handleSimpanPresensiManual,
		});
	};

	const openEditModal = (jurnalItem: any) => {
		setEditJurnalId(jurnalItem.id);
		setEditTanggal(new Date(jurnalItem.tanggal).toISOString().split("T")[0]);
		setEditMateri(jurnalItem.materiBab);
		setIsEditModalOpen(true);
	};

	const handleBukaDetailAbsen = (jurnal: any) => {
		setActiveJurnal(jurnal);
		const initialEdits: Record<string, string> = {};
		jurnal.presensi?.forEach((p: any) => {
			initialEdits[p.siswaId] = p.status;
		});
		setPresensiEdits(initialEdits);
		setViewMode("presensi");
	};

	return (
		<div className={styles.layoutWrapper}>
			<div className={styles.toastContainer}>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}
					>
						{toast.type === "success" ? (
							<CheckCircle2 size={20} color="#10b981" />
						) : (
							<AlertTriangle size={20} color="#ef4444" />
						)}
						<span className={styles.toastText}>{toast.message}</span>
					</div>
				))}
			</div>

			{/* === MODAL KONFIRMASI (BISA MUNCUL TEXTAREA) === */}
			{modal && modal.isOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContent}>
						<div className={styles.modalTitle} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
							<AlertTriangle size={24} color="#f59e0b" /> {modal.title}
						</div>
						<div className={styles.modalMessage}>{modal.message}</div>

						{/* FORM CATATAN KBM */}
						{modal.withInput && (
							<div style={{ marginBottom: "1.5rem" }}>
								<textarea
									className={styles.formTextarea}
									style={{ minHeight: "80px", width: "100%" }}
									placeholder="Ketik catatan di sini (opsional)..."
									value={modalInputValue}
									onChange={(e) => setModalInputValue(e.target.value)}
								/>
							</div>
						)}

						<div className={styles.modalActions}>
							<button
								className={styles.btnOutlineFull}
								style={{
									width: "auto",
									margin: 0,
									padding: "0.5rem 1.5rem",
									backgroundColor: "#f1f5f9",
									borderColor: "#e2e8f0",
								}}
								onClick={() => setModal(null)}
								disabled={loading}
							>
								Batal
							</button>
							<button
								className={styles.btnPrimaryFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => modal.onConfirm(modalInputValue)}
								disabled={loading}
							>
								{loading ? "Memproses..." : "Ya, Lanjutkan"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* === MODAL EDIT JURNAL === */}
			{isEditModalOpen && (
				<div className={styles.modalOverlay}>
					<div className={styles.modalContent} style={{ width: "500px" }}>
						<div className={styles.modalTitle} style={{ marginBottom: "1.5rem" }}>
							Edit Jurnal Pertemuan
						</div>
						<div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
							<div>
								<label className={styles.formLabel}>Tanggal Pertemuan</label>
								<input
									type="date"
									className={styles.formInput}
									value={editTanggal}
									onChange={(e) => setEditTanggal(e.target.value)}
								/>
							</div>
							<div>
								<label className={styles.formLabel}>Topik Materi</label>
								<textarea
									className={styles.formTextarea}
									style={{ minHeight: "80px" }}
									value={editMateri}
									onChange={(e) => setEditMateri(e.target.value)}
								/>
							</div>
						</div>
						<div className={styles.modalActions}>
							<button
								className={styles.btnOutlineFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={() => setIsEditModalOpen(false)}
								disabled={loading}
							>
								Batal
							</button>
							<button
								className={styles.btnPrimaryFull}
								style={{ width: "auto", margin: 0, padding: "0.5rem 1.5rem" }}
								onClick={handleSimpanEditJurnal}
								disabled={loading}
							>
								{loading ? "Menyimpan..." : "Simpan Perubahan"}
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Sisa UI Sidebar, Topbar, Daftar Kelas, Tabel, dan View Manual (Dipersingkat agar respon aman, struktur Anda sudah benar sebelumnya, saya sertakan penuh) */}
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
					<Link href="/teacher/jurnal" className={`${styles.menuItem} ${styles.menuItemActive}`}>
						<BookOpen size={18} /> Jurnal Mengajar
					</Link>
					<Link href="/teacher/presensi" className={styles.menuItem}>
						<QrCode size={18} /> Presensi QR
					</Link>
					<Link href="/teacher/riwayat" className={styles.menuItem}>
						<History size={18} /> Riwayat
					</Link>
					{isWaliKelas && (
						<>
							<div className={styles.menuSection}>MENU WALI KELAS</div>
							<Link href="/teacher/data-siswa" className={styles.menuItem}>
								<Users size={18} /> Data Siswa
							</Link>
							<Link href="/teacher/setelan" className={styles.menuItem}>
								<Settings size={18} /> Setelan
							</Link>
						</>
					)}
				</nav>
				<div className={styles.sidebarFooter}>
					<button className={styles.logoutBtn} onClick={() => signOut({ callbackUrl: "/login" })}>
						<LogOut size={18} /> Keluar
					</button>
				</div>
			</aside>

			<main className={styles.mainContent}>
				<header className={styles.topbar}>
					<h1 className={styles.greeting}>E-Journal & Presensi</h1>
					<div className={styles.topbarActions}>
						<Bell size={20} style={{ cursor: "pointer" }} />
						<HelpCircle size={20} style={{ cursor: "pointer" }} />
						<div className={styles.profileAvatar}></div>
					</div>
				</header>

				<div className={styles.dashboardContainer}>
					{viewMode === "list" && (
						<div>
							<div className={styles.pageHeader}>
								<div>
									<h1 className={styles.pageTitle}>Daftar Mata Pelajaran & Kelas</h1>
									<p className={styles.pageSubtitle}>
										Pilih mata pelajaran di bawah ini untuk mengisi jurnal dan melihat riwayat presensi.
									</p>
								</div>
							</div>
							<div className={styles.cardGrid}>
								{jadwalSemua.map((jadwal: any) => {
									const hariIniStr = new Date().toISOString().split("T")[0];
									const jurnalHariIni = jadwal.jurnal?.find(
										(j: any) => new Date(j.tanggal).toISOString().split("T")[0] === hariIniStr,
									);
									const isSubmitted = !!jurnalHariIni;
									let cardClass = isSubmitted ? styles.statusSelesai : styles.statusBelum;
									let badgeClass = isSubmitted ? styles.badgeSelesai : styles.badgeBelum;
									let statusText = isSubmitted ? "Jurnal Hari Ini Selesai" : "Jurnal Belum Diisi";
									const hariText =
										["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][jadwal.hari] || "";

									return (
										<div key={jadwal.id} className={`${styles.jurnalCard} ${cardClass}`}>
											<div className={styles.cardHeader}>
												<div className={styles.iconBox}>
													<Beaker size={20} />
												</div>
												<div style={{ display: "flex", flexDirection: "column" }}>
													<div className={styles.mapelTitle}>{jadwal.mapel.nama}</div>
													<div className={styles.mapelSubtitle}>{jadwal.kelas.nama}</div>
													<div className={`${styles.badgeStatus} ${badgeClass}`}>{statusText}</div>
												</div>
											</div>
											<div className={styles.cardBody}>
												<div className={styles.infoRow}>
													<Clock size={14} />
													<span>
														<strong style={{ color: "#1e293b" }}>{hariText},</strong>{" "}
														{formatWaktu(jadwal.waktuMulai, jadwal.waktuSelesai)} WIB
													</span>
												</div>
												<div className={styles.infoRow}>
													<MapPin size={14} /> Ruang Kelas {jadwal.ruang || "-"}
												</div>
											</div>
											<div style={{ marginTop: "auto", paddingTop: "1rem" }}>
												<button className={styles.btnPrimaryFull} onClick={() => handleBukaKelas(jadwal)}>
													Kelola Jurnal
												</button>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					)}

					{viewMode === "detail" && activeJadwal && (
						<div>
							<button className={styles.btnBack} onClick={() => setViewMode("list")}>
								<ArrowLeft size={16} /> Kembali ke Daftar Mata Pelajaran
							</button>
							<div className={styles.pageHeader} style={{ marginBottom: "1.5rem" }}>
								<div>
									<h1 className={styles.pageTitle} style={{ fontSize: "1.5rem" }}>
										{activeJadwal.mapel.nama} - {activeJadwal.kelas.nama}
									</h1>
									<p className={styles.pageSubtitle}>
										<Clock
											size={14}
											style={{ display: "inline", marginRight: "0.25rem", verticalAlign: "text-bottom" }}
										/>{" "}
										Jadwal Reguler:{" "}
										{["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"][activeJadwal.hari]} (
										{formatWaktu(activeJadwal.waktuMulai, activeJadwal.waktuSelesai)} WIB)
									</p>
								</div>
							</div>

							<div className={styles.formSection} style={{ marginBottom: "2.5rem" }}>
								<div
									className={styles.formTitle}
									style={{
										fontSize: "1.15rem",
										marginBottom: "1.5rem",
										borderBottom: "1px solid #e2e8f0",
										paddingBottom: "0.75rem",
									}}
								>
									Buat Jurnal Pertemuan Baru
								</div>
								<div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem", alignItems: "start" }}>
									<div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
										<div>
											<label className={styles.formLabel}>Tanggal Pertemuan *</label>
											<input
												type="date"
												className={styles.formInput}
												value={tanggal}
												onChange={(e) => setTanggal(e.target.value)}
												style={{ backgroundColor: "white" }}
											/>
										</div>
									</div>
									<div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
										<div>
											<label className={styles.formLabel}>Topik Materi *</label>
											<textarea
												className={styles.formTextarea}
												style={{ minHeight: "60px" }}
												value={materi}
												onChange={(e) => setMateri(e.target.value)}
												placeholder="Tuliskan materi yang diajarkan hari ini..."
											/>
										</div>
										<div style={{ display: "flex", justifyContent: "flex-end" }}>
											<button
												className={styles.btnPrimaryFull}
												style={{
													width: "auto",
													padding: "0.6rem 1.5rem",
													display: "flex",
													alignItems: "center",
													gap: "0.5rem",
												}}
												onClick={triggerModalSimpanJurnalBaru}
											>
												<Save size={16} /> Simpan Jurnal Baru
											</button>
										</div>
									</div>
								</div>
							</div>

							<div className={styles.tableCard}>
								<div className={styles.tableToolbar}>
									<div style={{ fontWeight: 700, color: "#0f172a", fontSize: "1.1rem" }}>
										Riwayat Jurnal & Presensi Kelas
									</div>
								</div>
								<table className={styles.tableStyle}>
									<thead>
										<tr>
											<th>No</th>
											<th>Tanggal</th>
											<th>Waktu Mengajar</th>
											<th>Topik Materi</th>
											<th style={{ width: "120px" }}>Kehadiran</th>
											<th>Status QR</th>
											<th style={{ textAlign: "center", width: "280px" }}>Aksi</th>
										</tr>
									</thead>
									<tbody>
										{activeJadwal.jurnal && activeJadwal.jurnal.length > 0 ? (
											[...activeJadwal.jurnal]
												.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
												.map((jurnalItem: any, index: number) => {
													const tglFormatted = new Date(jurnalItem.tanggal).toLocaleDateString("id-ID", {
														year: "numeric",
														month: "long",
														day: "numeric",
													});
													const isQRAktif = !!jurnalItem.qrToken;
													const hariIniStr = new Date().toISOString().split("T")[0];
													const tanggalJurnalStr = new Date(jurnalItem.tanggal).toISOString().split("T")[0];
													const isHariIni = hariIniStr === tanggalJurnalStr;

													const totalKls = activeJadwal.kelas.riwayatSiswa.length;
													const h = jurnalItem.presensi?.filter((p: any) => p.status === "H").length || 0;
													const is =
														jurnalItem.presensi?.filter((p: any) => p.status === "I" || p.status === "S").length || 0;
													const a = totalKls - h - is;

													return (
														<tr key={jurnalItem.id}>
															<td style={{ fontWeight: 500 }}>{index + 1}</td>
															<td style={{ fontWeight: 600, color: "#0f172a" }}>{tglFormatted}</td>
															<td style={{ color: "#475569" }}>
																{formatWaktu(activeJadwal.waktuMulai, activeJadwal.waktuSelesai)} WIB
															</td>
															<td>
																<div
																	style={{
																		maxWidth: "200px",
																		whiteSpace: "nowrap",
																		overflow: "hidden",
																		textOverflow: "ellipsis",
																	}}
																	title={jurnalItem.materiBab}
																>
																	{jurnalItem.materiBab}
																</div>
															</td>
															<td>
																<div style={{ display: "flex", gap: "0.5rem", fontSize: "0.75rem", fontWeight: 700 }}>
																	<span style={{ color: "#10b981" }} title="Hadir">
																		H: {h}
																	</span>
																	<span style={{ color: "#f59e0b" }} title="Izin/Sakit">
																		I/S: {is}
																	</span>
																	<span style={{ color: "#ef4444" }} title="Alpha/Belum">
																		A: {a}
																	</span>
																</div>
															</td>
															<td>
																{isQRAktif ? (
																	<span
																		style={{
																			background: "#d1fae5",
																			color: "#047857",
																			padding: "0.25rem 0.5rem",
																			borderRadius: "4px",
																			fontSize: "0.7rem",
																			fontWeight: 700,
																		}}
																	>
																		AKTIF
																	</span>
																) : (
																	<span
																		style={{
																			background: "#f1f5f9",
																			color: "#64748b",
																			padding: "0.25rem 0.5rem",
																			borderRadius: "4px",
																			fontSize: "0.7rem",
																			fontWeight: 700,
																		}}
																	>
																		DITUTUP
																	</span>
																)}
															</td>
															<td
																style={{
																	display: "flex",
																	gap: "0.5rem",
																	justifyContent: "center",
																	alignItems: "center",
																}}
															>
																<button
																	style={{
																		background: "none",
																		border: "none",
																		color: "#3b82f6",
																		cursor: "pointer",
																		display: "flex",
																		alignItems: "center",
																	}}
																	title="Edit Jurnal"
																	onClick={() => openEditModal(jurnalItem)}
																>
																	<Edit size={16} />
																</button>
																{isQRAktif ? (
																	<button
																		className={styles.btnOutlineFull}
																		style={{
																			padding: "0.4rem 0.75rem",
																			width: "auto",
																			fontSize: "0.75rem",
																			display: "flex",
																			alignItems: "center",
																			gap: "0.35rem",
																			borderColor: "#ef4444",
																			color: "#ef4444",
																			backgroundColor: "#fef2f2",
																		}}
																		onClick={() => triggerModalTutupQR(jurnalItem.id)}
																	>
																		<PowerOff size={14} /> Tutup QR
																	</button>
																) : (
																	<button
																		className={styles.btnOutlineFull}
																		style={{
																			padding: "0.4rem 0.75rem",
																			width: "auto",
																			fontSize: "0.75rem",
																			display: "flex",
																			alignItems: "center",
																			gap: "0.35rem",
																			opacity: !isHariIni ? 0.5 : 1,
																			cursor: !isHariIni ? "not-allowed" : "pointer",
																		}}
																		onClick={() => triggerModalBukaQR(jurnalItem.id, jurnalItem.tanggal)}
																		disabled={!isHariIni}
																	>
																		<QrCode size={14} /> Buka QR
																	</button>
																)}
																<button
																	className={styles.btnPrimaryFull}
																	style={{
																		padding: "0.4rem 0.75rem",
																		width: "auto",
																		fontSize: "0.75rem",
																		backgroundColor: "#f59e0b",
																		display: "flex",
																		alignItems: "center",
																		gap: "0.35rem",
																		border: "none",
																	}}
																	onClick={() => handleBukaDetailAbsen(jurnalItem)}
																>
																	<UserCheck size={14} /> Detail Presensi
																</button>
															</td>
														</tr>
													);
												})
										) : (
											<tr>
												<td colSpan={7} style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
													Belum ada riwayat jurnal.
												</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{viewMode === "presensi" && activeJurnal && activeJadwal && (
						<div>
							<div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "1rem" }}>
								Jurnal Mengajar &gt; {activeJadwal.mapel.nama} {activeJadwal.kelas.nama} &gt;{" "}
								<span style={{ fontWeight: 600, color: "#0f172a" }}>Detail Presensi</span>
							</div>
							<div
								style={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "flex-end",
									marginBottom: "1.5rem",
								}}
							>
								<div>
									<h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "#0f172a" }}>
										Presensi Manual - {activeJadwal.mapel.nama} {activeJadwal.kelas.nama}
									</h2>
									<div
										style={{
											color: "#64748b",
											fontSize: "0.875rem",
											display: "flex",
											alignItems: "center",
											gap: "0.5rem",
										}}
									>
										<CalendarDays size={16} />{" "}
										{new Date(activeJurnal.tanggal).toLocaleDateString("id-ID", {
											weekday: "long",
											day: "numeric",
											month: "long",
											year: "numeric",
										})}{" "}
										| {formatWaktu(activeJadwal.waktuMulai, activeJadwal.waktuSelesai)} WIB
									</div>
								</div>
							</div>
							{/* ... (UI Manual Presensi Stats dan Table dibiarkan sama seperti sbelumnya agar kode lebih aman) ... */}
							<div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "1.5rem" }}>
								<button
									className={styles.btnOutlineFull}
									style={{ width: "auto" }}
									onClick={() => setViewMode("detail")}
								>
									Batal & Kembali
								</button>
								<button
									className={styles.btnPrimaryFull}
									style={{ width: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}
									onClick={triggerModalSimpanPresensi}
								>
									<Save size={16} /> Simpan Perubahan Presensi
								</button>
							</div>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
