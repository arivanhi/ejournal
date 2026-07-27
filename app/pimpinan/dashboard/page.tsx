import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PimpinanDashboardClient from "./PimpinanDashboardClient";

export const dynamic = "force-dynamic";

export default async function PimpinanDashboard() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: session.user.name || "" }, { nama: session.user.name || "" }],
			role: { in: ["KEPSEK", "WAKA"] },
		},
	});

	if (!currentUser) redirect("/login");

	const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

	// Konfigurasi Hari Ini
	const today = new Date();
	const currentDayIndex = today.getDay(); // 0 (Minggu) - 6 (Sabtu)
	const startOfDay = new Date(today);
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date(today);
	endOfDay.setHours(23, 59, 59, 999);

	// 1. Ambil Semua Jadwal Hari Ini
	const jadwalHariIni = tahunAjaranAktif
		? await prisma.jadwalPelajaran.findMany({
				where: {
					tahunAjaranId: tahunAjaranAktif.id,
					hari: currentDayIndex,
				},
				include: { mapel: true, kelas: true, guru: { include: { user: true } } },
			})
		: [];

	// 2. Ambil Semua Jurnal Hari Ini
	const jurnalHariIni = await prisma.jurnalMengajar.findMany({
		where: { tanggal: { gte: startOfDay, lt: endOfDay } },
		include: {
			jadwal: { include: { mapel: true, kelas: true, guru: { include: { user: true } } } },
			presensi: true,
		},
		orderBy: { waktuMulai: "desc" },
	});

	// 3. Kalkulasi: Jurnal Terkumpul
	const totalJadwal = jadwalHariIni.length;
	const terkumpul = jurnalHariIni.length;

	// 4. Kalkulasi: Total Siswa Absen (A, I, S)
	let totalSiswaAbsen = 0;
	const absenPerKelas: Record<string, number> = {};

	jurnalHariIni.forEach((jurnal) => {
		const absenDiJurnalIni = jurnal.presensi.filter((p) => ["A", "I", "S"].includes(p.status));
		totalSiswaAbsen += absenDiJurnalIni.length;

		const namaKelas = jurnal.jadwal.kelas.nama;
		if (!absenPerKelas[namaKelas]) absenPerKelas[namaKelas] = 0;
		absenPerKelas[namaKelas] += absenDiJurnalIni.length;
	});

	// Urutkan Tingkat Absensi Tertinggi
	const tingkatAbsensiTertinggi = Object.entries(absenPerKelas)
		.map(([kelas, jumlah]) => ({ kelas, jumlah, persentase: Math.min(Math.round((jumlah / 36) * 100), 100) })) // Asumsi 1 kelas 36 siswa sbg persentase kasar
		.sort((a, b) => b.jumlah - a.jumlah)
		.slice(0, 4);

	// 5. Kalkulasi: Peringatan Jam Kosong (Jadwal hari ini yang belum ada jurnalnya)
	const jadwalTerkumpulIds = jurnalHariIni.map((j) => j.jadwalId);
	let jamKosongCount = 0;
	const peringatanJamKosong: any[] = [];

	const currentTimeMinutes = today.getHours() * 60 + today.getMinutes();

	jadwalHariIni.forEach((jadwal) => {
		if (!jadwalTerkumpulIds.includes(jadwal.id)) {
			jamKosongCount++;

			// Cek apakah sudah terlambat (asumsi waktuMulai format "07:00")
			let status = "Belum Dikonfirmasi";
			if (jadwal.waktuMulai) {
				const [h, m] = jadwal.waktuMulai.split(":");
				const startMins = parseInt(h) * 60 + parseInt(m);
				if (currentTimeMinutes > startMins + 15) {
					status = "Belum Mulai (Telat 15m+)";
				}
			}

			peringatanJamKosong.push({
				jam: jadwal.waktuMulai || "-",
				mapel: jadwal.mapel.nama,
				kelas: jadwal.kelas.nama,
				guru: jadwal.guru.user.nama,
				status: status,
			});
		}
	});

	return (
		<PimpinanDashboardClient
			user={currentUser}
			tahunAjaran={tahunAjaranAktif}
			stats={{
				totalSiswaAbsen,
				jamKosongCount,
				jurnalTerkumpul: terkumpul,
				totalJadwalTarget: totalJadwal,
			}}
			tingkatAbsensi={tingkatAbsensiTertinggi}
			peringatanJamKosong={peringatanJamKosong.slice(0, 3)} // Ambil 3 teratas
			riwayatJurnal={jurnalHariIni} // Kirim jurnal real
		/>
	);
}
