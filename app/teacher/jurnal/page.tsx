// app/teacher/jurnal/page.tsx
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import JurnalClient from "./JurnalClient";

export const dynamic = "force-dynamic";

export default async function JurnalPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";
	const currentUser = await prisma.user.findFirst({
		where: { OR: [{ username: sessionValue }, { nama: sessionValue }] },
		include: { guru: true },
	});

	if (!currentUser || !currentUser.guru) redirect("/teacher/dashboard");
	const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

	// AMBIL SEMUA JADWAL (Tanpa filter hari)
	const jadwalSemua = tahunAjaranAktif
		? await prisma.jadwalPelajaran.findMany({
				where: {
					guruId: currentUser.guru.id,
					tahunAjaranId: tahunAjaranAktif.id,
					hari: { not: 0 },
				},
				include: {
					mapel: true,
					kelas: true,
					jurnal: true, // Ambil semua jurnal terkait jadwal ini
				},
				orderBy: [{ hari: "asc" }, { waktuMulai: "asc" }],
			})
		: [];

	return <JurnalClient jadwalSemua={jadwalSemua} />;
}
