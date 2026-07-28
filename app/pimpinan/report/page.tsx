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

	const dataRekap = semuaTahunAjaran.map((ta) => {
		const pdcaRecord = semuaPdca.find((p) => p.tahunAjaranId === ta.id);

		// --- 1. Kalkulasi Top Guru Jam Kosong (Real) ---
		const jadwalTaIni = semuaJadwal.filter((j) => j.tahunAjaranId === ta.id);
		const guruStats: Record<string, { nama: string; mapel: string; totalSesi: number; terisi: number }> = {};

		jadwalTaIni.forEach((j) => {
			if (!guruStats[j.guruId]) {
				guruStats[j.guruId] = { nama: j.guru.user.nama, mapel: j.mapel.nama, totalSesi: 16, terisi: 0 }; // Asumsi 16 pertemuan
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
			.slice(0, 3); // Ambil 3 Teratas

		// --- 2. Kalkulasi Top Kelas Alpha (Real) ---
		const kelasStats: Record<string, { nama: string; totalHadir: number; totalAlpha: number }> = {};

		// Asumsi kasar untuk mendapatkan nama wali (karena di relasi sebelumnya lebih rumit, kita ambil id kelas saja)
		semuaPresensi.forEach((p) => {
			const jurRef = semuaJurnal.find((j) => j.id === p.jurnalId);
			if (jurRef) {
				const jadwalRef = jadwalTaIni.find((j) => j.id === jurRef.jadwalId);
				if (jadwalRef) {
					if (!kelasStats[jadwalRef.kelasId]) {
						kelasStats[jadwalRef.kelasId] = { nama: jadwalRef.kelas.nama, totalHadir: 0, totalAlpha: 0 };
					}
					if (p.status === "A") kelasStats[jadwalRef.kelasId].totalAlpha += 1;
					if (p.status === "H") kelasStats[jadwalRef.kelasId].totalHadir += 1;
				}
			}
		});

		const topKelasReal = Object.values(kelasStats)
			.map((k) => {
				const total = k.totalAlpha + k.totalHadir;
				return {
					nama: k.nama,
					wali: "Wali Kelas", // Disimplifikasi
					alpha: total > 0 ? Math.round((k.totalAlpha / total) * 100) : 0,
				};
			})
			.sort((a, b) => b.alpha - a.alpha)
			.slice(0, 3);

		const defaultPdca = {
			id: `temp-${ta.id}`,
			status: "DRAFT",
			actRekomendasi: "Belum ada rekomendasi yang ditulis untuk semester ini.",
			doImplementasi: [
				{ aspek: "Sistem", temuan: "Data belum diisi.", aksi: "Harap isi rencana aksi.", status: "Planning" },
			],
		};

		return {
			tahunAjaranId: ta.id,
			tahunAjaranNama: ta.nama,
			totalGuru,
			totalSiswa,
			topGuru: topGuruReal,
			topKelas: topKelasReal,
			distribusi: { dinas: 45, sakit: 30, tanpaKeterangan: 25 },
			pdca: pdcaRecord
				? {
						id: pdcaRecord.id,
						judul: pdcaRecord.judul,
						status: pdcaRecord.status,
						actRekomendasi: pdcaRecord.actRekomendasi || defaultPdca.actRekomendasi,
						doImplementasi: pdcaRecord.doImplementasi ? JSON.parse(JSON.stringify(pdcaRecord.doImplementasi)) : [],
					}
				: defaultPdca,
		};
	});

	return <ReportClient user={currentUser} dataRekap={dataRekap} />;
}
