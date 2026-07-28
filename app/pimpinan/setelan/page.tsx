import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import SetelanClient from "./SetelanClient";
import SessionWrapper from "./SessionWrapper";

export const dynamic = "force-dynamic";

export default async function SetelanPage() {
	const session = await getServerSession();
	if (!session || !session.user) redirect("/login");

	const sessionValue = session.user.name || session.user.email || "";

	const currentUser = await prisma.user.findFirst({
		where: {
			OR: [{ username: sessionValue }, { nama: sessionValue }],
			role: { in: ["KEPSEK", "WAKA"] },
		},
	});

	if (!currentUser) {
		redirect("/pimpinan/dashboard");
	}

	return (
		<SessionWrapper session={session}>
			<SetelanClient user={currentUser} />
		</SessionWrapper>
	);
}
