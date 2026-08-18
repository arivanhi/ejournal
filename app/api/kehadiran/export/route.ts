import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function POST(req: Request) {
	try {
		const session = await getServerSession();
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const currentUser = await prisma.user.findFirst({
			where: {
				OR: [{ username: session.user.name || "" }, { nama: session.user.name || "" }],
				role: { in: ["KEPSEK", "WAKA"] },
			},
		});
		if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

		const body = await req.json();
		const { startDate, endDate, kelasIds, tahunAjaranId } = body;

		if (!tahunAjaranId || !kelasIds || kelasIds.length === 0) {
			return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
		}

		let dateFilter = {};
		if (startDate && endDate) {
			const start = new Date(startDate);
			start.setHours(0, 0, 0, 0);
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999);
			dateFilter = {
				waktuScan: {
					gte: start,
					lte: end,
				},
			};
		} else {
			// Jika kosong, kembalikan null agar klien tau dia bisa pakai dataKelas lama
			return NextResponse.json({ useClientData: true });
		}

		// Ambil data presensi yang sesuai filter tanggal
		const presensiFiltered = await prisma.presensiSiswa.findMany({
			where: {
				jurnal: {
					jadwal: {
						tahunAjaranId: tahunAjaranId,
						kelasId: { in: kelasIds },
					},
				},
				...dateFilter,
			},
			include: { jurnal: { include: { jadwal: true } } },
		});

		// Ambil kelas yang terpilih beserta siswanya
		const selectedClassesRaw = await prisma.kelas.findMany({
			where: { id: { in: kelasIds } },
			include: {
				waliKelas: { include: { guru: { include: { user: true } } } },
				riwayatSiswa: {
					where: { tahunAjaranId: tahunAjaranId },
					include: { siswa: { include: { user: true } } },
				},
			},
			orderBy: { nama: "asc" },
		});

		const classesToExport = selectedClassesRaw.map((kelas) => {
			const presensiKelas = presensiFiltered.filter((p) => p.jurnal.jadwal.kelasId === kelas.id);
			const totalSesi = new Set(presensiKelas.map((p) => p.jurnalId)).size;

			const siswaList = kelas.riwayatSiswa
				.map((rs) => {
					const presensiSiswaIni = presensiKelas.filter((p) => p.siswaId === rs.siswa.id);
					const countH = presensiSiswaIni.filter((p) => p.status === "H").length;
					const countS = presensiSiswaIni.filter((p) => p.status === "S").length;
					const countI = presensiSiswaIni.filter((p) => p.status === "I").length;
					const countA = presensiSiswaIni.filter((p) => p.status === "A").length;
					const persentase = totalSesi > 0 ? Math.round((countH / totalSesi) * 100) : 0;

					return {
						id: rs.siswa.id,
						nisn: rs.siswa.nis,
						nama: rs.siswa.user?.nama || "Siswa",
						jmlHadir: countH,
						detailKehadiran: { H: countH, S: countS, I: countI, A: countA },
						totalSesi: totalSesi,
						persentase,
						statusHariIni: "H", // Dummy untuk PDF, tidak tampil di PDF
					};
				})
				.sort((a, b) => a.nama.localeCompare(b.nama));

			return {
				id: kelas.id,
				nama: kelas.nama,
				waliKelas: kelas.waliKelas,
				siswaList,
			};
		});

		return NextResponse.json({ classesToExport });
	} catch (error) {
		console.error("API Export Error:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
