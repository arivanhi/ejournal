// app/admin/mapel/[id]/page.tsx

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MapelClient from "./MapelClient";

export const dynamic = "force-dynamic";

export default async function MapelDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	// 1. KUNCI PERBAIKAN: Sertakan data relasi 'mataPelajaran' saat memanggil Tahun Ajaran
	const tahunAjaranPilihan = await prisma.tahunAjaran.findUnique({
		where: { id },
		include: {
			mataPelajaran: {
				orderBy: { nama: "asc" },
			},
		},
	});

	if (!tahunAjaranPilihan) {
		redirect("/admin/mapel");
	}

	const guruListDb = await prisma.guru.findMany({ include: { user: true }, orderBy: { user: { nama: "asc" } } });
	const kelasList = await prisma.kelas.findMany({ orderBy: { nama: "asc" } });

	// 2. KUNCI PERBAIKAN: Gunakan daftar mapel yang HANYA terhubung dengan tahun ajaran ini
	const mapelList = tahunAjaranPilihan.mataPelajaran;

	// Ambil data pemetaan berdasarkan ID tahun ajaran yang dipilih
	const jadwalList = await prisma.jadwalPelajaran.findMany({
		where: {
			tahunAjaranId: tahunAjaranPilihan.id,
			hari: 0,
		},
		include: { guru: { include: { user: true } }, mapel: true, kelas: true },
	});

	// Kelompokkan Data Pemetaan
	const groupedData: any[] = [];

	jadwalList.forEach((jadwal) => {
		let guruGroup = groupedData.find((g) => g.guru.id === jadwal.guruId);
		if (!guruGroup) {
			guruGroup = {
				guru: { id: jadwal.guruId, nama: jadwal.guru.user.nama, npp: jadwal.guru.npp },
				mapels: [],
			};
			groupedData.push(guruGroup);
		}

		let mapelGroup = guruGroup.mapels.find((m: any) => m.id === jadwal.mapelId);
		if (!mapelGroup) {
			mapelGroup = { id: jadwal.mapelId, nama: jadwal.mapel.nama, kelasTarget: [] };
			guruGroup.mapels.push(mapelGroup);
		}

		if (!mapelGroup.kelasTarget.includes(jadwal.kelas.nama)) {
			mapelGroup.kelasTarget.push(jadwal.kelas.nama);
		}
	});

	const kpiTotalMapel = new Set(jadwalList.map((j) => j.mapelId)).size;
	const kpiTotalRombel = new Set(jadwalList.map((j) => j.kelasId)).size;

	return (
		<MapelClient
			guruList={guruListDb.map((g) => ({ id: g.id, nama: g.user.nama, npp: g.npp }))}
			mapelList={mapelList}
			kelasList={kelasList}
			daftarPemetaan={groupedData}
			kpi={{ totalMapel: kpiTotalMapel, totalRombel: kpiTotalRombel }}
		/>
	);
}
