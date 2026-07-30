import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ReportClient from "./ReportClient";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: session.user.name || "" }, { nama: session.user.name || "" }],
			role: { in: ["KEPSEK", "WAKA"] },
		},
	});
	if (!currentUser) redirect("/login");

	const semuaTahunAjaran = await prisma.tahunAjaran.findMany({ orderBy: { nama: "desc" } });
	const semuaPdca = await prisma.laporanPdca.findMany({ include: { pembuat: true } });

	// --- AMBIL DATA REAL UNTUK AGREGASI ---
	const totalGuru = await prisma.guru.count();
	const totalSiswa = await prisma.siswa.count();

	const semuaJadwal = await prisma.jadwalPelajaran.findMany({
		include: { mapel: true, guru: { include: { user: true } }, kelas: true },
	});

	const semuaJurnal = await prisma.jurnalMengajar.findMany();
	const semuaPresensi = await prisma.presensiSiswa.findMany();

	const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

	const dataRekap = semuaTahunAjaran.map((ta) => {
		const pdcaRecord = semuaPdca.find((p) => p.tahunAjaranId === ta.id);
		const jadwalTaIni = semuaJadwal.filter((j) => j.tahunAjaranId === ta.id);

		// --- 1. Kalkulasi Top Guru Jam Kosong ---
		const guruStats: Record<string, { nama: string; mapel: string; totalSesi: number; terisi: number }> = {};
		jadwalTaIni.forEach((j) => {
			if (!guruStats[j.guruId]) {
				guruStats[j.guruId] = { nama: j.guru.user.nama, mapel: j.mapel.nama, totalSesi: 16, terisi: 0 };
			} else {
				guruStats[j.guruId].totalSesi += 16;
			}
		});

		semuaJurnal.forEach((jur) => {
			const jadwalRef = jadwalTaIni.find((j) => j.id === jur.jadwalId);
			if (jadwalRef && guruStats[jadwalRef.guruId]) {
				guruStats[jadwalRef.guruId].terisi += 1;
			}
		});

		const topGuruReal = Object.values(guruStats)
			.map((g) => ({ ...g, jamKosong: Math.max(0, g.totalSesi - g.terisi) }))
			.sort((a, b) => b.jamKosong - a.jamKosong)
			.slice(0, 3);

		// --- 2. Kalkulasi Top Kelas Alpha & Distribusi Alasan Absen ---
		const kelasStats: Record<string, { nama: string; totalHadir: number; totalAlpha: number }> = {};
		let H = 0,
			I = 0,
			S = 0,
			A = 0;

		// --- 3. Kalkulasi Tren Bulanan ---
		const trenMap: Record<number, { hadir: number; total: number; jurnal: number; target: number }> = {};

		semuaPresensi.forEach((p) => {
			const jurRef = semuaJurnal.find((j) => j.id === p.jurnalId);
			if (jurRef) {
				const jadwalRef = jadwalTaIni.find((j) => j.id === jurRef.jadwalId);
				if (jadwalRef) {
					// Kelas Stats
					if (!kelasStats[jadwalRef.kelasId]) {
						kelasStats[jadwalRef.kelasId] = { nama: jadwalRef.kelas.nama, totalHadir: 0, totalAlpha: 0 };
					}
					if (p.status === "A") {
						kelasStats[jadwalRef.kelasId].totalAlpha += 1;
						A++;
					} else if (p.status === "H") {
						kelasStats[jadwalRef.kelasId].totalHadir += 1;
						H++;
					} else if (p.status === "I") {
						I++;
					} else if (p.status === "S") {
						S++;
					}

					// Tren Data Mapping
					const monthIdx = jurRef.tanggal.getMonth();
					if (!trenMap[monthIdx]) {
						trenMap[monthIdx] = { hadir: 0, total: 0, jurnal: 0, target: jadwalTaIni.length * 4 }; // Estimasi 4 minggu/bulan
					}
					trenMap[monthIdx].total++;
					if (p.status === "H") trenMap[monthIdx].hadir++;
				}
			}
		});

		// Hitung Jurnal per Bulan
		semuaJurnal.forEach((jur) => {
			const jadwalRef = jadwalTaIni.find((j) => j.id === jur.jadwalId);
			if (jadwalRef) {
				const monthIdx = jur.tanggal.getMonth();
				if (!trenMap[monthIdx]) trenMap[monthIdx] = { hadir: 0, total: 0, jurnal: 0, target: jadwalTaIni.length * 4 };
				trenMap[monthIdx].jurnal++;
			}
		});

		const topKelasReal = Object.values(kelasStats)
			.map((k) => {
				const total = k.totalAlpha + k.totalHadir;
				return {
					nama: k.nama,
					alpha: total > 0 ? Math.round((k.totalAlpha / total) * 100) : 0,
				};
			})
			.sort((a, b) => b.alpha - a.alpha)
			.slice(0, 3);

		const totalAbsen = H + I + S + A;
		const distribusiReal = {
			hadir: totalAbsen > 0 ? Math.round((H / totalAbsen) * 100) : 0,
			izin: totalAbsen > 0 ? Math.round((I / totalAbsen) * 100) : 0,
			sakit: totalAbsen > 0 ? Math.round((S / totalAbsen) * 100) : 0,
			alpha: totalAbsen > 0 ? Math.round((A / totalAbsen) * 100) : 0,
		};

		const trenDataReal = Object.keys(trenMap)
			.sort((a, b) => parseInt(a) - parseInt(b))
			.map((mIdx) => {
				const data = trenMap[parseInt(mIdx)];
				return {
					bulan: months[parseInt(mIdx)],
					pctKehadiran: data.total > 0 ? Math.round((data.hadir / data.total) * 100) : 0,
					pctJurnal: data.target > 0 ? Math.min(100, Math.round((data.jurnal / data.target) * 100)) : 0,
				};
			});

		const defaultPdca = {
			id: `temp-${ta.id}`,
			status: "DRAFT",
			actRekomendasi: "",
			doImplementasi: [],
		};

		return {
			tahunAjaranId: ta.id,
			tahunAjaranNama: ta.nama,
			totalGuru,
			totalSiswa,
			topGuru: topGuruReal,
			topKelas: topKelasReal,
			distribusi: distribusiReal,
			trenKinerja: trenDataReal,
			pdca: pdcaRecord
				? {
						id: pdcaRecord.id,
						judul: pdcaRecord.judul,
						status: pdcaRecord.status,
						actRekomendasi: pdcaRecord.actRekomendasi || "",
						doImplementasi: pdcaRecord.doImplementasi ? JSON.parse(JSON.stringify(pdcaRecord.doImplementasi)) : [],
					}
				: defaultPdca,
		};
	});

	return <ReportClient user={currentUser} dataRekap={dataRekap} />;
}
