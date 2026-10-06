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

		// Group by date
		const groupedData = new Map<string, any>();
		
		presensi.forEach((p) => {
			if (!p.jurnal.tanggal) return;
			const dateStr = p.jurnal.tanggal.toISOString().split("T")[0];
			
			const isDispen = p.isDispensasi;
			const isTerlambat = p.isTerlambat;
			let statusToUse = p.status;
			if (isDispen) statusToUse = "H";
			
			const priority = { A: 4, S: 3, I: 2, H: 1 };
			const newPriority = priority[statusToUse as keyof typeof priority] || 0;
			
			let newAlasan = p.alasan || p.alasanIzin || p.alasanTerlambat || "";
			if (isDispen && !newAlasan) newAlasan = "Dispensasi";

			if (!groupedData.has(dateStr)) {
				groupedData.set(dateStr, {
					id: p.id,
					tanggal: p.jurnal.tanggal,
					statusToUse: statusToUse,
					isDispensasi: isDispen,
					isTerlambat: isTerlambat,
					alasan: newAlasan ? [newAlasan] : [],
					fileBukti: p.fileBukti || null,
					waktuScan: p.waktuScan || p.jurnal.waktuMulai,
				});
			} else {
				const existing = groupedData.get(dateStr);
				const currentPriority = priority[existing.statusToUse as keyof typeof priority] || 0;
				
				if (isDispen) existing.isDispensasi = true;
				if (isTerlambat) existing.isTerlambat = true;
				if (newAlasan) existing.alasan.push(newAlasan);
				if (p.fileBukti) existing.fileBukti = p.fileBukti;

				if (newPriority > currentPriority) {
					existing.statusToUse = statusToUse;
				}
			}
		});

		const data = Array.from(groupedData.values()).map((p) => {
			let finalStatus = "";
			if (p.statusToUse === "A") finalStatus = "Alpa";
			else if (p.statusToUse === "S") finalStatus = "Sakit";
			else if (p.statusToUse === "I") finalStatus = "Izin";
			else if (p.isDispensasi) finalStatus = "Dispensasi";
			else if (p.isTerlambat) finalStatus = "Terlambat";
			else finalStatus = "Hadir";

			const uniqueAlasan = Array.from(new Set(p.alasan)).filter(Boolean);

			return {
				id: p.id,
				tanggal: p.tanggal,
				statusLabel: finalStatus,
				isDispensasi: p.isDispensasi,
				isTerlambat: p.isTerlambat,
				alasan: uniqueAlasan.length > 0 ? uniqueAlasan.join(" | ") : "-",
				fileBukti: p.fileBukti || null,
				mapel: "Rekap Harian",
				guru: "-", 
				waktuScan: p.waktuScan,
			};
		}).sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

		// Hitung statistik untuk dikembalikan
		let H = 0, S = 0, I = 0, A = 0, T = 0, D = 0;
			
		data.forEach((p) => {
			if (p.statusLabel === "Dispensasi") { D++; H++; }
			else if (p.statusLabel === "Terlambat") { T++; H++; }
			else if (p.statusLabel === "Hadir") H++;
			else if (p.statusLabel === "Sakit") S++;
			else if (p.statusLabel === "Izin") I++;
			else if (p.statusLabel === "Alpa") A++;
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
