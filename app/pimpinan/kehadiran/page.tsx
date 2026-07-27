import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import KehadiranClient from "./KehadiranClient";

export const dynamic = "force-dynamic";

export default async function KehadiranPage() {
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
	if (!tahunAjaranAktif) return <div>Tidak ada Tahun Ajaran Aktif.</div>;

	const today = new Date();
	const currentDayIndex = today.getDay();
	const startOfDay = new Date(today);
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date(today);
	endOfDay.setHours(23, 59, 59, 999);

	const semuaKelasRaw = await prisma.kelas.findMany({
		include: {
			waliKelas: { include: { guru: { include: { user: true } } } },
			riwayatSiswa: {
				where: { tahunAjaranId: tahunAjaranAktif.id },
				include: { siswa: { include: { user: true } } },
			},
			jadwalPelajaran: {
				where: { tahunAjaranId: tahunAjaranAktif.id },
				include: { mapel: true, guru: { include: { user: true } } },
				// PERBAIKAN: Gunakan waktuMulai untuk urutan agar tidak error
				orderBy: [{ hari: "asc" }, { waktuMulai: "asc" }],
			},
		},
		orderBy: { nama: "asc" },
	});

	const presensiHariIni = await prisma.presensiSiswa.findMany({
		where: { waktuScan: { gte: startOfDay, lt: endOfDay } },
		include: { jurnal: { include: { jadwal: true } } },
	});

	const presensiSemesterIni = await prisma.presensiSiswa.findMany({
		where: { jurnal: { jadwal: { tahunAjaranId: tahunAjaranAktif.id } } },
		include: { jurnal: { include: { jadwal: true } } },
	});

	const kelasEnriched = semuaKelasRaw.map((kelas) => {
		const totalSiswa = kelas.riwayatSiswa.length;
		const presensiKelasHariIni = presensiHariIni.filter((p) => p.jurnal.jadwal.kelasId === kelas.id);

		const statusSiswaHariIni: Record<string, string> = {};
		presensiKelasHariIni.forEach((p) => {
			statusSiswaHariIni[p.siswaId] = p.status;
		});

		let H = 0,
			A = 0,
			IS = 0;
		Object.values(statusSiswaHariIni).forEach((status) => {
			if (status === "H") H++;
			else if (status === "A") A++;
			else if (status === "I" || status === "S") IS++;
		});

		const persentaseHariIni = totalSiswa > 0 ? Math.round((H / totalSiswa) * 100) : 0;
		const jadwalHariIniKelas = kelas.jadwalPelajaran.filter((j) => j.hari === currentDayIndex);
		const jurnalKelasHariIni = new Set(presensiKelasHariIni.map((p) => p.jurnalId)).size;

		let statusCard = "Belum";
		if (jadwalHariIniKelas.length > 0) {
			if (jurnalKelasHariIni === 0) statusCard = "Belum";
			else if (jurnalKelasHariIni < jadwalHariIniKelas.length) statusCard = "Proses";
			else statusCard = "Terekap";
		} else {
			statusCard = "Libur/Kosong";
		}

		const presensiKelasSemester = presensiSemesterIni.filter((p) => p.jurnal.jadwal.kelasId === kelas.id);
		const totalSesiSemester = new Set(presensiKelasSemester.map((p) => p.jurnalId)).size;

		const siswaList = kelas.riwayatSiswa.map((rs) => {
			const presensiSiswaIni = presensiKelasSemester.filter((p) => p.siswaId === rs.siswa.id);
			const jmlHadir = presensiSiswaIni.filter((p) => p.status === "H").length;
			const persentase = totalSesiSemester > 0 ? Math.round((jmlHadir / totalSesiSemester) * 100) : 0;

			return {
				id: rs.siswa.id,
				nisn: rs.siswa.nisn || rs.siswa.nis,
				nama: rs.siswa.user?.nama || "Siswa",
				jmlHadir,
				totalSesi: totalSesiSemester,
				persentase,
				statusHariIni: statusSiswaHariIni[rs.siswa.id] || "Belum Ada",
			};
		});

		const rataRataKelas =
			siswaList.length > 0
				? Math.round(siswaList.reduce((acc, curr) => acc + curr.persentase, 0) / siswaList.length)
				: 0;

		// --- ALGORITMA PENGGABUNGAN JADWAL AMAN & PINTAR ---
		const groupedJadwal: any[] = [];

		// Kita proses per hari agar sesi (jam ke-) bisa diurutkan dan digabung dengan benar
		for (let hariIdx = 1; hariIdx <= 6; hariIdx++) {
			const jadwalPerHari = kelas.jadwalPelajaran.filter((j) => j.hari === hariIdx);
			let currentGroup: any = null;
			let fallbackSesi = 1; // Jaga-jaga jika database tidak punya kolom sesi/jamKe

			for (let i = 0; i < jadwalPerHari.length; i++) {
				const j = jadwalPerHari[i] as any;
				// Deteksi otomatis nama kolom sesi yang mungkin digunakan di database Bapak
				const actualSesi = j.sesi ?? j.jamKe ?? j.jam ?? j.slot ?? fallbackSesi;

				if (!currentGroup) {
					currentGroup = { ...j, jamAwal: actualSesi, jamAkhir: actualSesi };
				} else {
					// Jika mapel & guru sama dengan sesi sebelumnya, gabungkan!
					if (currentGroup.mapelId === j.mapelId && currentGroup.guruId === j.guruId) {
						currentGroup.jamAkhir = actualSesi;
						currentGroup.waktuSelesai = j.waktuSelesai;
					} else {
						groupedJadwal.push(currentGroup);
						currentGroup = { ...j, jamAwal: actualSesi, jamAkhir: actualSesi };
					}
				}
				fallbackSesi++;
			}
			if (currentGroup) groupedJadwal.push(currentGroup);
		}

		const jadwalMingguan = groupedJadwal.map((j) => ({
			id: j.id,
			hari: j.hari,
			waktuMulai: j.waktuMulai,
			waktuSelesai: j.waktuSelesai,
			jamStr: j.jamAwal === j.jamAkhir ? `${j.jamAwal}` : `${j.jamAwal}-${j.jamAkhir}`,
			mapel: j.mapel.nama,
			guruNama: j.guru.user.nama,
			guruInitials: j.guru.user.nama.substring(0, 2).toUpperCase(),
		}));

		let namaWaliKelas = "Belum Diatur";
		let nppWaliKelas = "-";

		if (kelas.waliKelas) {
			const wali = Array.isArray(kelas.waliKelas) ? kelas.waliKelas[0] : kelas.waliKelas;
			if (wali?.guru?.user) {
				namaWaliKelas = wali.guru.user.nama;
				nppWaliKelas = wali.guru.user.username || "-";
			}
		}

		return {
			id: kelas.id,
			nama: kelas.nama,
			waliKelas: namaWaliKelas,
			waliKelasNpp: nppWaliKelas,
			totalSiswa,
			kehadiranHariIni: { H, A, IS, persentase: persentaseHariIni },
			statusCard,
			rataRataKelas,
			siswaList,
			jadwalMingguan,
		};
	});

	return <KehadiranClient user={currentUser} tahunAjaran={tahunAjaranAktif} dataKelas={kelasEnriched} />;
}
