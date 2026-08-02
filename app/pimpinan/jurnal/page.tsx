// app/pimpinan/jurnal/page.tsx
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import JurnalClient from "./JurnalClient";

export const dynamic = "force-dynamic";

function getInitials(fullName: string) {
	const cleanName = fullName
		.replace(/^(Dr\.|Drs\.|Ir\.|H\.|Hj\.)\s*/i, "")
		.replace(/,.+$/, "")
		.trim();
	const parts = cleanName.split(" ");
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	if (cleanName.length >= 2) return cleanName.substring(0, 2).toUpperCase();
	return "G";
}

const parseSesi = (val: any) => {
	if (val === null || val === undefined) return null;
	const strVal = String(val).trim();
	if (strVal.includes(":")) return null;
	const match = strVal.match(/\d+/);
	if (match) {
		const num = Number(match[0]);
		if (num > 0 && num <= 20) return num;
	}
	return null;
};

export default async function JurnalPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: session.user.name || "" }, { nama: session.user.name || "" }],
			role: { in: ["KEPSEK", "WAKA"] },
		},
	});
	if (!currentUser) redirect("/login");

	const semuaTahunAjaran = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" },
	});

	const semuaJadwal = await prisma.jadwalPelajaran.findMany({
		include: {
			// PERBAIKAN: Menarik relasi siswa dan user agar namanya muncul
			kelas: {
				include: {
					riwayatSiswa: {
						include: {
							siswa: { include: { user: true } },
						},
					},
				},
			},
			mapel: true,
			guru: { include: { user: true } },
		},
	});

	const semuaJurnal = await prisma.jurnalMengajar.findMany({
		include: {
			presensi: true,
			jadwal: { include: { tahunAjaran: true } },
		},
	});

	const riwayatJurnalData: any[] = [];
	const groups: Record<string, any> = {};

	semuaJadwal.forEach((jadwal) => {
		const key = `${jadwal.kelasId}_${jadwal.mapelId}_${jadwal.guruId}_${jadwal.tahunAjaranId}`;
		if (!groups[key]) {
			// Filter siswa yang aktif di tahun ajaran ini pada kelas ini
			const muridDiKelas = jadwal.kelas.riwayatSiswa.filter((rs) => rs.tahunAjaranId === jadwal.tahunAjaranId);

			groups[key] = {
				id: key,
				tahunAjaranAsli: semuaTahunAjaran.find((t) => t.id === jadwal.tahunAjaranId)?.nama || "Unknown",
				tahunAjaranId: jadwal.tahunAjaranId,
				mapelNama: jadwal.mapel.nama,
				kelasNama: jadwal.kelas.nama,
				guruNama: jadwal.guru.user.nama,
				guruNpp: jadwal.guru.npp || "-", // PERBAIKAN: Memasukkan NPP
				totalSiswa: muridDiKelas.length,
				muridAktif: muridDiKelas, // Simpan daftar murid untuk diolah nanti
				jadwalList: [],
				jurnals: [],
			};
		}
		groups[key].jadwalList.push(jadwal);
	});

	semuaJurnal.forEach((jurnal) => {
		const key = `${jurnal.jadwal.kelasId}_${jurnal.jadwal.mapelId}_${jurnal.jadwal.guruId}_${jurnal.jadwal.tahunAjaranId}`;
		if (groups[key]) {
			const hadir = jurnal.presensi.filter((p) => p.status === "H").length;
			groups[key].jurnals.push({
				...jurnal,
				hadirSiswa: hadir,
			});
		}
	});

	Object.values(groups).forEach((g) => {
		const terisi = g.jurnals.length;
		const targetSesi = g.jadwalList.length * 16;

		let totalHadir = 0;
		g.jurnals.forEach((j: any) => (totalHadir += j.hadirSiswa));
		const totalPotensiHadir = terisi * g.totalSiswa;
		const persentaseKehadiran = totalPotensiHadir > 0 ? Math.round((totalHadir / totalPotensiHadir) * 100) : 0;
		const ketercapaian = targetSesi > 0 ? Math.min(Math.round((terisi / targetSesi) * 100), 100) : 0;

		const HARI_MAP: Record<number, string> = {
			0: "Minggu",
			1: "Senin",
			2: "Selasa",
			3: "Rabu",
			4: "Kamis",
			5: "Jumat",
			6: "Sabtu",
			7: "Minggu",
		};
		const jadwalByDay: Record<number, number[]> = {};

		g.jadwalList.forEach((j: any) => {
			let sesiNum = parseSesi(j.jam) ?? parseSesi(j.jamKe) ?? parseSesi(j.sesi);
			if (sesiNum === null) sesiNum = parseSesi(j.waktuMulai);

			if (sesiNum !== null) {
				if (!jadwalByDay[j.hari]) jadwalByDay[j.hari] = [];
				if (!jadwalByDay[j.hari].includes(sesiNum)) {
					jadwalByDay[j.hari].push(sesiNum);
				}
			}
		});

		const formattedJadwalArr: string[] = [];
		for (let i = 0; i <= 7; i++) {
			if (jadwalByDay[i] && jadwalByDay[i].length > 0) {
				const jams = jadwalByDay[i].sort((a, b) => a - b);
				const minJam = jams[0];
				const maxJam = jams[jams.length - 1];
				const jamStr = minJam === maxJam ? `Jam ke-${minJam}` : `Jam ke ${minJam}-${maxJam}`;
				const namaHari = HARI_MAP[i] || "Hari ?";
				const formattedStr = `${namaHari}, ${jamStr}`;
				if (!formattedJadwalArr.includes(formattedStr)) {
					formattedJadwalArr.push(formattedStr);
				}
			}
		}

		const jadwalTextFinal = formattedJadwalArr.length > 0 ? formattedJadwalArr.join(" | ") : "Jadwal belum diset";

		const detailSesi = g.jurnals
			.sort((a: any, b: any) => a.tanggal.getTime() - b.tanggal.getTime())
			.map((j: any, idx: number) => ({
				id: j.id,
				pertemuanKe: idx + 1,
				tanggal: j.tanggal.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
				tanggalRaw: j.tanggal.getTime(),
				topik: j.materiBab || "-",
				catatan: j.catatan || "-",
				hadir: j.hadirSiswa,
				status: j.status === "SUBMITTED" ? "TERKIRIM" : "DRAFT",
			}));

		// PERBAIKAN: Membangun Data Rekapitulasi Kehadiran Siswa
		const siswaList = g.muridAktif.map((muridObj: any) => {
			let H = 0,
				S = 0,
				I = 0,
				A = 0;
			// Loop ke semua jurnal (pertemuan) di mapel ini
			g.jurnals.forEach((jurnal: any) => {
				// Cari status presensi murid ini di jurnal tersebut
				const presensiMurid = jurnal.presensi.find((p: any) => p.siswaId === muridObj.siswa.id);
				if (presensiMurid) {
					if (presensiMurid.status === "H") H++;
					else if (presensiMurid.status === "S") S++;
					else if (presensiMurid.status === "I") I++;
					else if (presensiMurid.status === "A") A++;
				}
			});

			const totalAbsenTercatat = H + S + I + A;
			const persentase = totalAbsenTercatat > 0 ? Math.round((H / totalAbsenTercatat) * 100) : 0;

			return {
				id: muridObj.siswa.id,
				nama: muridObj.siswa.user.nama,
				nisn: muridObj.siswa.nisn || "-",
				detailKehadiran: { H, S, I, A },
				persentase,
			};
		});

		// Urutkan siswa berdasarkan abjad (nama)
		siswaList.sort((a: any, b: any) => a.nama.localeCompare(b.nama));

		riwayatJurnalData.push({
			id: g.id,
			tahunAjaranAsli: g.tahunAjaranAsli,
			mapelNama: g.mapelNama,
			kelasNama: g.kelasNama,
			guruNama: g.guruNama,
			guruNpp: g.guruNpp, // Dikirim ke Client
			guruInitials: getInitials(g.guruNama),
			totalSiswa: g.totalSiswa,
			siswaList, // Dikirim ke Client
			jadwalText: jadwalTextFinal,
			terisi,
			targetSesi,
			persentaseKehadiran,
			ketercapaian,
			detailSesi,
		});
	});

	return <JurnalClient user={currentUser} daftarTahunAjaran={semuaTahunAjaran} riwayatData={riwayatJurnalData} />;
}
