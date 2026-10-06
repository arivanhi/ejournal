// app/pimpinan/dashboard/page.tsx
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PimpinanDashboardClient from "./PimpinanDashboardClient";

export const dynamic = "force-dynamic";

const parseSesi = (val: any) => {
	if (val === null || val === undefined) return null;
	const strVal = String(val).trim();
	if (strVal.includes(":")) return null; // Jika mengandung tanda titik dua, abaikan (format jam)
	const match = strVal.match(/\d+/);
	if (match) {
		const num = Number(match[0]);
		if (num > 0 && num <= 20) return num;
	}
	return null;
};

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
	const rawJadwalHariIni = tahunAjaranAktif
		? await prisma.jadwalPelajaran.findMany({
				where: {
					tahunAjaranId: tahunAjaranAktif.id,
					hari: currentDayIndex,
					kelas: { nama: { startsWith: "X" } },
				},
				include: { mapel: true, kelas: true, guru: { include: { user: true } } },
			})
		: [];

	// 1.5. Group Jadwal berdasarkan Guru-Mapel-Kelas
	const jadwalBlocks: any[] = [];
	const groupedJadwal: Record<string, any[]> = {};
	rawJadwalHariIni.forEach((j) => {
		const key = `${j.guruId}-${j.mapelId}-${j.kelasId}`;
		if (!groupedJadwal[key]) groupedJadwal[key] = [];
		groupedJadwal[key].push(j);
	});

	for (const key in groupedJadwal) {
		const group = groupedJadwal[key].sort((a, b) => {
			const timeA = (parseSesi(a.waktuMulai) ?? parseInt(a.waktuMulai?.replace(":", "") || "0")) || 0;
			const timeB = (parseSesi(b.waktuMulai) ?? parseInt(b.waktuMulai?.replace(":", "") || "0")) || 0;
			return timeA - timeB;
		});

		const first = group[0];
		
		let minSesi: number | null = null;
		let maxSesi: number | null = null;
		
		group.forEach((j) => {
			const s = parseSesi(j.waktuMulai) ?? parseSesi(j.waktuSelesai) ?? parseSesi(j.sesi) ?? parseSesi(j.jam) ?? parseSesi(j.jamKe);
			if (s !== null) {
				if (minSesi === null || s < minSesi) minSesi = s;
				if (maxSesi === null || s > maxSesi) maxSesi = s;
			}
		});

		let computedWaktuMulai = first.waktuMulai;
		let computedEndSesi = first.waktuSelesai || first.waktuMulai;
		
		if (minSesi !== null) {
			computedWaktuMulai = minSesi.toString();
			computedEndSesi = maxSesi !== null ? maxSesi.toString() : minSesi.toString();
		}

		jadwalBlocks.push({
			...first,
			originalIds: group.map((g) => g.id),
			waktuMulai: computedWaktuMulai,
			endSesi: computedEndSesi,
		});
	}

	// 2. Ambil Semua Jurnal Hari Ini (Sertakan detail Siswa untuk absensi)
	const rawJurnalHariIni = await prisma.jurnalMengajar.findMany({
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

	// 3. Kalkulasi: Jurnal Terkumpul dan Deduplikasi Jurnal
	const totalJadwal = jadwalBlocks.length;
	const fulfilledBlocks = new Set<string>();
	const jurnalHariIni: any[] = [];
	
	rawJurnalHariIni.forEach((jurnal) => {
		const isKelasReguler = jurnal.jadwal.kelas.nama.startsWith("X");
		const block = jadwalBlocks.find((b) => b.originalIds.includes(jurnal.jadwalId));
		if (block) {
			const blockKey = block.originalIds.join(",");
			if (!fulfilledBlocks.has(blockKey)) {
				fulfilledBlocks.add(blockKey);
				jurnal.jadwal.waktuMulai = block.waktuMulai;
				jurnal.jadwal.waktuSelesai = block.endSesi;
				if (isKelasReguler) jurnalHariIni.push(jurnal);
			}
		} else {
			if (isKelasReguler) jurnalHariIni.push(jurnal);
		}
	});

	const terkumpul = fulfilledBlocks.size;

	// 4. Kalkulasi: Total Siswa Absen & Rekapitulasi SELURUH Kehadiran Siswa
	let totalSiswaAbsen = 0;
	const absenPerKelas: Record<string, number> = {};
	const dataKehadiranSiswa: any[] = []; // <-- Menyimpan Hadir, Sakit, Izin, Alpa

	rawJurnalHariIni.forEach((jurnal) => {
		const namaKelas = jurnal.jadwal.kelas.nama;
		if (namaKelas.startsWith("X") && !absenPerKelas[namaKelas]) absenPerKelas[namaKelas] = 0;

		jurnal.presensi.forEach((p) => {
			// Hanya hitung angka statistik untuk yang bolos/izin (Hanya kelas reguler)
			if (["A", "I", "S"].includes(p.status) && namaKelas.startsWith("X")) {
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
	let jamKosongCount = 0;
	const peringatanJamKosong: any[] = [];

	jadwalBlocks.forEach((block) => {
		const blockKey = block.originalIds.join(",");
		if (!fulfilledBlocks.has(blockKey)) {
			jamKosongCount++;

			let jamSesi = block.waktuMulai;
			if (block.endSesi && block.endSesi !== block.waktuMulai && block.endSesi !== "-") {
				jamSesi = `${block.waktuMulai}-${block.endSesi}`;
			}
			if (!jamSesi || jamSesi === "-") jamSesi = "-";

			peringatanJamKosong.push({
				jam: jamSesi,
				mapel: block.mapel.nama,
				kelas: block.kelas.nama,
				guru: block.guru.user.nama,
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
			peringatanJamKosong={peringatanJamKosong}
			riwayatJurnal={jurnalHariIni}
			dataKehadiranSiswa={dataKehadiranSiswa}
		/>
	);
}
