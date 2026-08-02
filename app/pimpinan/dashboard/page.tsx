// app/pimpinan/dashboard/page.tsx
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

	// 2. Ambil Semua Jurnal Hari Ini (Sertakan detail Siswa untuk absensi)
	const jurnalHariIni = await prisma.jurnalMengajar.findMany({
		where: { tanggal: { gte: startOfDay, lt: endOfDay } },
		include: {
			jadwal: { include: { mapel: true, kelas: true, guru: { include: { user: true } } } },
			presensi: {
				include: {
					siswa: { include: { user: true } },
				},
			},
		},
		orderBy: { waktuMulai: "desc" },
	});

	// 3. Kalkulasi: Jurnal Terkumpul
	const totalJadwal = jadwalHariIni.length;
	const terkumpul = jurnalHariIni.length;

	// 4. Kalkulasi: Total Siswa Absen & Rekapitulasi SELURUH Kehadiran Siswa
	let totalSiswaAbsen = 0;
	const absenPerKelas: Record<string, number> = {};
	const dataKehadiranSiswa: any[] = []; // <-- Menyimpan Hadir, Sakit, Izin, Alpa

	jurnalHariIni.forEach((jurnal) => {
		const namaKelas = jurnal.jadwal.kelas.nama;
		if (!absenPerKelas[namaKelas]) absenPerKelas[namaKelas] = 0;

		jurnal.presensi.forEach((p) => {
			// Hanya hitung angka statistik untuk yang bolos/izin
			if (["A", "I", "S"].includes(p.status)) {
				totalSiswaAbsen++;
				absenPerKelas[namaKelas]++;
			}

			// Namun masukkan SEMUA siswa ke dalam tabel kehadiran
			dataKehadiranSiswa.push({
				nama: p.siswa.user.nama,
				kelas: namaKelas,
				status: p.status, // "H", "S", "I", "A"
				mapel: jurnal.jadwal.mapel.nama,
			});
		});
	});

	// Urutkan Tingkat Absensi Tertinggi (Statistik)
	const tingkatAbsensiTertinggi = Object.entries(absenPerKelas)
		.map(([kelas, jumlah]) => ({ kelas, jumlah, persentase: Math.min(Math.round((jumlah / 36) * 100), 100) }))
		.sort((a, b) => b.jumlah - a.jumlah)
		.slice(0, 4);

	// 5. Kalkulasi: Peringatan Jam Kosong
	const jadwalTerkumpulIds = jurnalHariIni.map((j) => j.jadwalId);
	let jamKosongCount = 0;
	const peringatanJamKosong: any[] = [];

	jadwalHariIni.forEach((jadwal) => {
		if (!jadwalTerkumpulIds.includes(jadwal.id)) {
			jamKosongCount++;

			// Logika format jam yang kebal terhadap isi database yang kosong / strip "-"
			let jamSesi = jadwal.waktuMulai && jadwal.waktuMulai !== "-" ? jadwal.waktuMulai : "";
			if (jadwal.waktuSelesai && jadwal.waktuSelesai !== "-" && jadwal.waktuSelesai !== jadwal.waktuMulai) {
				jamSesi = jamSesi ? `${jamSesi}-${jadwal.waktuSelesai}` : jadwal.waktuSelesai;
			}
			if (!jamSesi) jamSesi = "-"; // Fallback terakhir jika database benar-benar hanya berisi "-"

			peringatanJamKosong.push({
				jam: jamSesi,
				mapel: jadwal.mapel.nama,
				kelas: jadwal.kelas.nama,
				guru: jadwal.guru.user.nama,
				status: "Belum Dikonfirmasi",
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
			peringatanJamKosong={peringatanJamKosong.slice(0, 3)}
			riwayatJurnal={jurnalHariIni}
			dataKehadiranSiswa={dataKehadiranSiswa}
		/>
	);
}
