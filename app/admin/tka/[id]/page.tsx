// app/admin/tka/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TkaClient from "./TkaClient";

export const dynamic = "force-dynamic";

export default async function TkaDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const tahunAjaranPilihan = await prisma.tahunAjaran.findUnique({ where: { id } });
	if (!tahunAjaranPilihan) redirect("/admin/tka");

	// 1. Ambil daftar Mata Pelajaran TKA
	const mapelTkaListDb = await prisma.mataPelajaran.findMany({
		where: { isTka: true },
		orderBy: { nama: "asc" },
	});

	// 2. Ambil daftar Guru
	const guruListDb = await prisma.guru.findMany({ 
		include: { user: true }, 
		orderBy: { user: { nama: "asc" } } 
	});
	
	// 3. Ambil daftar Rombel TKA
	const rombelTkaListDb = await prisma.kelas.findMany({
		where: { isTka: true },
		include: {
			riwayatSiswa: {
				where: { tahunAjaranId: id, isTka: true },
				include: { siswa: { include: { user: true } } },
			},
			jadwalPelajaran: {
				where: { tahunAjaranId: id, hari: 0, mapel: { isTka: true } },
				include: { 
					guru: { include: { user: true } },
					mapel: true
				},
			},
		},
		orderBy: { nama: "asc" },
	});

	// 4. Ambil semua Siswa Reguler (untuk dimasukkan ke rombel)
	const riwayatReguler = await prisma.riwayatKelasSiswa.findMany({
		where: { tahunAjaranId: id, isTka: false },
		include: {
			siswa: { include: { user: true } },
			kelas: true,
		},
		orderBy: { siswa: { user: { nama: "asc" } } },
	});

	// 5. Ambil data Tim Fasilitator TKA
	const timFasilitatorDb = await prisma.timFasilitatorTka.findMany({
		where: { tahunAjaranId: id },
		include: { guru: { include: { user: true } } },
	});

	return (
		<TkaClient
			tahunAjaran={tahunAjaranPilihan}
			mapelTkaList={mapelTkaListDb}
			guruList={guruListDb.map((g) => ({ id: g.id, nama: g.user.nama, npp: g.npp }))}
			rombelList={rombelTkaListDb}
			timFasilitatorList={timFasilitatorDb}
			siswaReguler={riwayatReguler.map((r) => ({
				id: r.siswa.id,
				nama: r.siswa.user.nama,
				nis: r.siswa.nis,
				kelasAsal: r.kelas.nama,
			}))}
		/>
	);
}
