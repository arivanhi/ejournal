import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import KehadiranClient from "./KehadiranClient";

export const dynamic = "force-dynamic";

// Fungsi untuk mengekstrak inisial nama wali kelas
function getInitials(fullName: string) {
	if (!fullName) return "W";
	const cleanName = fullName
		.replace(/^(Dr\.|Drs\.|Ir\.|H\.|Hj\.)\s*/i, "")
		.replace(/,.+$/, "")
		.trim();
	const parts = cleanName.split(" ");
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	if (cleanName.length >= 2) return cleanName.substring(0, 2).toUpperCase();
	return "W";
}

// Fungsi Parser Pintar: Memastikan hanya mengambil angka sesi, membuang format waktu (07:00)
const parseSesi = (val: any) => {
	if (val === null || val === undefined) return null;
	const strVal = String(val).trim();
	if (strVal.includes(":")) return null; // Jika mengandung tanda titik dua, abaikan (bukan angka sesi)
	const match = strVal.match(/\d+/);
	if (match) {
		const num = Number(match[0]);
		if (num > 0 && num <= 20) return num;
	}
	return null;
};

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
		where: { nama: { startsWith: "X" } },
		include: {
			waliKelas: { include: { guru: { include: { user: true } } } },
			riwayatSiswa: {
				where: { tahunAjaranId: tahunAjaranAktif.id },
				include: { siswa: { include: { user: true } } },
			},
			jadwalPelajaran: {
				where: { tahunAjaranId: tahunAjaranAktif.id },
				include: { mapel: true, guru: { include: { user: true } } },
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
			const currentStatus = statusSiswaHariIni[p.siswaId];
			let statusToUse = p.status;
			if (p.isDispensasi) statusToUse = "H";
			
			const priority = { A: 4, S: 3, I: 2, H: 1 };
			const currentPriority = currentStatus ? priority[currentStatus as keyof typeof priority] || 0 : 0;
			const newPriority = priority[statusToUse as keyof typeof priority] || 0;
			
			if (!currentStatus || newPriority > currentPriority) {
				statusSiswaHariIni[p.siswaId] = statusToUse;
			}
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
		const dateSet = new Set<string>();
		presensiKelasSemester.forEach((p) => {
			if (p.jurnal.tanggal) dateSet.add(p.jurnal.tanggal.toISOString().split("T")[0]);
		});
		const totalHariSemester = dateSet.size;

		// PERBAIKAN: Tambahkan .sort() di akhir map untuk mengurutkan A-Z berdasarkan nama siswa
		const siswaList = kelas.riwayatSiswa
			.map((rs) => {
				const presensiSiswaIni = presensiKelasSemester.filter((p) => p.siswaId === rs.siswa.id);
				
				const perHariMap = new Map<string, string>();
				presensiSiswaIni.forEach((p) => {
					if (!p.jurnal.tanggal) return;
					const dateStr = p.jurnal.tanggal.toISOString().split("T")[0];
					const currentStatus = perHariMap.get(dateStr);
					
					let statusToUse = p.status;
					if (p.isDispensasi) statusToUse = "H";
					
					const priority = { A: 4, S: 3, I: 2, H: 1 };
					const currentPriority = currentStatus ? priority[currentStatus as keyof typeof priority] || 0 : 0;
					const newPriority = priority[statusToUse as keyof typeof priority] || 0;
					
					if (!currentStatus || newPriority > currentPriority) {
						perHariMap.set(dateStr, statusToUse);
					}
				});

				let countH = 0, countS = 0, countI = 0, countA = 0;
				perHariMap.forEach((status) => {
					if (status === "H") countH++;
					else if (status === "S") countS++;
					else if (status === "I") countI++;
					else if (status === "A") countA++;
				});

				const persentase = totalHariSemester > 0 ? Math.round((countH / totalHariSemester) * 100) : 0;

				return {
					id: rs.siswa.id,
					nisn: rs.siswa.nis,
					nama: rs.siswa.user?.nama || "Siswa",
					jmlHadir: countH,
					detailKehadiran: { H: countH, S: countS, I: countI, A: countA },
					totalSesi: totalHariSemester,
					persentase,
					statusHariIni: statusSiswaHariIni[rs.siswa.id] || "Belum Ada",
				};
			})
			.sort((a, b) => a.nama.localeCompare(b.nama));

		const rataRataKelas =
			siswaList.length > 0
				? Math.round(siswaList.reduce((acc, curr) => acc + curr.persentase, 0) / siswaList.length)
				: 0;

		// --- ALGORITMA SMART GROUPING JADWAL ---
		const groupedJadwal: any[] = [];

		for (let hariIdx = 0; hariIdx <= 6; hariIdx++) {
			const jadwalPerHari = kelas.jadwalPelajaran.filter((j) => j.hari === hariIdx);
			if (jadwalPerHari.length === 0) continue;

			const groupsMap = new Map();
			jadwalPerHari.forEach((j) => {
				const key = `${j.mapelId}_${j.guruId}`;
				if (!groupsMap.has(key)) groupsMap.set(key, []);
				groupsMap.get(key).push(j);
			});

			const tempDayGroups: any[] = [];

			groupsMap.forEach((jList, key) => {
				const sesiSet = new Set<number>();

				jList.forEach((j: any) => {
					const s = parseSesi(j.jam) ?? parseSesi(j.jamKe) ?? parseSesi(j.sesi) ?? parseSesi(j.waktuMulai);
					if (s !== null) sesiSet.add(s);
				});

				const sesiArr = Array.from(sesiSet).sort((a, b) => a - b);
				let jamStr = "";
				let minJamOrder = 99;

				if (sesiArr.length > 0) {
					const minJam = sesiArr[0];
					const maxJam = sesiArr[sesiArr.length - 1];
					jamStr = minJam === maxJam ? `${minJam}` : `${minJam}-${maxJam}`;
					minJamOrder = minJam;
				} else {
					const fallbackTime = jList.find((j: any) => j.waktuMulai)?.waktuMulai;
					jamStr = fallbackTime ? String(fallbackTime) : "?";
				}

				tempDayGroups.push({
					id: jList[0].id,
					hari: hariIdx,
					jamStr: jamStr,
					mapel: jList[0].mapel.nama,
					guruNama: jList[0].guru.user.nama,
					guruInitials: getInitials(jList[0].guru.user.nama),
					minJamOrder: minJamOrder,
				});
			});

			tempDayGroups.sort((a, b) => a.minJamOrder - b.minJamOrder);
			groupedJadwal.push(...tempDayGroups);
		}

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
			waliKelasInitials: getInitials(namaWaliKelas),
			waliKelasNpp: nppWaliKelas,
			totalSiswa,
			kehadiranHariIni: { H, A, IS, persentase: persentaseHariIni },
			statusCard,
			rataRataKelas,
			siswaList,
			jadwalMingguan: groupedJadwal,
		};
	});

	return <KehadiranClient user={currentUser} tahunAjaran={tahunAjaranAktif} dataKelas={kelasEnriched} />;
}
