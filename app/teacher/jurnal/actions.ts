// app/teacher/jurnal/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Fungsi 1: Buat Jurnal Baru & Auto-Presensi (Jika Memenuhi Syarat Jam 2-9)
export async function buatJurnalAction(data: {
	jadwalId: string;
	tanggal: string;
	waktuMulai: string;
	waktuSelesai: string;
	materi: string;
	tujuan: string;
	catatan: string;
	tugas: string;
	isAutoHadir: boolean; // Parameter baru: Apakah jam 2-9?
	siswaIds: string[]; // Parameter baru: Daftar ID siswa di kelas
}) {
	try {
		const startOfDay = new Date(data.tanggal);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(startOfDay);
		endOfDay.setDate(endOfDay.getDate() + 1);

		const existingJurnal = await prisma.jurnalMengajar.findFirst({
			where: {
				jadwalId: data.jadwalId,
				tanggal: { gte: startOfDay, lt: endOfDay },
			},
		});

		if (existingJurnal) {
			return {
				success: false,
				message: "Jurnal untuk kelas dan tanggal tersebut sudah ada. Silakan edit di tabel bawah.",
			};
		}

		const inputDate = new Date(data.tanggal);
		const now = new Date();
		inputDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

		// 1. Buat Jurnal Baru
		const jurnal = await prisma.jurnalMengajar.create({
			data: {
				jadwalId: data.jadwalId,
				tanggal: inputDate,
				waktuMulai: data.waktuMulai,
				waktuSelesai: data.waktuSelesai,
				materiBab: data.materi + (data.tujuan ? `\nTujuan: ${data.tujuan}` : ""),
				catatan: data.catatan,
				tugas: data.tugas,
				status: "SUBMITTED",
			},
		});

		// 2. LOGIKA BARU: Jika memenuhi syarat (Jam 2-9), langsung set semua siswa "Hadir"
		if (data.isAutoHadir && data.siswaIds && data.siswaIds.length > 0) {
			const presensiData = data.siswaIds.map((id) => ({
				jurnalId: jurnal.id,
				siswaId: id,
				status: "H",
				waktuScan: new Date(),
			}));

			await prisma.presensiSiswa.createMany({
				data: presensiData,
				skipDuplicates: true,
			});
		}

		revalidatePath("/teacher/jurnal");
		return { success: true, data: jurnal };
	} catch (error) {
		return { success: false, message: "Gagal menyimpan jurnal." };
	}
}

export async function aktifkanPresensiQR(jurnalId: string) {
	try {
		const jurnal = await prisma.jurnalMengajar.findUnique({ where: { id: jurnalId } });
		if (!jurnal) throw new Error("Jurnal tidak ditemukan");

		const manualCode = Math.random().toString(36).substring(2, 8).toUpperCase();
		const token = `QR_${jurnalId}_${manualCode}_${Date.now()}`;

		await prisma.jurnalMengajar.update({
			where: { id: jurnalId },
			data: { qrToken: token },
		});

		revalidatePath("/teacher/jurnal");
		revalidatePath("/teacher/presensi");

		return { success: true, token };
	} catch (error) {
		return { success: false, message: "Gagal mengaktifkan QR." };
	}
}

export async function simpanPresensiManualAction(
	jurnalId: string,
	presensiData: { siswaId: string; status: string; nilaiTugas?: number; alasanIzin?: string }[],
) {
	try {
		for (const data of presensiData) {
			const existing = await prisma.presensiSiswa.findFirst({
				where: { jurnalId: jurnalId, siswaId: data.siswaId },
			});

			if (existing) {
				await prisma.presensiSiswa.update({
					where: { id: existing.id },
					data: { status: data.status, nilaiTugas: data.nilaiTugas, alasanIzin: data.alasanIzin },
				});
			} else {
				await prisma.presensiSiswa.create({
					data: {
						jurnalId: jurnalId,
						siswaId: data.siswaId,
						status: data.status as any,
						waktuScan: new Date(),
						nilaiTugas: data.nilaiTugas,
						alasanIzin: data.alasanIzin,
					},
				});
			}
		}

		revalidatePath("/teacher/jurnal");
		return { success: true };
	} catch (error) {
		console.error("Error saving presensi:", error);
		return { success: false, message: "Gagal menyimpan perubahan presensi." };
	}
}

export async function updateJurnalAction(
	jurnalId: string,
	data: { tanggal: string; waktuMulai: string; waktuSelesai: string; materi: string; tugas: string },
) {
	try {
		const inputDate = new Date(data.tanggal);
		const now = new Date();
		inputDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

		await prisma.jurnalMengajar.update({
			where: { id: jurnalId },
			data: {
				tanggal: inputDate,
				waktuMulai: data.waktuMulai,
				waktuSelesai: data.waktuSelesai,
				materiBab: data.materi,
				tugas: data.tugas,
			},
		});
		revalidatePath("/teacher/jurnal");
		return { success: true };
	} catch (error) {
		return { success: false, message: "Gagal memperbarui jurnal." };
	}
}

export async function tutupPresensiQR(jurnalId: string, catatan: string = "") {
	try {
		const updateData: any = { qrToken: null };
		if (catatan.trim() !== "") updateData.catatan = catatan;

		await prisma.jurnalMengajar.update({
			where: { id: jurnalId },
			data: updateData,
		});

		revalidatePath("/teacher/jurnal");
		revalidatePath("/teacher/presensi");
		revalidatePath("/teacher/riwayat");
		return { success: true };
	} catch (error) {
		return { success: false, message: "Gagal menutup QR dan menyimpan catatan." };
	}
}

export async function hapusJurnalAction(jurnalId: string) {
	try {
		await prisma.jurnalMengajar.delete({
			where: { id: jurnalId },
		});
		revalidatePath("/teacher/jurnal");
		revalidatePath("/teacher/presensi");
		revalidatePath("/teacher/riwayat");
		return { success: true };
	} catch (error) {
		return { success: false, message: "Gagal menghapus jurnal." };
	}
}
