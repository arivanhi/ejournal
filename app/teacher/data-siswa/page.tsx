import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DataSiswaClient from "./DataSiswaClient";

export const dynamic = "force-dynamic";

export default async function DataSiswaWaliPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";

	// 1. Ambil data guru dan relasi tabel perantaranya
	const currentUser = await prisma.user.findFirst({
		where: { OR: [{ username: sessionValue }, { nama: sessionValue }] },
		include: { guru: { include: { waliKelasDi: true } } },
	});

	if (!currentUser || currentUser.role !== "WALI_KELAS" || !currentUser.guru?.waliKelasDi) {
		redirect("/teacher/dashboard");
	}

	// 2. Ekstrak baris data dari tabel perantara
	const relasiWali = currentUser.guru.waliKelasDi;
	const dataWali = Array.isArray(relasiWali) ? relasiWali[0] : relasiWali;

	// Pastikan kelasId benar-benar ada di baris tersebut
	if (!dataWali || !dataWali.kelasId) {
		redirect("/teacher/dashboard");
	}

	// 3. Ambil detail 'Kelas' yang sebenarnya agar nama kelas (misal: X MIPA 1) bisa tampil di UI
	const kelasBinaan = await prisma.kelas.findUnique({
		where: { id: dataWali.kelasId },
	});

	if (!kelasBinaan) redirect("/teacher/dashboard");

	// 4. Cari siswa berdasarkan kelasId yang valid
	const tahunAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

	let siswaList: any[] = [];
	if (tahunAktif) {
		const riwayat = await prisma.riwayatKelasSiswa.findMany({
			where: {
				kelasId: dataWali.kelasId, // <-- INI KUNCI PERBAIKANNYA
				tahunAjaranId: tahunAktif.id,
			},
			include: { siswa: { include: { user: true } } },
		});
		siswaList = riwayat.map((r) => r.siswa);
	}

	return <DataSiswaClient kelasData={kelasBinaan} siswaAwal={siswaList} guruName={currentUser.nama} />;
}
