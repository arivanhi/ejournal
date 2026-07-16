"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignMapelAction(guruId: string, mapelId: string, kelasIds: string[]) {
	try {
		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
		if (!tahunAjaranAktif) return { success: false, message: "Tidak ada Tahun Ajaran aktif!" };

		if (kelasIds.length === 0) return { success: false, message: "Pilih minimal satu kelas target!" };

		let count = 0;

		await prisma.$transaction(async (tx) => {
			for (const kelasId of kelasIds) {
				// Cek apakah guru sudah mengajar mapel ini di kelas ini
				const existing = await tx.jadwalPelajaran.findFirst({
					where: { guruId, mapelId, kelasId, tahunAjaranId: tahunAjaranAktif.id },
				});

				if (!existing) {
					// Buat pemetaan baru (menggunakan tabel JadwalPelajaran sebagai basis mapping)
					await tx.jadwalPelajaran.create({
						data: {
							guruId,
							mapelId,
							kelasId,
							tahunAjaranId: tahunAjaranAktif.id,
							hari: 0, // Default mapping value
							waktuMulai: "-", // Default mapping value
							waktuSelesai: "-", // Default mapping value
						},
					});
					count++;
				}
			}
		});

		revalidatePath("/admin/mapel");
		return { success: true, message: `Berhasil menugaskan ${count} kelas baru!` };
	} catch (error) {
		console.error("Error assign Mapel:", error);
		return { success: false, message: "Terjadi kesalahan pada server." };
	}
}
// Fungsi untuk mengedit pemetaan (Hapus yang lama, buat yang baru)
export async function editMapelAction(guruId: string, mapelId: string, kelasIds: string[]) {
	try {
		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
		if (!tahunAjaranAktif) return { success: false, message: "Tidak ada Tahun Ajaran aktif!" };

		if (kelasIds.length === 0) return { success: false, message: "Pilih minimal satu kelas target!" };

		await prisma.$transaction(async (tx) => {
			// 1. Bersihkan pemetaan lama untuk guru dan mapel ini di tahun ajaran aktif
			await tx.jadwalPelajaran.deleteMany({
				where: { guruId, mapelId, tahunAjaranId: tahunAjaranAktif.id },
			});

			// 2. Buat pemetaan baru berdasarkan kelas yang dicentang
			for (const kelasId of kelasIds) {
				await tx.jadwalPelajaran.create({
					data: {
						guruId,
						mapelId,
						kelasId,
						tahunAjaranId: tahunAjaranAktif.id,
						hari: 0,
						waktuMulai: "-",
						waktuSelesai: "-",
					},
				});
			}
		});

		revalidatePath("/admin/mapel");
		return { success: true, message: "Pemetaan kelas berhasil diperbarui!" };
	} catch (error) {
		console.error("Error edit Mapel:", error);
		return { success: false, message: "Terjadi kesalahan saat memperbarui pemetaan." };
	}
}

// Fungsi untuk menghapus seluruh pemetaan mapel dari seorang guru
export async function deleteMapelAction(guruId: string, mapelId: string) {
	try {
		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
		if (!tahunAjaranAktif) return { success: false, message: "Tidak ada Tahun Ajaran aktif!" };

		await prisma.jadwalPelajaran.deleteMany({
			where: { guruId, mapelId, tahunAjaranId: tahunAjaranAktif.id },
		});

		revalidatePath("/admin/mapel");
		return { success: true, message: "Pemetaan berhasil dihapus!" };
	} catch (error) {
		console.error("Error delete Mapel:", error);
		return { success: false, message: "Terjadi kesalahan saat menghapus pemetaan." };
	}
}
