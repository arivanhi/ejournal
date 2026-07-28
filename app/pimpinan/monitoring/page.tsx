import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MonitoringClient from "./MonitoringClient";

export const dynamic = "force-dynamic";

// Fungsi untuk mengekstrak inisial nama
function getInitials(fullName: string) {
	const cleanName = fullName
		.replace(/^(Dr\.|Drs\.|Ir\.|H\.|Hj\.)\s*/i, "")
		.replace(/,.+$/, "")
		.trim();
	const parts = cleanName.split(" ");
	if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
	if (cleanName.length >= 2) return cleanName.substring(0, 2).toUpperCase();
	return "G";
}

// Fungsi Parser Pintar: Memastikan hanya mengambil angka sesi, membuang format waktu (07:00)
const parseSesi = (val: any) => {
	if (val === null || val === undefined) return null;
	const strVal = String(val).trim();
	if (strVal.includes(":")) return null; // Jika mengandung tanda titik dua, abaikan
	const match = strVal.match(/\d+/);
	if (match) {
		const num = Number(match[0]);
		if (num > 0 && num <= 20) return num;
	}
	return null;
};

export default async function MonitoringPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: session.user.name || "" }, { nama: session.user.name || "" }],
			role: { in: ["KEPSEK", "WAKA"] },
		},
	});
	if (!currentUser) redirect("/login");

	const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
	if (!tahunAjaranAktif) return <div>Tidak ada Tahun Ajaran Aktif.</div>;

	const jadwalAll = await prisma.jadwalPelajaran.findMany({
		where: { tahunAjaranId: tahunAjaranAktif.id },
		include: { kelas: true, mapel: true, guru: { include: { user: true } } },
	});

	const jurnalAll = await prisma.jurnalMengajar.findMany({
		where: { jadwal: { tahunAjaranId: tahunAjaranAktif.id } },
	});

	// Kelompokkan Jadwal
	const groups: Record<string, any> = {};
	jadwalAll.forEach((j) => {
		const key = `${j.kelasId}_${j.mapelId}_${j.guruId}`;
		if (!groups[key]) {
			groups[key] = { id: key, kelas: j.kelas, mapel: j.mapel, guru: j.guru, jadwalList: [] };
		}
		groups[key].jadwalList.push(j);
	});

	const today = new Date();
	const startDate = new Date();
	startDate.setDate(today.getDate() - 30);

	const dataMonitoring = Object.values(groups).map((g) => {
		// --- FILTER DATA SAMPAH & DUPLIKAT ---
		// Buang jadwal yang hari=0 (Minggu) atau waktuMulai="-", kecuali dia punya sesi valid
		const cleanJadwalList = g.jadwalList.filter((j: any) => {
			const s = parseSesi(j.jam) ?? parseSesi(j.jamKe) ?? parseSesi(j.sesi) ?? parseSesi(j.waktuMulai);
			if (s !== null) return true;
			if (j.waktuMulai && j.waktuMulai !== "-" && j.waktuMulai.trim() !== "") return true;
			return false;
		});

		// --- SMART GROUPING HARIAN ---
		const jadwalHarian: Record<number, any[]> = {};
		for (let i = 0; i <= 6; i++) {
			const jadwalHariIni = cleanJadwalList.filter((j: any) => j.hari === i);
			if (jadwalHariIni.length === 0) continue;

			// Ekstrak angka sesi
			const withSesi = jadwalHariIni.map((j: any) => ({
				...j,
				actualSesi: parseSesi(j.jam) ?? parseSesi(j.jamKe) ?? parseSesi(j.sesi) ?? parseSesi(j.waktuMulai),
			}));

			// Urutkan. Yang angka sesinya NULL (misal "07:00") ditaruh di paling belakang
			withSesi.sort((a: any, b: any) => {
				if (a.actualSesi === null) return 1;
				if (b.actualSesi === null) return -1;
				return a.actualSesi - b.actualSesi;
			});

			const grouped = [];
			let current: any = null;

			for (let j of withSesi) {
				// Jika jadwal ini tidak punya angka sesi (hanya format waktu/duplikat)
				if (j.actualSesi === null) {
					if (current) {
						// Gabungkan ID-nya ke blok yang sudah ada agar jurnalnya tetap terbaca
						current.jadwalIds.push(j.id);
					} else {
						current = { ...j, jamAwal: null, jamAkhir: null, jadwalIds: [j.id] };
					}
					continue;
				}

				if (!current || current.jamAwal === null) {
					// Jika blok pertama adalah blok tanpa sesi, kita tiban dengan blok bersesi ini
					if (current && current.jamAwal === null) {
						current = { ...j, jamAwal: j.actualSesi, jamAkhir: j.actualSesi, jadwalIds: [...current.jadwalIds, j.id] };
					} else {
						current = { ...j, jamAwal: j.actualSesi, jamAkhir: j.actualSesi, jadwalIds: [j.id] };
					}
				} else {
					// Cek kelanjutan sesi (contoh: 2 ke 3) atau sesi sama persis
					if (current.jamAkhir === j.actualSesi || current.jamAkhir === j.actualSesi - 1) {
						current.jamAkhir = j.actualSesi;
						if (!current.jadwalIds.includes(j.id)) current.jadwalIds.push(j.id);
					} else {
						grouped.push(current);
						current = { ...j, jamAwal: j.actualSesi, jamAkhir: j.actualSesi, jadwalIds: [j.id] };
					}
				}
			}
			if (current) grouped.push(current);
			jadwalHarian[i] = grouped;
		}

		// --- EVALUASI 30 HARI KEBELAKANG ---
		const expectedSessions: any[] = [];

		for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
			const dayIdx = d.getDay();
			const dateStr = d.toISOString().split("T")[0];

			if (!jadwalHarian[dayIdx]) continue;

			jadwalHarian[dayIdx].forEach((block: any) => {
				// Cari jurnal berdasarkan gabungan ID jadwal yang ada di blok ini
				const foundJurnals = jurnalAll.filter(
					(jur) => block.jadwalIds.includes(jur.jadwalId) && jur.tanggal.toISOString().split("T")[0] === dateStr,
				);

				const isTerisi = foundJurnals.length > 0;
				const topik = isTerisi ? foundJurnals.map((j) => j.topik).filter((t) => t)[0] || "-" : "-";

				// Penentuan format teks jam
				let jamStr = "Waktu Fleksibel";
				if (block.jamAwal !== null) {
					jamStr =
						block.jamAwal === block.jamAkhir ? `Jam ke-${block.jamAwal}` : `Jam ke ${block.jamAwal}-${block.jamAkhir}`;
				} else if (block.waktuMulai && block.waktuMulai !== "-") {
					jamStr = block.waktuMulai;
				}

				expectedSessions.push({
					tanggalRaw: new Date(d).getTime(),
					tanggalStr: new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
					jamStr: jamStr,
					topik: topik,
					status: isTerisi ? "Terisi" : "Jam Kosong",
				});
			});
		}

		expectedSessions.sort((a, b) => b.tanggalRaw - a.tanggalRaw);

		const terisi = expectedSessions.filter((s) => s.status === "Terisi").length;
		const kosong = expectedSessions.filter((s) => s.status === "Jam Kosong").length;

		const riwayat = expectedSessions.map((s, idx) => ({
			...s,
			pertemuanKe: expectedSessions.length - idx,
		}));

		const cleanName = g.guru.user.nama
			.replace(/^(Dr\.|Drs\.|Ir\.|H\.|Hj\.)\s*/i, "")
			.replace(/,.+$/, "")
			.trim();
		const parts = cleanName.split(" ");
		const initials =
			parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : cleanName.substring(0, 2).toUpperCase();

		return {
			id: g.id,
			mapelNama: g.mapel.nama,
			kelasNama: g.kelas.nama,
			guruNama: g.guru.user.nama,
			guruNpp: g.guru.user.username || "-",
			guruInitials: initials,
			terisi,
			totalSesi: expectedSessions.length,
			jamKosong: kosong,
			riwayat,
		};
	});

	return <MonitoringClient user={currentUser} dataMonitoring={dataMonitoring} />;
}
