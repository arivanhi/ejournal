import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TeacherDashboardClient from "./TeacherDashboardClient";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";

	const currentUser = await prisma.user.findFirst({
		where: { OR: [{ username: sessionValue }, { nama: sessionValue }] },
		include: { guru: { include: { waliKelasDi: { include: { kelas: { include: { riwayatSiswa: true } } } } } } },
	});

	if (!currentUser) {
		return (
			<div style={{ padding: "3rem", textAlign: "center", fontFamily: "sans-serif" }}>
				<h2 style={{ color: "#ef4444" }}>Gagal Memuat Dashboard</h2>
				<p>Data akun tidak ditemukan. Hubungi Administrator.</p>
			</div>
		);
	}

	const guru = currentUser.guru;
	const isWaliKelas = currentUser.role === "WALI_KELAS";
	const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

	// 1. Data Wali Kelas
	let dataWaliKelas = null;
	if (isWaliKelas && guru && guru.waliKelasDi.length > 0 && tahunAjaranAktif) {
		const kelasWali = guru.waliKelasDi[0].kelas;
		const jumlahSiswa = kelasWali.riwayatSiswa.filter((rs) => rs.tahunAjaranId === tahunAjaranAktif.id).length;
		dataWaliKelas = { namaKelas: kelasWali.nama, jumlahSiswa: jumlahSiswa, izinHariIni: 0 };
	}

	// 2. Ambil JADWAL KESELURUHAN (Diurutkan berdasarkan Hari dan Jam)
	const jadwalKeseluruhanDb =
		guru && tahunAjaranAktif
			? await prisma.jadwalPelajaran.findMany({
					where: {
						guruId: guru.id,
						tahunAjaranId: tahunAjaranAktif.id,
						hari: { not: 0 }, // Ambil semua yang bukan pemetaan dasar
					},
					include: { mapel: true, kelas: true },
					orderBy: [{ hari: "asc" }, { waktuMulai: "asc" }],
				})
			: [];

	const mapHariText = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
	const jadwalKeseluruhan = jadwalKeseluruhanDb.map((j) => ({
		id: j.id,
		hari: mapHariText[j.hari] || "Senin",
		waktuMulai: j.waktuMulai,
		waktuSelesai: j.waktuSelesai,
		mapelKode: j.mapel.kode,
		mapelNama: j.mapel.nama,
		kelasNama: j.kelas.nama,
		ruang: j.ruang || "-",
	}));

	// 3. Metrik & Logika Kehadiran
	const totalJadwalMingguan = jadwalKeseluruhan.length;
	const jamMingguIni = totalJadwalMingguan * 2;

	// Cek apakah guru sudah pernah melakukan KBM (Submit Jurnal)
	const totalJurnalSubmitted = guru
		? await prisma.jurnalMengajar.count({
				where: { jadwal: { guruId: guru.id }, status: "SUBMITTED" },
			})
		: 0;

	// Jika belum pernah submit jurnal, kirim null agar Client menampilkan pesan khusus
	const kehadiran = totalJurnalSubmitted > 0 ? 100 : null;

	// 4. Alert Jurnal Draft
	const jurnalDraftDb = guru
		? await prisma.jurnalMengajar.findMany({
				where: { jadwal: { guruId: guru.id }, status: "DRAFT" },
				include: { jadwal: { include: { kelas: true } } },
				orderBy: { tanggal: "desc" },
				take: 1,
			})
		: [];

	const jurnalBelumTerisi =
		jurnalDraftDb.length > 0
			? {
					id: jurnalDraftDb[0].id,
					kelasNama: jurnalDraftDb[0].jadwal.kelas.nama,
					tanggal: jurnalDraftDb[0].tanggal.toLocaleDateString("id-ID", {
						weekday: "long",
						day: "numeric",
						month: "short",
					}),
				}
			: null;

	// 5. Aktivitas Terkini
	const aktivitasDb = guru
		? await prisma.jurnalMengajar.findMany({
				where: { jadwal: { guruId: guru.id }, status: "SUBMITTED" },
				include: { jadwal: { include: { kelas: true } } },
				orderBy: { tanggal: "desc" },
				take: 3,
			})
		: [];

	const aktivitasTerkini = aktivitasDb.map((a) => ({
		id: a.id,
		judul: `Jurnal Disimpan - ${a.jadwal.kelas.nama}`,
		waktu: a.tanggal.toLocaleString("id-ID", {
			weekday: "long",
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		}),
	}));

	return (
		<TeacherDashboardClient
			user={{ nama: currentUser.nama, role: currentUser.role }}
			isWaliKelas={isWaliKelas}
			dataWaliKelas={dataWaliKelas}
			jadwalKeseluruhan={jadwalKeseluruhan}
			stats={{ jamMingguIni, kehadiran }}
			jurnalBelumTerisi={jurnalBelumTerisi}
			aktivitasTerkini={aktivitasTerkini}
		/>
	);
}
