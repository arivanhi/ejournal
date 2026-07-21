import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";

	const currentUser = await prisma.user.findFirst({
		where: { OR: [{ username: sessionValue }, { nama: sessionValue }] },
	});

	if (!currentUser || currentUser.role !== "ADMIN_TU") {
		redirect("/login");
	}

	// 1. AMBIL STATISTIK ANGKA
	const totalSiswa = await prisma.siswa.count();
	const totalGuru = await prisma.guru.count();

	const hariIni = new Date();
	hariIni.setHours(0, 0, 0, 0);

	const sesiAktif = await prisma.jurnalMengajar.count({
		where: { tanggal: { gte: hariIni } },
	});

	// 2. AMBIL AKTIVITAS TERKINI (3 Data User Terakhir yang Ditambahkan/Diupdate)
	const recentUsers = await prisma.user.findMany({
		take: 3,
		orderBy: { updatedAt: "desc" },
		select: { id: true, nama: true, role: true, updatedAt: true, createdAt: true },
	});

	// Format data tersebut menjadi array aktivitas untuk UI
	const aktivitasTerkini = recentUsers.map((user) => {
		// Jika selisih createdAt dan updatedAt kurang dari 1 detik, berarti akun baru
		const isNew = user.createdAt.getTime() === user.updatedAt.getTime();

		// Format waktu ke format Indonesia (Contoh: 21 Jul, 14:30)
		const waktu = new Intl.DateTimeFormat("id-ID", {
			day: "numeric",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		}).format(user.updatedAt);

		return {
			id: user.id,
			title: isNew ? "Pengguna Baru Terdaftar" : "Data Pengguna Diperbarui",
			desc: `Akun ${user.nama} (${user.role.replace("_", " ")}) telah ${isNew ? "ditambahkan ke" : "diperbarui di"} sistem.`,
			time: waktu,
		};
	});

	const stats = {
		siswa: totalSiswa,
		guru: totalGuru,
		sesi: sesiAktif,
		aktivitas: aktivitasTerkini,
	};

	return <AdminDashboard stats={stats} />;
}
