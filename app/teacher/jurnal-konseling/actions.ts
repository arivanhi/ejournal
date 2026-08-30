"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function buatJurnalKonselingAction(data: {
	tanggal: string;
	guruId: string;
	tahunAjaranId: string;
	jenisBimbingan: string;
	materi: string;
	penilaianSegera: string;
	sasaranSiswaIds: string[];
}) {
	try {
		const inputDate = new Date(data.tanggal);
		const now = new Date();
		inputDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

		const jurnal = await prisma.jurnalKonseling.create({
			data: {
				tanggal: inputDate,
				guruId: data.guruId,
				tahunAjaranId: data.tahunAjaranId,
				jenisBimbingan: data.jenisBimbingan,
				materi: data.materi,
				penilaianSegera: data.penilaianSegera,
				sasaranSiswa: {
					create: data.sasaranSiswaIds.map((siswaId) => ({
						siswaId,
					})),
				},
			},
		});

		revalidatePath("/teacher/jurnal-konseling");
		return { success: true, message: "Jurnal Bimbingan Konseling berhasil disimpan." };
	} catch (error: any) {
		console.error("Error buatJurnalKonselingAction:", error);
		return { success: false, message: error.message || "Gagal menyimpan jurnal konseling." };
	}
}

export async function editJurnalKonselingAction(data: {
	id: string;
	tanggal: string;
	jenisBimbingan: string;
	materi: string;
	penilaianSegera: string;
	sasaranSiswaIds: string[];
}) {
	try {
		const inputDate = new Date(data.tanggal);
		const now = new Date();
		inputDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

		await prisma.$transaction(async (tx) => {
			await tx.jurnalKonseling.update({
				where: { id: data.id },
				data: {
					tanggal: inputDate,
					jenisBimbingan: data.jenisBimbingan,
					materi: data.materi,
					penilaianSegera: data.penilaianSegera,
				},
			});

			await tx.jurnalKonselingSiswa.deleteMany({
				where: { jurnalId: data.id },
			});

			await tx.jurnalKonselingSiswa.createMany({
				data: data.sasaranSiswaIds.map(siswaId => ({
					jurnalId: data.id,
					siswaId,
				})),
			});
		});

		revalidatePath("/teacher/jurnal-konseling");
		return { success: true, message: "Jurnal Bimbingan Konseling berhasil diperbarui." };
	} catch (error: any) {
		console.error("Error editJurnalKonselingAction:", error);
		return { success: false, message: error.message || "Gagal memperbarui jurnal konseling." };
	}
}

export async function hapusJurnalKonselingAction(id: string) {
	try {
		await prisma.jurnalKonseling.delete({
			where: { id },
		});
		revalidatePath("/teacher/jurnal-konseling");
		return { success: true, message: "Jurnal Bimbingan Konseling berhasil dihapus." };
	} catch (error: any) {
		console.error("Error hapusJurnalKonselingAction:", error);
		return { success: false, message: "Gagal menghapus jurnal konseling." };
	}
}

export async function getSiswaByKelas(kelasIds: string[], tahunAjaranId: string) {
	try {
		const riwayats = await prisma.riwayatKelasSiswa.findMany({
			where: {
				kelasId: { in: kelasIds },
				tahunAjaranId,
				isTka: false, // Asumsikan BK reguler, bukan TKA (walaupun kodenya TKA-BK, biasanya siswa per kelas reguler).
			},
			include: {
				kelas: true,
				siswa: {
					include: {
						user: true,
					},
				},
			},
			orderBy: [
				{
					kelas: {
						nama: "asc",
					}
				},
				{
					siswa: {
						user: {
							nama: "asc",
						},
					},
				}
			],
		});
		
		return riwayats.map(r => ({
			...r.siswa,
			kelasNama: r.kelas.nama
		}));
	} catch (error: any) {
		console.error("Error getSiswaByKelas:", error);
		return [];
	}
}

export async function getKepsekData() {
	try {
		const kepsek = await prisma.user.findFirst({
			where: { role: "KEPSEK" },
			include: { pimpinan: true },
		});
		return kepsek;
	} catch (error) {
		console.error("Error getKepsekData:", error);
		return null;
	}
}

export async function getGuruData(guruId: string) {
	try {
		const guru = await prisma.guru.findUnique({
			where: { id: guruId },
			include: { user: true },
		});
		return guru;
	} catch (error) {
		console.error("Error getGuruData:", error);
		return null;
	}
}
