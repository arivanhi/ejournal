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

	return <TeacherLayoutClient user={user}>{children}</TeacherLayoutClient>;
}
