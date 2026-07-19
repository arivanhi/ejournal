import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import RiwayatClient from "./RiwayatClient";

export const dynamic = "force-dynamic";

export default async function RiwayatPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";
	const currentUser = await prisma.user.findFirst({
		where: { OR: [{ username: sessionValue }, { nama: sessionValue }] },
		include: { guru: true },
	});

	if (!currentUser || !currentUser.guru) redirect("/teacher/dashboard");

	// Ambil daftar Tahun Ajaran untuk Filter Dropdown
	const tahunAjaranList = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" },
	});

	// Ambil SEMUA Jadwal Guru ini yang memiliki jurnal berstatus SUBMITTED (Selesai)
	const riwayatJadwal = await prisma.jadwalPelajaran.findMany({
		where: { guruId: currentUser.guru.id },
		include: {
			mapel: true,
			kelas: {
				include: {
					riwayatSiswa: { include: { siswa: { include: { user: true } } } },
				},
			},
			tahunAjaran: true,
			jurnal: {
				where: { status: "SUBMITTED" }, // Hanya ambil jurnal yang sudah selesai diajarkan
				include: { presensi: true },
				orderBy: { tanggal: "asc" },
			},
		},
	});

	// Filter hanya jadwal yang benar-benar punya minimal 1 jurnal selesai
	const jadwalTelahBerjalan = riwayatJadwal.filter((j) => j.jurnal.length > 0);

	return (
		<RiwayatClient
			jadwalSemua={jadwalTelahBerjalan}
			tahunAjaranList={tahunAjaranList}
			user={currentUser}
			isWaliKelas={currentUser.role === "WALI_KELAS"}
		/>
	);
}
