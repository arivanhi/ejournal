import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import JurnalKonselingClient from "./JurnalKonselingClient";

export const dynamic = "force-dynamic";

export default async function JurnalKonselingPage({ searchParams }: { searchParams: { ta?: string } }) {
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

	// Get all Tahun Ajaran
	const daftarTahunAjaran = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" },
	});

	const aktifTA = daftarTahunAjaran.find((t) => t.isActive);
	const selectedTaId = searchParams.ta || aktifTA?.id;

	if (!selectedTaId) {
		return <div className="p-8">Tidak ada data Tahun Ajaran.</div>;
	}

	// Cek apakah guru ini BK atau bukan
	const checkBK = await prisma.jadwalPelajaran.findFirst({
		where: {
			guruId: currentUser.guru.id,
			tahunAjaranId: selectedTaId,
			mapel: {
				OR: [
					{ nama: { contains: "BK" } },
					{ nama: { contains: "Konseling" } },
					{ kode: { contains: "BK" } },
				],
			},
		},
	});

	if (!checkBK) {
		// Jika bukan guru BK, jangan boleh akses
		return (
			<div className="p-8">
				<h2 className="text-2xl font-bold text-red-600">Akses Ditolak</h2>
				<p>Halaman ini khusus untuk Guru Bimbingan Konseling (BK).</p>
			</div>
		);
	}

	// Tarik riwayat jurnal BK
	const riwayatKonseling = await prisma.jurnalKonseling.findMany({
		where: {
			guruId: currentUser.guru.id,
			tahunAjaranId: selectedTaId,
		},
		include: {
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

	// Ambil daftar kelas yang diajarkan oleh guru BK ini
	// (Untuk variabel "semua kelas", bisa query prisma.kelas.findMany() nanti jika di-toggle)
	const jadwalGuru = await prisma.jadwalPelajaran.findMany({
		where: {
			guruId: currentUser.guru.id,
			tahunAjaranId: selectedTaId,
		},
		include: {
			kelas: true,
		},
	});
	
	// Deduplicate kelas
	const kelasUnikMap = new Map();
	jadwalGuru.forEach(j => {
		kelasUnikMap.set(j.kelasId, j.kelas);
	});
	const daftarKelasAssign = Array.from(kelasUnikMap.values());

	return (
		<JurnalKonselingClient
			riwayat={riwayatKonseling}
			daftarTahunAjaran={daftarTahunAjaran}
			selectedTaId={selectedTaId}
			daftarKelas={daftarKelasAssign}
			guruId={currentUser.guru.id}
		/>
	);
}
