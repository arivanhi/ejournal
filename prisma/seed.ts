import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
	console.log("Mulai melakukan seeding data...");

	// 1. Hash Password menggunakan bcrypt (cost factor: 10)
	// Password default kita set: smanda123
	const hashedPassword = await bcrypt.hash("smanda123", 10);

	// 2. Buat Akun Admin TU (menggunakan upsert agar tidak error/duplikat jika dijalankan 2x)
	const admin = await prisma.user.upsert({
		where: { username: "admin_tu" },
		update: {}, // Jika sudah ada, jangan lakukan apa-apa
		create: {
			username: "admin_tu",
			password: hashedPassword,
			nama: "Administrator TU",
			role: "ADMIN_TU",
		},
	});
	console.log(`✅ Akun Admin berhasil dibuat: ${admin.username}`);

	// 3. Buat Tahun Ajaran Aktif Default
	const tahunAjaran = await prisma.tahunAjaran.upsert({
		where: { nama: "2026/2027 Ganjil" },
		update: {},
		create: {
			nama: "2026/2027 Ganjil",
			isActive: true,
		},
	});
	console.log(`✅ Tahun Ajaran aktif diset: ${tahunAjaran.nama}`);

	console.log("Seeding selesai! 🚀");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		// Selalu tutup koneksi Prisma setelah selesai
		await prisma.$disconnect();
	});
