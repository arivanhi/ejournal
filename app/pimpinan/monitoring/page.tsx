import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import MonitoringClient from "./MonitoringClient";

export const dynamic = "force-dynamic";

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
		// --- SMART GROUPING HARIAN ---
		const jadwalHarian: Record<number, any[]> = {};
		for (let i = 0; i <= 6; i++) {
			const jadwalHariIni = g.jadwalList
				.filter((j: any) => j.hari === i)
				.sort((a: any, b: any) => (a.jam || 0) - (b.jam || 0));

			if (jadwalHariIni.length === 0) continue;

			const grouped = [];
			let current: any = null;
			let fallbackJam = 1;

			for (let j of jadwalHariIni) {
				const actualJam = j.jam ?? fallbackJam;
				if (!current) {
					current = { ...j, jamAwal: actualJam, jamAkhir: actualJam, jadwalIds: [j.id] };
				} else {
					if (current.jamAkhir === actualJam - 1) {
						current.jamAkhir = actualJam;
						current.jadwalIds.push(j.id);
					} else {
						grouped.push(current);
						current = { ...j, jamAwal: actualJam, jamAkhir: actualJam, jadwalIds: [j.id] };
					}
				}
				fallbackJam++;
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
				const foundJurnals = jurnalAll.filter(
					(jur) => block.jadwalIds.includes(jur.jadwalId) && jur.tanggal.toISOString().split("T")[0] === dateStr,
				);

				const isTerisi = foundJurnals.length > 0;
				const topik = isTerisi ? foundJurnals.map((j) => j.topik).filter((t) => t)[0] || "-" : "-";

				expectedSessions.push({
					tanggalRaw: new Date(d).getTime(), // Untuk fungsi Sorting di Client
					tanggalStr: new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
					jamStr:
						block.jamAwal === block.jamAkhir ? `Jam ke-${block.jamAwal}` : `Jam ke ${block.jamAwal}-${block.jamAkhir}`,
					topik: topik,
					status: isTerisi ? "Terisi" : "Jam Kosong",
				});
			});
		}

		// Urutkan dari yang terbaru (Default)
		expectedSessions.sort((a, b) => b.tanggalRaw - a.tanggalRaw);

		const terisi = expectedSessions.filter((s) => s.status === "Terisi").length;
		const kosong = expectedSessions.filter((s) => s.status === "Jam Kosong").length;

		const riwayat = expectedSessions.map((s, idx) => ({
			...s,
			pertemuanKe: expectedSessions.length - idx,
		}));

		return {
			id: g.id,
			mapelNama: g.mapel.nama,
			kelasNama: g.kelas.nama,
			guruNama: g.guru.user.nama,
			guruNpp: g.guru.user.username || "-", // Ambil NPP
			guruInitials: g.guru.user.nama.substring(0, 2).toUpperCase(),
			terisi,
			totalSesi: expectedSessions.length,
			jamKosong: kosong,
			riwayat,
		};
	});

	return <MonitoringClient user={currentUser} dataMonitoring={dataMonitoring} />;
}
