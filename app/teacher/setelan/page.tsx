import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SetelanClient from "./SetelanClient";
import SessionWrapper from "./SessionWrapper"; // <--- Import jaket pelindungnya

export const dynamic = "force-dynamic";

export default async function SetelanPage() {
	// Ambil sesi saat ini
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

	if (!currentUser || !currentUser.guru) {
		redirect("/teacher/dashboard");
	}

	return (
		// Bungkus komponen Client dengan SessionWrapper
		<SessionWrapper session={session}>
			<SetelanClient user={currentUser} guru={currentUser.guru} isWaliKelas={currentUser.role === "WALI_KELAS"} />
		</SessionWrapper>
	);
}
