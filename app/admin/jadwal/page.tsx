// app/admin/jadwal/page.tsx

import { prisma } from "@/lib/prisma";
import JadwalClient from "./JadwalClient";

export const dynamic = "force-dynamic";

// Tambahkan searchParams untuk menangkap filter URL (contoh: ?tahunId=xxx)
export default async function JadwalPage({
	searchParams,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
	// Await searchParams di Next.js 15+
	const resolvedParams = await searchParams;
	const urlTahunId = typeof resolvedParams.tahunId === "string" ? resolvedParams.tahunId : null;

	// 1. Ambil SELURUH daftar Tahun Ajaran untuk mengisi Dropdown Filter
	const semuaTahunAjaran = await prisma.tahunAjaran.findMany({
		orderBy: { nama: "desc" },
	});

	// 2. Tentukan Tahun Ajaran mana yang sedang dilihat:
	// Jika ada ID di URL, gunakan itu. Jika tidak, gunakan yang isActive: true.
	let tahunAjaranTerpilih;
	if (urlTahunId) {
		tahunAjaranTerpilih = semuaTahunAjaran.find((t) => t.id === urlTahunId);
	} else {
		tahunAjaranTerpilih = semuaTahunAjaran.find((t) => t.isActive);
	}

	// Jika database benar-benar kosong, cegah error
	if (!tahunAjaranTerpilih && semuaTahunAjaran.length > 0) {
		tahunAjaranTerpilih = semuaTahunAjaran[0];
	}

	// 3. Ambil Kelas + Hitung Siswa + Nama Wali Kelas (Berdasarkan Tahun yang dipilih)
	const kelasListDb = await prisma.kelas.findMany({
		orderBy: { nama: "asc" },
		include: {
			riwayatSiswa: tahunAjaranTerpilih ? { where: { tahunAjaranId: tahunAjaranTerpilih.id } } : false,
			waliKelas: { include: { guru: { include: { user: true } } } },
		},
	});

	const kelasListFormatted = kelasListDb.map((k) => ({
		id: k.id,
		nama: k.nama,
		jumlahSiswa: k.riwayatSiswa ? k.riwayatSiswa.length : 0,
		waliKelas: k.waliKelas[0]?.guru?.user?.nama || "-",
	}));

	// 4. Ambil "Pemetaan Dasar" (Hari = 0)
	const pemetaanDasarDb = tahunAjaranTerpilih
		? await prisma.jadwalPelajaran.findMany({
				where: {
					tahunAjaranId: tahunAjaranTerpilih.id,
					hari: 0,
				},
				include: { guru: { include: { user: true } }, mapel: true },
			})
		: [];

	const pemetaanDasar = pemetaanDasarDb.map((p) => ({
		kelasId: p.kelasId,
		mapelId: p.mapelId,
		mapelNama: p.mapel.nama,
		guruId: p.guruId,
		guruNama: p.guru.user.nama,
	}));

	// 5. Ambil Jadwal Aktual (Hari != 0)
	const jadwalDb = tahunAjaranTerpilih
		? await prisma.jadwalPelajaran.findMany({
				where: {
					tahunAjaranId: tahunAjaranTerpilih.id,
					hari: { notIn: [0] },
				},
				include: { guru: { include: { user: true } }, mapel: true },
			})
		: [];

	const mapHariText = ["", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
	const jadwalExisting = jadwalDb.map((j) => ({
		...j,
		hari: mapHariText[j.hari] || "Senin",
	}));

	return (
		<JadwalClient
			kelasList={kelasListFormatted}
			pemetaanDasar={pemetaanDasar}
			jadwalExisting={jadwalExisting}
			// --- KUNCI: Lempar data Tahun Ajaran ke Client ---
			daftarTahunAjaran={semuaTahunAjaran}
			tahunAjaranAktifId={tahunAjaranTerpilih?.id || ""}
		/>
	);
}
