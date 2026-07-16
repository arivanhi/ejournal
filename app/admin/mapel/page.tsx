import { prisma } from "@/lib/prisma";
import MapelClient from "./MapelClient";

export const dynamic = "force-dynamic";

export default async function MapelPage() {
	const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

	// Ambil semua entitas master
	const semuaGuru = await prisma.guru.findMany({ include: { user: true }, orderBy: { user: { nama: "asc" } } });
	const semuaMapel = await prisma.mataPelajaran.findMany({ orderBy: { nama: "asc" } });
	const semuaKelas = await prisma.kelas.findMany({ orderBy: { nama: "asc" } });

	// Ambil pemetaan yang sudah ada di tahun ajaran ini
	const pemetaanDb = tahunAjaranAktif
		? await prisma.jadwalPelajaran.findMany({
				where: { tahunAjaranId: tahunAjaranAktif.id },
				include: { guru: { include: { user: true } }, mapel: true, kelas: true },
			})
		: [];

	// Hitung KPI (Total Mapel Aktif & Distribusi Kelas)
	const uniqueMapels = new Set(pemetaanDb.map((p) => p.mapelId)).size;
	const uniqueKelas = new Set(pemetaanDb.map((p) => p.kelasId)).size;

	// Format ulang data pemetaan untuk dikelompokkan per Guru
	const guruMap = new Map();

	pemetaanDb.forEach((item) => {
		if (!guruMap.has(item.guruId)) {
			guruMap.set(item.guruId, {
				guru: {
					id: item.guru.id,
					nama: item.guru.user.nama,
					npp: item.guru.npp,
				},
				mapels: new Map(), // Menyimpan mapel dan array kelas
			});
		}

		const guruData = guruMap.get(item.guruId);
		if (!guruData.mapels.has(item.mapelId)) {
			guruData.mapels.set(item.mapelId, { id: item.mapel.id, nama: item.mapel.nama, kelasTarget: [] });
		}

		guruData.mapels.get(item.mapelId).kelasTarget.push(item.kelas.nama);
	});

	// Konversi Map ke Array agar mudah di-render di Client
	const daftarPemetaan = Array.from(guruMap.values()).map((g) => ({
		guru: g.guru,
		mapels: Array.from(g.mapels.values()),
	}));

	return (
		<MapelClient
			guruList={semuaGuru.map((g) => ({ id: g.id, nama: g.user.nama, npp: g.npp }))}
			mapelList={semuaMapel}
			kelasList={semuaKelas}
			daftarPemetaan={daftarPemetaan}
			kpi={{ totalMapel: uniqueMapels, totalRombel: uniqueKelas }}
		/>
	);
}
