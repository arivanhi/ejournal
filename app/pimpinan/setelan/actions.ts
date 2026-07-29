"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Fungsi Update Profil Dasar Khusus Pimpinan
export async function updateProfilAction(userId: string, data: { nama: string; npp: string }) {
	try {
		const existingUser = await prisma.user.findUnique({
			where: { username: data.npp },
		});

		if (existingUser && existingUser.id !== userId) {
			return { success: false, message: "Username/NPP tersebut sudah dipakai oleh akun lain!" };
		}

		// KUNCI PERBAIKAN: Hanya update tabel User karena Pimpinan mungkin tidak terdaftar di tabel Guru
		await prisma.user.update({
			where: { id: userId },
			data: {
				nama: data.nama,
				username: data.npp,
			},
		});

		revalidatePath("/pimpinan/setelan");
		return { success: true, message: "Profil berhasil diperbarui." };
	} catch (error) {
		return { success: false, message: "Terjadi kesalahan saat memperbarui profil." };
	}
}

// 2. Fungsi Update Password
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
