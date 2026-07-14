// app/admin/master/page.tsx
import { prisma } from "@/lib/prisma";
import MasterClient from "./MasterClient";

export const dynamic = "force-dynamic";

export default async function MasterPage() {
	// 1. Ambil data siswa asli beserta nama user dan kelasnya di tahun ajaran aktif
	const siswaFromDb = await prisma.siswa.findMany({
		include: {
			user: true,
			riwayatKelas: {
				include: {
					kelas: true,
				},
				where: {
					tahunAjaran: {
						isActive: true,
					},
				},
			},
		},
		orderBy: {
			nisn: "asc",
		},
	});

	// 2. Ambil data guru asli beserta nama dari tabel User
	const guruFromDb = await prisma.guru.findMany({
		include: {
			user: true,
		},
		orderBy: {
			npp: "asc",
		},
	});

	// 3. Format data agar siap dikonsumsi dengan mudah oleh Client Component
	const dataSiswa = siswaFromDb.map((s) => ({
		id: s.id,
		nisn: s.nisn,
		nis: s.nis,
		nama: s.user.nama,
		jenisKelamin: s.jenisKelamin,
		kelasSkarang: s.riwayatKelas[0]?.kelas.nama || "Belum Diassign",
	}));

	const dataGuru = guruFromDb.map((g) => ({
		id: g.id,
		npp: g.npp,
		nama: g.user.nama,
		jenisKelamin: g.jenisKelamin,
		status: g.status,
	}));

	// 4. Kirim data asli ke Client Component
	return <MasterClient initialSiswa={dataSiswa} initialGuru={dataGuru} />;
}
