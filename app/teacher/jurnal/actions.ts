"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Fungsi 1: Buat Jurnal Baru berdasarkan Input Form
export async function buatJurnalAction(data: {
	jadwalId: string;
	tanggal: string; // Format YYYY-MM-DD
	waktuMulai: string;
	waktuSelesai: string;
	materi: string;
	tujuan: string;
	catatan: string;
}) {
	try {
		// --- 1. LOGIKA CEK DUPLIKAT (Cek 1 hari penuh: 00:00 s.d 23:59) ---
		const startOfDay = new Date(data.tanggal);
		startOfDay.setHours(0, 0, 0, 0); // Kunci di jam 00:00

		const endOfDay = new Date(startOfDay);
		endOfDay.setDate(endOfDay.getDate() + 1); // Tambah 1 hari untuk batas akhir

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

		// --- 2. LOGIKA PENYIMPANAN WAKTU AKTUAL (Real-time) ---
		const inputDate = new Date(data.tanggal);
		const now = new Date();
		// Suntikkan jam, menit, dan detik saat ini ke tanggal yang dipilih di form
		inputDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

		const jurnal = await prisma.jurnalMengajar.create({
			data: {
				jadwalId: data.jadwalId,
				tanggal: inputDate, // Sekarang akan tersimpan: YYYY-MM-DD HH:MM:SS
				waktuMulai: data.waktuMulai,
				waktuSelesai: data.waktuSelesai,
				materiBab: data.materi + (data.tujuan ? `\nTujuan: ${data.tujuan}` : ""),
				catatan: data.catatan,
				status: "SUBMITTED",
			},
		});

		revalidatePath("/teacher/jurnal");
		return { success: true, data: jurnal };
	} catch (error) {
		return { success: false, message: "Gagal menyimpan jurnal." };
	}
}

// Fungsi 2: Generate Token QR Presensi (QR Dinamis, Kode Manual Statis)
export async function aktifkanPresensiQR(jurnalId: string) {
	try {
		const jurnal = await prisma.jurnalMengajar.findUnique({ where: { id: jurnalId } });
		if (!jurnal) throw new Error("Jurnal tidak ditemukan");

		let manualCode = "";

		if (jurnal.qrToken) {
			const parts = jurnal.qrToken.split("_");
			if (parts.length >= 3) {
				manualCode = parts[2];
			} else {
				manualCode = Math.random().toString(36).substring(2, 8).toUpperCase();
			}
		} else {
			manualCode = Math.random().toString(36).substring(2, 8).toUpperCase();
		}

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

// Fungsi 3: Simpan Presensi Manual
export async function simpanPresensiManualAction(
	jurnalId: string,
	presensiData: { siswaId: string; status: string }[],
) {
	try {
		for (const data of presensiData) {
			const existing = await prisma.presensiSiswa.findFirst({
				where: { jurnalId: jurnalId, siswaId: data.siswaId },
			});

			if (existing) {
				await prisma.presensiSiswa.update({
					where: { id: existing.id },
					data: { status: data.status },
				});
			} else {
				await prisma.presensiSiswa.create({
					data: {
						jurnalId: jurnalId,
						siswaId: data.siswaId,
						status: data.status,
						waktuScan: new Date(),
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

// Fungsi 4: Update/Edit Jurnal (Tanggal & Topik Materi)
export async function updateJurnalAction(
	jurnalId: string,
	data: { tanggal: string; waktuMulai: string; waktuSelesai: string; materi: string },
) {
	try {
		const inputDate = new Date(data.tanggal);
		const now = new Date();
		// Saat diedit, jamnya juga akan otomatis ter-update ke jam edit terbaru
		inputDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

		await prisma.jurnalMengajar.update({
			where: { id: jurnalId },
			data: {
				tanggal: inputDate,
				waktuMulai: data.waktuMulai,
				waktuSelesai: data.waktuSelesai,
				materiBab: data.materi,
			},
		});
		revalidatePath("/teacher/jurnal");
		return { success: true };
	} catch (error) {
		return { success: false, message: "Gagal memperbarui jurnal." };
	}
}

// Fungsi 5: Tutup Presensi QR & Simpan Catatan KBM
export async function tutupPresensiQR(jurnalId: string, catatan: string = "") {
	try {
		const updateData: any = { qrToken: null };

		if (catatan.trim() !== "") {
			updateData.catatan = catatan;
		}

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
