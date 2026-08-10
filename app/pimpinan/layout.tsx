import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PimpinanLayoutClient from "./PimpinanLayoutClient";

export default async function PimpinanLayout({ children }: { children: React.ReactNode }) {
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

	return <PimpinanLayoutClient user={user}>{children}</PimpinanLayoutClient>;
}
