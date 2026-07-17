// app/admin/mapel/page.tsx

import { prisma } from "@/lib/prisma";
import MapelClient from "./MapelClient";

export const dynamic = "force-dynamic";

export default async function MapelPage() {
	const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

	const guruListDb = await prisma.guru.findMany({ include: { user: true }, orderBy: { user: { nama: "asc" } } });
	const mapelList = await prisma.mataPelajaran.findMany({ orderBy: { nama: "asc" } });
	const kelasList = await prisma.kelas.findMany({ orderBy: { nama: "asc" } });

	// Hanya ambil data pemetaan (hari = 0) agar tidak tercampur dengan jadwal asli
	const jadwalList = tahunAjaranAktif
		? await prisma.jadwalPelajaran.findMany({
				where: {
					tahunAjaranId: tahunAjaranAktif.id,
					hari: 0, // <--- KUNCI: Hanya ambil yang hari = 0
				},
				include: { guru: { include: { user: true } }, mapel: true, kelas: true },
			})
		: [];

	// 4. Kelompokkan Data Pemetaan
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

		// CEGAH DUPLIKAT: Pastikan kelas belum ada di array kelasTarget
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
