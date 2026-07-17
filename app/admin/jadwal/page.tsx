import { prisma } from "@/lib/prisma";
import JadwalClient from "./JadwalClient";

export const dynamic = "force-dynamic";

export default async function JadwalPage() {
	const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

	// 1. Ambil Kelas + Hitung Siswa + Nama Wali Kelas
	const kelasListDb = await prisma.kelas.findMany({
		orderBy: { nama: "asc" },
		include: {
			riwayatSiswa: tahunAjaranAktif ? { where: { tahunAjaranId: tahunAjaranAktif.id } } : false,
			waliKelas: { include: { guru: { include: { user: true } } } },
		},
	});

	const kelasListFormatted = kelasListDb.map((k) => ({
		id: k.id,
		nama: k.nama,
		jumlahSiswa: k.riwayatSiswa ? k.riwayatSiswa.length : 0,
		waliKelas: k.waliKelas[0]?.guru?.user?.nama || "-",
	}));

	// 2. Ambil "Pemetaan Dasar" (Hari = 0) dari Manajemen Mapel
	const pemetaanDasarDb = tahunAjaranAktif
		? await prisma.jadwalPelajaran.findMany({
				where: {
					tahunAjaranId: tahunAjaranAktif.id,
					hari: 0,
				},
				include: { guru: { include: { user: true } }, mapel: true },
			})
		: [];

	const pemetaanDasar = pemetaanDasarDb.map((p) => ({
		kelasId: p.kelasId,
		mapelId: p.mapelId,
		mapelNama: p.mapel.nama,
		guruId: p.guruId,
		guruNama: p.guru.user.nama,
	}));

	// 3. Ambil Jadwal Aktual (Hari != 0) yang sudah masuk kalender
	const jadwalDb = tahunAjaranAktif
		? await prisma.jadwalPelajaran.findMany({
				where: {
					tahunAjaranId: tahunAjaranAktif.id,
					hari: { notIn: [0] },
				},
				include: { guru: { include: { user: true } }, mapel: true },
			})
		: [];

	const mapHariText = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
	const jadwalExisting = jadwalDb.map((j) => ({
		...j,
		hari: mapHariText[j.hari] || "Senin",
	}));

	return (
		<JadwalClient
			kelasList={kelasListFormatted}
			pemetaanDasar={pemetaanDasar}
			jadwalExisting={jadwalExisting}
			tahunAjaran={tahunAjaranAktif?.nama || "-"}
			semester={tahunAjaranAktif?.nama || "-"}
		/>
	);
}
