"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function assignWaliKelasAction(guruId: string, kelasId: string | null) {
	try {
		const guru = await prisma.guru.findUnique({ where: { id: guruId }, include: { user: true } });
		if (!guru) return { success: false, message: "Data guru tidak ditemukan" };

		await prisma.$transaction(async (tx) => {
			// 1. Hapus penugasan wali kelas lama untuk guru ini (jika ada)
			await tx.kelasWali.deleteMany({ where: { guruId: guru.id } });

			if (kelasId) {
				// 2. Jika ada kelas tujuan, hapus guru lain yang mungkin sedang memegang kelas tersebut
				const existingWaliDiKelas = await tx.kelasWali.findFirst({ where: { kelasId } });
				if (existingWaliDiKelas) {
					await tx.kelasWali.delete({ where: { id: existingWaliDiKelas.id } });
					// Ubah role guru lama kembali jadi GURU biasa
					const guruLama = await tx.guru.findUnique({ where: { id: existingWaliDiKelas.guruId } });
					if (guruLama) await tx.user.update({ where: { id: guruLama.userId }, data: { role: "GURU" } });
				}

				// 3. Assign guru baru ke kelas tersebut
				await tx.kelasWali.create({
					data: { guruId: guru.id, kelasId: kelasId },
				});

				// 4. Update Role user menjadi WALI_KELAS
				await tx.user.update({ where: { id: guru.userId }, data: { role: "WALI_KELAS" } });

				// 5. Update jadwal Literasi & Numerasi for XI and XII
				const targetKelas = await tx.kelas.findUnique({ where: { id: kelasId } });
				if (targetKelas && (targetKelas.nama.toUpperCase().startsWith("XI") || targetKelas.nama.toUpperCase().startsWith("XII"))) {
					const mapelLitNum = await tx.mataPelajaran.findMany({
						where: { OR: [{ nama: { contains: "Literasi" } }, { nama: { contains: "Numerasi" } }] }
					});
					const mapelIds = mapelLitNum.map(m => m.id);
					if (mapelIds.length > 0) {
						await tx.jadwalPelajaran.updateMany({
							where: { kelasId: targetKelas.id, mapelId: { in: mapelIds } },
							data: { guruId: guru.id }
						});
					}
				}
			} else {
				// 5. Jika kelasId null (artinya dicopot tugas walinya), kembalikan role jadi GURU
				await tx.user.update({ where: { id: guru.userId }, data: { role: "GURU" } });
			}
		});

		revalidatePath("/admin/role");
		return { success: true, message: "Penugasan wali kelas berhasil diperbarui!" };
	} catch (error) {
		console.error("Error assign Wali:", error);
		return { success: false, message: "Terjadi kesalahan internal server." };
	}
}
