import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TeacherLayoutClient from "./TeacherLayoutClient";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
	const session = await getServerSession(authOptions);
	if (!session || !session.user) {
		redirect("/login");
	}

	const sessionValue = (session.user as any).username || session.user.name || "";
	const user = await prisma.user.findFirst({
		where: { OR: [{ username: sessionValue }, { nama: sessionValue }] },
	});

	if (!user) {
		redirect("/login");
	}

	let isGuruBK = false;
	if (user.role === "GURU" || user.role === "WALI_KELAS") {
		const guru = await prisma.guru.findUnique({
			where: { userId: user.id },
		});
		if (guru) {
			const jadwalBK = await prisma.jadwalPelajaran.findFirst({
				where: {
					guruId: guru.id,
					mapel: {
						OR: [
							{ nama: { contains: "BK" } },
							{ nama: { contains: "Konseling" } },
							{ kode: { contains: "BK" } },
						],
					},
				},
			});
			if (jadwalBK) isGuruBK = true;
		}
	}

	return <TeacherLayoutClient user={user} isGuruBK={isGuruBK}>{children}</TeacherLayoutClient>;
}
