"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. Fungsi Update Profil Dasar
export async function updateProfilAction(userId: string, guruId: string, data: { nama: string; npp: string }) {
	try {
		const existingUser = await prisma.user.findUnique({
			where: { username: data.npp },
		});

		if (existingUser && existingUser.id !== userId) {
			return { success: false, message: "NPP/Username tersebut sudah dipakai oleh akun lain!" };
		}

		await prisma.$transaction([
			prisma.user.update({
				where: { id: userId },
				data: { nama: data.nama, username: data.npp },
			}),
			prisma.guru.update({
				where: { id: guruId },
				data: { npp: data.npp }, // <--- KUNCI PERBAIKAN: Kolom 'nama' dihapus dari sini
			}),
		]);

		revalidatePath("/teacher/setelan");
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

		// Pengecekan password (Sesuaikan jika Anda menggunakan bcryptjs di sistem Anda)
		// Saat ini mengecek string secara langsung (berdasarkan logika password plain-text sebelumnya)
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
