import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RatingClient from "./RatingClient";

export const dynamic = "force-dynamic";

export default async function RatingPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	// Verifikasi KEPSEK / WAKA
	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: session.user.name || "" }, { nama: session.user.name || "" }],
			role: { in: ["KEPSEK", "WAKA"] },
		},
	});
	if (!currentUser) redirect("/login");

	// Fetch semua tahun ajaran untuk opsi filter
	const tahunAjaranList = await prisma.tahunAjaran.findMany({ orderBy: { nama: "desc" } });
	const activeTahun = tahunAjaranList.find((t) => t.isActive);

	// Fetch semua guru aktif beserta jadwalnya
	const semuaGuru = await prisma.guru.findMany({
		where: { status: true },
		include: { 
			user: true,
			jadwalPelajaran: {
				include: { mapel: true, kelas: true }
			}
		},
	});

	// Fetch jumlah siswa aktif tahun ini (yang terdaftar di riwayat kelas tahun aktif)
	let totalSiswaAktif = 0;
	if (activeTahun) {
		const distinctSiswa = await prisma.riwayatKelasSiswa.findMany({
			where: { tahunAjaranId: activeTahun.id },
			select: { siswaId: true },
			distinct: ["siswaId"],
		});
		totalSiswaAktif = distinctSiswa.length;
	}

	// Fetch semua rating
	const semuaRating = await prisma.ratingGuru.findMany({
		include: {
			mapel: true,
			siswa: { include: { user: true } },
		},
	});

	const dataSiswaAktif = totalSiswaAktif;
	const dataTahunAjaran = tahunAjaranList.map(t => ({
		id: t.id,
		nama: t.nama,
		isActive: t.isActive,
		isRatingActive: t.isRatingActive,
	}));
	const dataGuru = semuaGuru.map(g => {
		const mapelPerTA: Record<string, string[]> = {};
		const kelasPerTA: Record<string, string[]> = {};
		
		g.jadwalPelajaran.forEach(j => {
			// Map Mapel
			if (!mapelPerTA[j.tahunAjaranId]) mapelPerTA[j.tahunAjaranId] = [];
			if (!mapelPerTA[j.tahunAjaranId].includes(j.mapel.nama)) {
				mapelPerTA[j.tahunAjaranId].push(j.mapel.nama);
			}

			// Map Kelas
			if (j.kelas) {
				if (!kelasPerTA[j.tahunAjaranId]) kelasPerTA[j.tahunAjaranId] = [];
				if (!kelasPerTA[j.tahunAjaranId].includes(j.kelas.nama)) {
					kelasPerTA[j.tahunAjaranId].push(j.kelas.nama);
				}
			}
		});
		return {
			id: g.id,
			nama: g.user.nama,
			mapelPerTA,
			kelasPerTA,
		};
	});

	return (
		<RatingClient 
			user={currentUser}
			tahunAjaranList={dataTahunAjaran}
			dataGuru={dataGuru}
			semuaRating={semuaRating}
			totalSiswaAktif={dataSiswaAktif}
		/>
	);
}
