// app/admin/master/page.tsx
import { prisma } from "@/lib/prisma";
import MasterClient from "./MasterClient";

export const dynamic = "force-dynamic";

export default async function MasterPage() {
	// 1. Ambil data Siswa
	const siswaFromDb = await prisma.siswa.findMany({
		include: {
			user: true,
			riwayatKelas: { include: { kelas: true }, where: { tahunAjaran: { isActive: true } } },
		},
		orderBy: { nisn: "asc" },
	});

	// 2. Ambil data Guru
	const guruFromDb = await prisma.guru.findMany({
		include: { user: true },
		orderBy: { npp: "asc" },
	});

	// 3. Ambil data Mata Pelajaran (BARU)
	const mapelFromDb = await prisma.mataPelajaran.findMany({
		orderBy: { kode: "asc" },
	});

	// Format data
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

	const dataMapel = mapelFromDb.map((m) => ({
		id: m.id,
		kode: m.kode,
		nama: m.nama,
	}));
	// --> TAMBAHKAN BARIS INI UNTUK MENARIK DATA TAHUN AJARAN <--
	const dataTahunAjar = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" }, // Mengurutkan dari tahun terbaru ke terlama
		include: {
			mataPelajaran: true,
		},
	});

	// Kirim ketiga data ke Client Component
	return (
		<MasterClient
			initialSiswa={dataSiswa}
			initialGuru={dataGuru}
			initialMapel={dataMapel}
			initialTahunAjar={dataTahunAjar}
		/>
	);
}
