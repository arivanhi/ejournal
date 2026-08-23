import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession();
		if (!session || !session.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Verifikasi Role Pimpinan (KEPSEK/WAKA)
		const currentUser = await prisma.user.findFirst({
			where: {
				OR: [{ username: session.user.name || "" }, { nama: session.user.name || "" }],
				role: { in: ["KEPSEK", "WAKA"] },
			},
		});

		if (!currentUser) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await req.json();
		const { tahunAjaranId, isRatingActive } = body;

		if (!tahunAjaranId || typeof isRatingActive !== "boolean") {
			return NextResponse.json({ error: "Invalid data" }, { status: 400 });
		}

		const updatedTa = await prisma.tahunAjaran.update({
			where: { id: tahunAjaranId },
			data: { isRatingActive },
		});

		return NextResponse.json({ message: "Status rating berhasil diubah", data: updatedTa }, { status: 200 });
	} catch (error: any) {
		console.error("Error toggling rating status:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
