// app/admin/mapel/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, History, Plus, ArrowRight, ChevronRight, FileText, Info, Clock } from "lucide-react";
import styles from "./periode.module.css";

export const dynamic = "force-dynamic";

export default async function PemilihanPeriodeMapel() {
	// Ambil semua daftar tahun ajaran dari database
	const semuaTahunAjaran = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" },
	});

	const tahunAktif = semuaTahunAjaran.find((t) => t.isActive);
	const arsipTahun = semuaTahunAjaran.filter((t) => !t.isActive);

	return (
		<div className={styles.pageContainer}>
			<div>
				<h1 className={styles.pageTitle}>Manajemen Mapel</h1>
				<p className={styles.pageSubtitle}>Pilih periode akademik untuk mengelola pemetaan guru dan mata pelajaran.</p>
			</div>

			<div className={styles.cardsGrid}>
				{/* KARTU 1: PERIODE AKTIF BERJALAN */}
				{tahunAktif ? (
					<div className={`${styles.card} ${styles.cardActive}`}>
						<div className={styles.ribbon}>AKTIF</div>

						<div className={styles.cardHeader}>
							<div className={styles.iconBox}>
								<Calendar size={24} />
							</div>
							<div>
								<div className={styles.periodLabel}>Periode Berjalan</div>
								<div className={styles.periodTitle}>{tahunAktif.nama}</div>
							</div>
						</div>

						<div>
							{/* Tombol mengarah ke rute dinamis [id] */}
							<Link href={`/admin/mapel/${tahunAktif.id}`} className={styles.btnPrimaryAction}>
								<div style={{ display: "flex", flexDirection: "column" }}>
									<span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 500 }}>Kelola Pemetaan</span>
									<span>Buka Dashboard Mapel</span>
								</div>
								<ArrowRight size={18} />
							</Link>
						</div>

						<div className={styles.cardFooter}>
							<Clock size={12} /> Status: Aktif digunakan sistem
						</div>
					</div>
				) : (
					<div
						className={styles.card}
						style={{ justifyContent: "center", alignItems: "center", textAlign: "center", padding: "2rem" }}
					>
						<p style={{ color: "#6b7280", fontSize: "0.875rem", marginBottom: "1rem" }}>
							Belum ada Tahun Ajaran yang diatur aktif.
						</p>
						<Link href="/admin/master" className={styles.btnBanner} style={{ textDecoration: "none" }}>
							Atur di Data Master
						</Link>
					</div>
				)}

				{/* KARTU 2: ARSIP PERIODE LAINNYA */}
				<div className={styles.card}>
					<div className={styles.cardHeader}>
						<div className={`${styles.iconBox} ${styles.iconBoxArchive}`}>
							<History size={24} />
						</div>
						<div>
							<div className={styles.periodLabel}>Arsip Periode Lain</div>
							<div className={styles.periodTitle}>Riwayat Tahun Ajaran</div>
						</div>
					</div>

					<div
						style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "150px", overflowY: "auto" }}
					>
						{arsipTahun.length === 0 ? (
							<span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Tidak ada arsip periode lain.</span>
						) : (
							arsipTahun.map((arsip) => (
								<Link
									key={arsip.id}
									href={`/admin/mapel/${arsip.id}`}
									className={styles.btnSecondaryAction}
									style={{ padding: "0.75rem 1rem" }}
								>
									<span>{arsip.nama}</span>
									<ChevronRight size={16} color="#9ca3af" />
								</Link>
							))
						)}
					</div>
				</div>

				{/* KARTU 3: TAMBAH PERIODE (MENUJU DATA MASTER) */}
				<Link href="/admin/master" style={{ textDecoration: "none" }}>
					<div className={`${styles.card} ${styles.cardDashed}`} style={{ height: "100%" }}>
						<div
							style={{
								backgroundColor: "#eff6ff",
								color: "#1e3a8a",
								padding: "1rem",
								borderRadius: "50%",
								marginBottom: "1rem",
							}}
						>
							<Plus size={32} />
						</div>
						<h3 style={{ fontSize: "1.125rem", color: "#111827", fontWeight: 700, marginBottom: "0.5rem" }}>
							Tambah Tahun Ajaran
						</h3>
						<p style={{ fontSize: "0.875rem", color: "#6b7280", padding: "0 1rem" }}>
							Buka periode akademik baru melalui menu Data Master.
						</p>
					</div>
				</Link>
			</div>

			{/* Banner Panduan */}
			<div className={styles.infoBanner}>
				<div className={styles.infoContent}>
					<div className={styles.infoIcon}>
						<Info size={24} />
					</div>
					<div>
						<div className={styles.infoTitle}>Panduan Pemetaan</div>
						<div className={styles.infoDesc}>
							Pemilihan periode akan mengarahkan Anda ke Dashboard Manajemen Mata Pelajaran spesifik untuk tahun ajaran
							tersebut. Pastikan Data Guru dan Data Kelas sudah diperbarui.
						</div>
					</div>
				</div>
				<Link href="/admin/master">
					<button className={styles.btnBanner}>Lihat Data Master</button>
				</Link>
			</div>
		</div>
	);
}
