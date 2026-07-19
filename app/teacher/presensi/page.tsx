import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PresensiClient from "./PresensiClient";

export const dynamic = "force-dynamic";

export default async function PresensiQRPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";
	const currentUser = await prisma.user.findFirst({
		where: { OR: [{ username: sessionValue }, { nama: sessionValue }] },
		include: { guru: true },
	});

	if (!currentUser || !currentUser.guru) redirect("/teacher/dashboard");

	const today = new Date();
	const startOfDay = new Date(today);
	startOfDay.setHours(0, 0, 0, 0);
	const endOfDay = new Date(today);
	endOfDay.setHours(23, 59, 59, 999);

	// ==============================================================
	// FITUR AUTO-CLOSE JAM 4 SORE (16:00)
	// Jika waktu di server sudah jam 16:00 atau lebih,
	// tutup semua akses pemindaian QR hari ini.
	// ==============================================================
	if (today.getHours() >= 16) {
		await prisma.jurnalMengajar.updateMany({
			where: {
				tanggal: { gte: startOfDay, lte: endOfDay },
				qrToken: { not: null },
				jadwal: { guruId: currentUser.guru.id },
			},
			data: { qrToken: null },
		});
	}

	// Ambil Jurnal yang QR-nya aktif HARI INI
	const activeJurnals = await prisma.jurnalMengajar.findMany({
		where: {
			tanggal: { gte: startOfDay, lte: endOfDay },
			qrToken: { not: null },
			jadwal: { guruId: currentUser.guru.id },
		},
		include: {
			jadwal: {
				include: {
					mapel: true,
					kelas: {
						include: {
							riwayatSiswa: { include: { siswa: { include: { user: true } } } },
						},
					},
				},
			},
			presensi: {
				orderBy: { waktuScan: "desc" },
			},
		},
	});

	return (
		<PresensiClient activeSessions={activeJurnals} user={currentUser} isWaliKelas={currentUser.role === "WALI_KELAS"} />
	);
}
