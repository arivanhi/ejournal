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
			let hari = jsDay === 0 ? 7 : jsDay; // Sesuaikan jika 0 (Minggu) menjadi 7 di DB (walau sekolah jarang hari minggu)
			
			// Format YYYY-MM-DD
			const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
			const dateDisplay = d.toLocaleDateString("id-ID", { day: '2-digit', month: 'long', year: 'numeric' });

			// Cari jadwal yang aktif di hari ini
			const jadwalHariIni = jadwalTaIni.filter((j) => j.hari === hari);

			jadwalHariIni.forEach((jadwal) => {
				const key = `${jadwal.id}_${dateStr}`;
				if (!jurnalSet.has(key)) {
					// Gunakan kombinasi guru, mapel, dan kelas agar tidak duplikat
					const groupKey = `${jadwal.guruId}_${jadwal.mapelId}_${jadwal.kelasId}`;
					if (!guruKosongMap[groupKey]) {
						guruKosongMap[groupKey] = {
							nama: jadwal.guru.user.nama,
							mapel: jadwal.mapel.nama,
							kelas: jadwal.kelas.nama,
							tanggal: new Set()
						};
					}
					guruKosongMap[groupKey].tanggal.add(dateDisplay);
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
