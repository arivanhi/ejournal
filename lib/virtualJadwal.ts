import { prisma } from "./prisma";

export async function ensureVirtualJadwal(guruId: string, tahunAjaranId: string) {
	// 1. Cari jadwal guru ini di jam ke-1 pada hari Selasa (2) dan Kamis (4)
	const baseJadwals = await prisma.jadwalPelajaran.findMany({
		where: {
			guruId,
			tahunAjaranId,
			waktuMulai: "1",
			hari: { in: [2, 4] },
			kelas: {
				AND: [
					{ nama: { startsWith: "X" } },
					{ nama: { not: { startsWith: "XI" } } },
					{ nama: { not: { startsWith: "XII" } } }
				]
			}
		},
		include: { kelas: true }
	});

	if (baseJadwals.length === 0) return;

	// 2. Pastikan mapel Literasi dan Numerasi ada
	let mapelLit = await prisma.mataPelajaran.findFirst({ where: { nama: { contains: "Literasi" } } });
	if (!mapelLit) mapelLit = await prisma.mataPelajaran.create({ data: { kode: "LIT", nama: "Literasi" } });

	let mapelNum = await prisma.mataPelajaran.findFirst({ where: { nama: { contains: "Numerasi" } } });
	if (!mapelNum) mapelNum = await prisma.mataPelajaran.create({ data: { kode: "NUM", nama: "Numerasi" } });

	// 3. Buat jadwal virtual jika belum ada
	for (const j of baseJadwals) {
		const isSelasa = j.hari === 2;
		const isKamis = j.hari === 4;

		if (isSelasa) {
			const existingLit = await prisma.jadwalPelajaran.findFirst({
				where: { guruId, tahunAjaranId, kelasId: j.kelasId, hari: 2, waktuMulai: "LIT" }
			});
			if (!existingLit) {
				await prisma.jadwalPelajaran.create({
					data: {
						guruId, 
						tahunAjaranId, 
						kelasId: j.kelasId, 
						hari: 2, 
						waktuMulai: "LIT", 
						waktuSelesai: "LIT", 
						mapelId: mapelLit.id, 
						ruang: j.ruang
					}
				});
			}
		}

		if (isKamis) {
			const existingNum = await prisma.jadwalPelajaran.findFirst({
				where: { guruId, tahunAjaranId, kelasId: j.kelasId, hari: 4, waktuMulai: "NUM" }
			});
			if (!existingNum) {
				await prisma.jadwalPelajaran.create({
					data: {
						guruId, 
						tahunAjaranId, 
						kelasId: j.kelasId, 
						hari: 4, 
						waktuMulai: "NUM", 
						waktuSelesai: "NUM", 
						mapelId: mapelNum.id, 
						ruang: j.ruang
					}
				});
			}
		}
	}
}
