import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function GET() {
	try {
		const passwordHash = await bcrypt.hash("smanda123", 10);

		// Buat Akun Kepala Sekolah
		const kepsek = await prisma.user.upsert({
			where: { username: "kepsek" },
			update: {},
			create: {
				username: "kepsek",
				nama: "Drs. Budi Santoso, M.Pd",
				password: passwordHash,
				role: "KEPSEK",
			},
		});

		// Buat Akun Wakil Kepala Sekolah (WAKA)
		const wakasek = await prisma.user.upsert({
			where: { username: "wakasek" },
			update: {},
			create: {
				username: "wakasek",
				nama: "Dra. Siti Aminah, M.Si",
				password: passwordHash,
				role: "WAKA",
			},
		});

		return NextResponse.json({
			message: "Akun Pimpinan berhasil dibuat!",
			data: { kepsek, wakasek },
		});
	} catch (error) {
		return NextResponse.json({ error: "Gagal membuat akun" }, { status: 500 });
	}
}
