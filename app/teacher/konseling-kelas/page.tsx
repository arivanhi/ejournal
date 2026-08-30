import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import KonselingKelasClient from "./KonselingKelasClient";

export const dynamic = "force-dynamic";

export default async function KonselingKelasPage({ searchParams }: { searchParams: { ta?: string } }) {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";
	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: sessionValue }, { nama: sessionValue }],
			role: "WALI_KELAS",
		},
		include: {
			guru: {
				include: {
					waliKelasDi: {
						include: {
							kelas: true,
						},
					},
				},
			},
		},
	});

	if (!currentUser || !currentUser.guru || currentUser.guru.waliKelasDi.length === 0) {
		redirect("/teacher/dashboard");
	}

	const kelasIdWali = currentUser.guru.waliKelasDi[0].kelasId;
	const namaKelasWali = currentUser.guru.waliKelasDi[0].kelas.nama;

	// Get all Tahun Ajaran
	const daftarTahunAjaran = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" },
	});

	const aktifTA = daftarTahunAjaran.find((t) => t.isActive);
	const selectedTaId = searchParams.ta || aktifTA?.id;

	if (!selectedTaId) {
		return <div className="p-8">Tidak ada data Tahun Ajaran.</div>;
	}

	// Tarik riwayat jurnal BK khusus untuk kelas perwaliannya
	// Filter by kelasId ATAU filter by sasaranSiswa (karena bisa saja kelasnya beda di Jurnal tapi sasarannya siswa di kelas ini? Tidak, jurnalBK nge-link ke kelas)
	const riwayatKonseling = await prisma.jurnalKonseling.findMany({
		where: {
			tahunAjaranId: selectedTaId,
			sasaranSiswa: {
				some: {
					siswa: {
						riwayatKelas: {
							some: {
								kelasId: kelasIdWali,
								tahunAjaranId: selectedTaId,
							}
						}
					}
				}
			}
		},
		include: {
			guru: {
				include: { user: true }
			},
			sasaranSiswa: {
				include: {
					siswa: {
						include: {
							user: true,
							riwayatKelas: {
								where: { tahunAjaranId: selectedTaId },
								include: { kelas: true }
							}
						},
					},
				},
			},
		},
		orderBy: { tanggal: "desc" },
	});

	return (
		<KonselingKelasClient
			riwayat={riwayatKonseling}
			daftarTahunAjaran={daftarTahunAjaran}
			selectedTaId={selectedTaId}
			namaKelas={namaKelasWali}
		/>
	);
}
