import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ensureVirtualJadwal } from "@/lib/virtualJadwal";
import JurnalClient from "./JurnalClient";

export const dynamic = "force-dynamic";

export default async function JurnalPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";
	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: sessionValue }, { nama: sessionValue }],
			role: { in: ["GURU", "WALI_KELAS"] }, // <--- KUNCI PERBAIKAN: Paksa hanya cari akun Guru/Wali
		},
		include: {
			guru: true, // (Bisa ditambahkan include jadwalPelajaran dsb jika halaman itu membutuhkannya)
		},
	});

	if (!currentUser || !currentUser.guru) redirect("/teacher/dashboard");
	const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

	let jadwalSemua: any[] = [];
	
	if (tahunAjaranAktif) {
		await ensureVirtualJadwal(currentUser.guru.id, tahunAjaranAktif.id);

		jadwalSemua = await prisma.jadwalPelajaran.findMany({
			where: {
				guruId: currentUser.guru.id,
				tahunAjaranId: tahunAjaranAktif.id,
				hari: { not: 0 },
				mapel: { isTka: false }
			},
			include: {
				mapel: true,
				// Tarik data kelas beserta daftar siswanya
				kelas: {
					include: {
						riwayatSiswa: {
							where: { tahunAjaranId: tahunAjaranAktif.id },
							include: {
								siswa: { include: { user: true } }, // Ambil nama siswanya
							},
						},
					},
				},
				// Tarik data jurnal beserta riwayat presensinya
				jurnal: {
					include: { presensi: true },
				},
			},
			orderBy: [{ hari: "asc" }, { waktuMulai: "asc" }],
		});

		// Deduplicate in case of race condition creating multiple virtual schedules
		const uniqueJadwal = new Map();
		for (const j of jadwalSemua) {
			const key = `${j.kelasId}-${j.hari}-${j.waktuMulai}`;
			if (!uniqueJadwal.has(key)) {
				uniqueJadwal.set(key, j);
			} else if (j.id < uniqueJadwal.get(key).id) {
				uniqueJadwal.set(key, j);
			}
		}
		jadwalSemua = Array.from(uniqueJadwal.values());

		jadwalSemua = jadwalSemua.filter(j => {
			if (j.waktuMulai === "LIT") {
				return jadwalSemua.some(other => other.kelasId === j.kelasId && other.hari === 2 && other.waktuMulai === "1");
			}
			if (j.waktuMulai === "NUM") {
				return jadwalSemua.some(other => other.kelasId === j.kelasId && other.hari === 4 && other.waktuMulai === "1");
			}
			return true;
		});
	}

	return <JurnalClient jadwalSemua={jadwalSemua} user={currentUser} isWaliKelas={currentUser.role === "WALI_KELAS"} />;
}
