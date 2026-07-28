"use server";

import { prisma } from "@/lib/prisma";

export async function updatePasswordAction(userId: string, passwordLama: string, passwordBaru: string) {
	try {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) return { success: false, message: "Pengguna tidak ditemukan." };

		// Pengecekan password (Plain-text berdasarkan logika Anda sebelumnya)
		if (user.password !== passwordLama) {
			return { success: false, message: "Password lama yang Anda masukkan salah." };
		}

		// Update ke password baru
		await prisma.user.update({
			where: { id: userId },
			data: { password: passwordBaru },
		});

		return { success: true, message: "Password berhasil diubah! Silakan ingat password baru Anda." };
	} catch (error) {
		return { success: false, message: "Gagal mengubah password." };
	}
}
