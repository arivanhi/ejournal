// app/admin/tka/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Calendar, History, Plus, ArrowRight, ChevronRight, Info, Clock, Lightbulb } from "lucide-react";
import styles from "./periode.module.css";

export const dynamic = "force-dynamic";

export default async function PemilihanPeriodeTKA() {
	// Ambil semua daftar tahun ajaran dari database
	const semuaTahunAjaran = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" },
	});

	const tahunAktif = semuaTahunAjaran.find((t) => t.isActive);
	const arsipTahun = semuaTahunAjaran.filter((t) => !t.isActive);

	return (
		<div className={styles.pageContainer}>
			<div>
				<h1 className={styles.pageTitle}>Manajemen TKA</h1>
				<p className={styles.pageSubtitle}>Pilih periode akademik untuk mengelola rombongan belajar dan fasilitator TKA.</p>
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
							<Link href={`/admin/tka/${tahunAktif.id}`} className={styles.btnPrimaryAction}>
								<div style={{ display: "flex", flexDirection: "column" }}>
									<span style={{ fontSize: "0.7rem", color: "#94a3b8", fontWeight: 500 }}>Kelola Penugasan</span>
									<span>Buka Dashboard TKA</span>
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
									href={`/admin/tka/${arsip.id}`}
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

				{/* KARTU 3: INFO */}
				<div className={`${styles.card} ${styles.cardDashed}`} style={{ height: "100%", justifyContent: "center" }}>
					<div
						style={{
							backgroundColor: "#fef3c7",
							color: "#b45309",
							padding: "1rem",
							borderRadius: "50%",
							marginBottom: "1rem",
						}}
					>
						<Lightbulb size={32} />
					</div>
					<h3 style={{ fontSize: "1.125rem", color: "#111827", fontWeight: 700, marginBottom: "0.5rem", textAlign: "center" }}>
						Sistem Terintegrasi
					</h3>
					<p style={{ fontSize: "0.875rem", color: "#6b7280", padding: "0 1rem", textAlign: "center" }}>
						Fasilitator akan mendapatkan akses Jurnal dan Presensi yang sama seperti Guru Mapel biasa.
					</p>
				</div>
			</div>

			<div className={styles.infoBanner}>
				<div className={styles.infoContent}>
					<div className={styles.infoIcon}>
						<Info size={24} />
					</div>
					<div>
						<div className={styles.infoTitle}>Panduan Penugasan TKA</div>
						<div className={styles.infoDesc}>
							Pilih periode di atas untuk mulai membuat <b>Rombel TKA</b>, memasukkan siswa, dan menetapkan Guru Fasilitator.
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
