import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
	try {
		const session = await getServerSession();
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const { tahunAjaranId, startDate, endDate } = body;

		if (!tahunAjaranId || !startDate || !endDate) {
			return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
		}

		const start = new Date(startDate);
		start.setHours(0, 0, 0, 0);
		const end = new Date(endDate);
		end.setHours(23, 59, 59, 999);

		const jadwalTaIni = await prisma.jadwalPelajaran.findMany({
			where: { tahunAjaranId },
			include: { mapel: true, guru: { include: { user: true } }, kelas: true },
		});

		const periodJurnals = await prisma.jurnalMengajar.findMany({
			where: {
				tanggal: { gte: start, lte: end },
			},
			select: { jadwalId: true, tanggal: true }
		});

		// Buat Set untuk pencarian cepat: "jadwalId_YYYY-MM-DD"
		const jurnalSet = new Set(
			periodJurnals.map((j) => {
				const d = new Date(j.tanggal);
				const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
				return `${j.jadwalId}_${dateStr}`;
			})
		);

		const guruKosongMap: Record<string, { nama: string; mapel: string; kelas: string; tanggal: Set<string> }> = {};

		// Loop setiap hari dalam range
		for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
			let jsDay = d.getDay();
			let hari = jsDay === 0 ? 7 : jsDay;

			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			const dateDisplay = d.toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' });

			const jadwalHariIniRaw = jadwalTaIni.filter((j) => j.hari === hari);

			// Group Jadwal Berurutan (sama seperti dashboard pimpinan)
			const jadwalBlocks: any[] = [];
			const groupedJadwal: Record<string, any[]> = {};
			jadwalHariIniRaw.forEach((j) => {
				const key = `${j.guruId}-${j.mapelId}-${j.kelasId}`;
				if (!groupedJadwal[key]) groupedJadwal[key] = [];
				groupedJadwal[key].push(j);
			});

			for (const key in groupedJadwal) {
				const group = groupedJadwal[key].sort((a, b) => (parseInt(a.waktuMulai) || 0) - (parseInt(b.waktuMulai) || 0));
				let currentBlock: any = null;
				for (const j of group) {
					const currentSesi = parseInt(j.waktuMulai) || 0;
					if (!currentBlock) {
						currentBlock = { ...j, originalIds: [j.id], endSesi: j.waktuMulai };
					} else {
						const prevSesi = parseInt(currentBlock.endSesi) || 0;
						if (currentSesi === prevSesi + 1) {
							currentBlock.endSesi = j.waktuMulai;
							currentBlock.originalIds.push(j.id);
						} else {
							jadwalBlocks.push(currentBlock);
							currentBlock = { ...j, originalIds: [j.id], endSesi: j.waktuMulai };
						}
					}
				}
				if (currentBlock) jadwalBlocks.push(currentBlock);
			}

			jadwalBlocks.forEach((block) => {
				// Cek apakah ada satupun ID dari block yang ada di jurnalSet (berarti sudah terisi setidaknya 1)
				const isFilled = block.originalIds.some((id: string) => jurnalSet.has(`${id}_${dateStr}`));
				
				if (!isFilled) {
					const groupKey = `${block.guruId}_${block.mapelId}_${block.kelasId}`;
					if (!guruKosongMap[groupKey]) {
						guruKosongMap[groupKey] = {
							nama: block.guru.user.nama,
							mapel: block.mapel.nama,
							kelas: block.kelas.nama,
							tanggal: new Set()
						};
					}
					
					let jamSesi = block.waktuMulai === block.endSesi ? block.waktuMulai : `${block.waktuMulai}-${block.endSesi}`;
					if (!jamSesi || jamSesi === "-") jamSesi = "-";
					
					guruKosongMap[groupKey].tanggal.add(`${dateDisplay} (Jam ${jamSesi})`);
				}
			});
		}

		// Konversi Set menjadi Array dan urutkan
		const guruKosong = Object.values(guruKosongMap).map((g) => ({
			...g,
			tanggal: Array.from(g.tanggal)
		}));

		// Urutkan berdasarkan nama
		guruKosong.sort((a, b) => a.nama.localeCompare(b.nama));

		return NextResponse.json({
			success: true,
			guruKosong,
		});
	} catch (error: any) {
		console.error("API Report Periodic Error:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
