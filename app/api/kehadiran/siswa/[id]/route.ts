import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await getServerSession();
		if (!session || !session.user) {
			return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		// Karena parameter di Next.js 15 App Router bisa berupa Promise,
		// kita await paramsnya terlebih dahulu agar tidak ada warning "params should be awaited".
		const { id: siswaId } = await params;
		if (!siswaId) {
			return NextResponse.json({ success: false, message: "ID Siswa tidak valid" }, { status: 400 });
		}

		// Cari tahun ajaran aktif
		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({
			where: { isActive: true },
		});
		if (!tahunAjaranAktif) {
			return NextResponse.json({ success: false, message: "Tidak ada Tahun Ajaran aktif" }, { status: 400 });
		}

		// Ambil riwayat presensi siswa pada tahun ajaran aktif ini saja (agar ringan)
		const presensi = await prisma.presensiSiswa.findMany({
			where: {
				siswaId: siswaId,
				jurnal: {
					jadwal: {
						tahunAjaranId: tahunAjaranAktif.id,
					},
				},
			},
			include: {
				jurnal: {
					include: {
						jadwal: {
							include: {
								mapel: true,
								guru: {
									include: {
										user: true
									}
								},
							},
						},
					},
				},
			},
			orderBy: {
				jurnal: {
					tanggal: "desc",
				},
			},
		});

		// Mapping agar payload yang dikirim rapi
		const data = presensi.map((p) => {
			let finalStatus = "";
			if (p.isDispensasi) finalStatus = "Dispensasi";
			else if (p.status === "H" && p.isTerlambat) finalStatus = "Terlambat";
			else if (p.status === "H") finalStatus = "Hadir";
			else if (p.status === "S") finalStatus = "Sakit";
			else if (p.status === "I") finalStatus = "Izin";
			else if (p.status === "A") finalStatus = "Alpa";

			return {
				id: p.id,
				tanggal: p.jurnal.tanggal,
				statusAsli: p.status, // H, S, I, A
				statusLabel: finalStatus,
				isDispensasi: p.isDispensasi,
				isTerlambat: p.isTerlambat,
				alasan: p.alasan || p.alasanIzin || p.alasanTerlambat || "-",
				fileBukti: p.fileBukti || null,
				mapel: p.jurnal.jadwal.mapel.nama,
				guru: p.jurnal.jadwal.guru.user?.nama || "Guru",
				waktuScan: p.waktuScan || p.jurnal.waktuMulai,
			};
		});

		// Hitung statistik untuk dikembalikan
		let H = 0,
			S = 0,
			I = 0,
			A = 0,
			T = 0,
			D = 0;
			
		data.forEach((p) => {
			if (p.isDispensasi) D++;
			else if (p.statusAsli === "H" && p.isTerlambat) { H++; T++; }
			else if (p.statusAsli === "H") H++;
			else if (p.statusAsli === "S") S++;
			else if (p.statusAsli === "I") I++;
			else if (p.statusAsli === "A") A++;
		});

		return NextResponse.json({
			success: true,
			data,
			summary: { H, S, I, A, T, D },
		});
	} catch (error) {
		console.error("Error fetching kehadiran siswa detail:", error);
		return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
	}
}
