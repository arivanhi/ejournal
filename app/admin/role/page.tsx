import { prisma } from "@/lib/prisma";
import RoleClient from "./RoleClient";

export const dynamic = "force-dynamic";

export default async function RolePage() {
	// 1. Ambil data Kelas dan hitung metrik (KPI)
	const semuaKelas = await prisma.kelas.findMany({
		include: { waliKelas: true },
	});

	const totalKelas = semuaKelas.length;
	const terisiWali = semuaKelas.filter((k) => k.waliKelas.length > 0).length;
	const belumTerisi = totalKelas - terisiWali;

	// 2. Ambil data Guru beserta status walinya
	const guruList = await prisma.guru.findMany({
		include: {
			user: true,
			waliKelasDi: {
				include: { kelas: true },
			},
		},
		orderBy: { user: { nama: "asc" } },
	});

	// 3. Format data guru untuk dikirim ke Client
	const formattedGuru = guruList.map((g) => ({
		id: g.id,
		npp: g.npp,
		nama: g.user.nama,
		kelasWaliId: g.waliKelasDi[0]?.kelas.id || null,
		namaKelas: g.waliKelasDi[0]?.kelas.nama || "-",
	}));

	// 4. Format daftar kelas untuk opsi di Dropdown Modal
	const formattedKelas = semuaKelas
		.map((k) => ({
			id: k.id,
			nama: k.nama,
			isAssigned: k.waliKelas.length > 0,
		}))
		.sort((a, b) => a.nama.localeCompare(b.nama));

	return (
		<RoleClient guruData={formattedGuru} kelasData={formattedKelas} kpi={{ totalKelas, terisiWali, belumTerisi }} />
	);
}
