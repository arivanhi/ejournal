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
	today.setHours(23, 59, 59, 999);

	const dataMonitoring = Object.values(groups).map((g) => {
		// --- FILTER DATA SAMPAH & DUPLIKAT ---
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

			const withSesi = jadwalHariIni.map((j: any) => ({
				...j,
				actualSesi: parseSesi(j.jam) ?? parseSesi(j.jamKe) ?? parseSesi(j.sesi) ?? parseSesi(j.waktuMulai),
			}));

			withSesi.sort((a: any, b: any) => {
				if (a.actualSesi === null) return 1;
				if (b.actualSesi === null) return -1;
				return a.actualSesi - b.actualSesi;
			});

			const grouped = [];
			let current: any = null;

			for (let j of withSesi) {
				if (j.actualSesi === null) {
					if (current) {
						current.jadwalIds.push(j.id);
					} else {
						current = { ...j, jamAwal: null, jamAkhir: null, jadwalIds: [j.id] };
					}
					continue;
				}

				if (!current || current.jamAwal === null) {
					if (current && current.jamAwal === null) {
						current = { ...j, jamAwal: j.actualSesi, jamAkhir: j.actualSesi, jadwalIds: [...current.jadwalIds, j.id] };
					} else {
						current = { ...j, jamAwal: j.actualSesi, jamAkhir: j.actualSesi, jadwalIds: [j.id] };
					}
				} else {
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

		// --- AMBIL JURNAL ACTUAL ---
		const jurnalsForGroup = jurnalAll.filter((jur) => g.jadwalList.some((j: any) => j.id === jur.jadwalId));

		let startDate = new Date();
		if (jurnalsForGroup.length > 0) {
			const firstDate = Math.min(...jurnalsForGroup.map((j) => j.tanggal.getTime()));
			startDate = new Date(firstDate);
		} else {
			startDate.setDate(today.getDate() - 7);
		}
		startDate.setHours(0, 0, 0, 0);

		const expectedSessions: any[] = [];
		const processedJournalDates = new Set();

		jurnalsForGroup.forEach((jur) => {
			const dateStr = jur.tanggal.toISOString().split("T")[0];
			processedJournalDates.add(dateStr);

			let jamStr = "Waktu Fleksibel";
			let foundBlock = null;
			for (const day in jadwalHarian) {
				const blocks = jadwalHarian[day];
				const match = blocks.find((b: any) => b.jadwalIds.includes(jur.jadwalId));
				if (match) {
					foundBlock = match;
					break;
				}
			}

			if (foundBlock && foundBlock.jamAwal !== null) {
				jamStr =
					foundBlock.jamAwal === foundBlock.jamAkhir
						? `Jam ke-${foundBlock.jamAwal}`
						: `Jam ke ${foundBlock.jamAwal}-${foundBlock.jamAkhir}`;
			}

			const waktuMengajarStr = jur.waktuMulai && jur.waktuSelesai ? `${jur.waktuMulai} - ${jur.waktuSelesai} WIB` : "-";

			expectedSessions.push({
				tanggalRaw: jur.tanggal.getTime(),
				tanggalStr: jur.tanggal.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
				jamStr: jamStr,
				waktuMengajar: waktuMengajarStr,
				topik: jur.materiBab || "-",
				topikTugas: jur.tugas || "-",
				status: "Terisi",
			});
		});

		// TAMBAHKAN JAM KOSONG
		for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
			const dayIdx = d.getDay();
			const dateStr = d.toISOString().split("T")[0];

			if (jadwalHarian[dayIdx] && !processedJournalDates.has(dateStr)) {
				jadwalHarian[dayIdx].forEach((block: any) => {
					let jamStr = "Waktu Fleksibel";
					if (block.jamAwal !== null) {
						jamStr =
							block.jamAwal === block.jamAkhir
								? `Jam ke-${block.jamAwal}`
								: `Jam ke ${block.jamAwal}-${block.jamAkhir}`;
					}

					expectedSessions.push({
						tanggalRaw: new Date(d).getTime(),
						tanggalStr: new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
						jamStr: jamStr,
						waktuMengajar: "-",
						topik: "-",
						topikTugas: "-",
						status: "Jam Kosong",
					});
				});
			}
		}

		// Urutkan dari yang paling baru untuk penomoran yang tepat
		expectedSessions.sort((a, b) => b.tanggalRaw - a.tanggalRaw);

		const terisi = expectedSessions.filter((s) => s.status === "Terisi").length;
		const kosong = expectedSessions.filter((s) => s.status === "Jam Kosong").length;

		// Beri nomor pertemuan
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
			// KUNCI PERBAIKAN: Menambahkan tahunAjaranNama agar terbaca di Client
			tahunAjaranNama: tahunAjaranAktif.nama,
		};
	});

	return <MonitoringClient user={currentUser} dataMonitoring={dataMonitoring} />;
}
