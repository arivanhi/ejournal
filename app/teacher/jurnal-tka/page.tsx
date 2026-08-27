import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import JurnalTkaClient from "./JurnalTkaClient";

export const dynamic = "force-dynamic";

export default async function JurnalTkaPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";
	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: sessionValue }, { nama: sessionValue }],
			role: { in: ["GURU", "WALI_KELAS"] },
		},
		include: {
			guru: true,
		},
	});

	if (!currentUser || !currentUser.guru) redirect("/teacher/dashboard");
	const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

	// AMBIL JADWAL TKA (hari: 0)
	const jadwalTka = tahunAjaranAktif
		? await prisma.jadwalPelajaran.findMany({
				where: {
					guruId: currentUser.guru.id,
					tahunAjaranId: tahunAjaranAktif.id,
					hari: 0, // KUNCI UTAMA: Jadwal TKA memiliki hari = 0
				},
				include: {
					mapel: true,
					// Tarik data kelas beserta daftar siswanya (hanya siswa TKA)
					kelas: {
						include: {
							riwayatSiswa: {
								where: { tahunAjaranId: tahunAjaranAktif.id, isTka: true },
								include: {
									siswa: { include: { user: true } }, 
								},
							},
						},
					},
					// Tarik data jurnal beserta riwayat presensinya
					jurnal: {
						include: { presensi: true },
						orderBy: { tanggal: "desc" }
					},
				},
			})
		: [];

	return <JurnalTkaClient jadwalTka={jadwalTka} user={currentUser} />;
}
