import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import PimpinanKonselingClient from "./PimpinanKonselingClient";

export const dynamic = "force-dynamic";

export default async function PimpinanKonselingPage({ searchParams }: { searchParams: { ta?: string } }) {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	// Pastikan rolenya pimpinan (WAKA / KEPSEK)
	const sessionValue = session.user.name || session.user.email || "";
	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: sessionValue }, { nama: sessionValue }],
			role: { in: ["WAKA", "KEPSEK"] },
		},
	});

	if (!currentUser) redirect("/login");

	// Get all Tahun Ajaran
	const daftarTahunAjaran = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" },
	});

	const aktifTA = daftarTahunAjaran.find((t) => t.isActive);
	const selectedTaId = searchParams.ta || aktifTA?.id;

	if (!selectedTaId) {
		return <div className="p-8">Tidak ada data Tahun Ajaran.</div>;
	}

	// Tarik semua riwayat jurnal BK di sekolah
	const riwayatKonseling = await prisma.jurnalKonseling.findMany({
		where: {
			tahunAjaranId: selectedTaId,
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
		<PimpinanKonselingClient
			riwayat={riwayatKonseling}
			daftarTahunAjaran={daftarTahunAjaran}
			selectedTaId={selectedTaId}
		/>
	);
}
