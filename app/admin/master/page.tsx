// app/admin/master/page.tsx
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import MasterClient from "./MasterClient";

export const dynamic = "force-dynamic";

export default async function MasterPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: session.user.name || "" }, { nama: session.user.name || "" }],
			// PERBAIKAN: Ini halaman Admin TU, jadi yang diizinkan masuk adalah ADMIN_TU
			role: Role.ADMIN_TU,
		},
	});
	if (!currentUser) redirect("/login");

	// 1. Ambil data Siswa (Mengambil userId juga untuk reset password)
	const siswaFromDb = await prisma.siswa.findMany({
		include: {
			user: true,
			riwayatKelas: { include: { kelas: true }, where: { tahunAjaran: { isActive: true } } },
		},
		orderBy: { nisn: "asc" },
	});

	// 2. Ambil data Guru / Staf (Mengambil dari tabel User)
	const guruFromDb = await prisma.user.findMany({
		// PERBAIKAN: Menggunakan WAKA sesuai dengan enum di database Bapak
		where: { role: { in: [Role.GURU, Role.WALI_KELAS, Role.KEPSEK, Role.WAKA] } },
		include: { guru: true },
		orderBy: { username: "asc" },
	});

	// 3. Ambil data Mata Pelajaran
	const mapelFromDb = await prisma.mataPelajaran.findMany({
		orderBy: { kode: "asc" },
	});

	// 4. Ambil data Tahun Ajaran
	const dataTahunAjar = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" },
		include: { mataPelajaran: true },
	});

	// Format data untuk Client
	const dataSiswa = siswaFromDb.map((s) => ({
		id: s.id,
		userId: s.userId, // Ditambahkan untuk Reset Password
		nisn: s.nisn,
		nis: s.nis,
		nama: s.user.nama,
		jenisKelamin: s.jenisKelamin,
		kelasSkarang: s.riwayatKelas[0]?.kelas.nama || "Belum Diassign",
	}));

	const dataGuru = guruFromDb.map((u) => ({
		id: u.id,
		userId: u.id,
		npp: u.username,
		nama: u.nama,
		jenisKelamin: u.guru?.jenisKelamin || "-",
		status: u.guru?.status ?? true,
		role: u.role,
	}));

	const dataMapel = mapelFromDb.map((m) => ({
		id: m.id,
		kode: m.kode,
		nama: m.nama,
	}));

	return (
		<MasterClient
			initialSiswa={dataSiswa}
			initialGuru={dataGuru}
			initialMapel={dataMapel}
			initialTahunAjar={dataTahunAjar}
		/>
	);
}
