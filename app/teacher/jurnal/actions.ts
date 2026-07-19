"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Fungsi 1: Buat Jurnal Baru berdasarkan Input Form
export async function buatJurnalAction(data: {
	jadwalId: string;
	tanggal: string; // Format YYYY-MM-DD
	materi: string;
	tujuan: string;
	catatan: string;
}) {
	try {
		const inputDate = new Date(data.tanggal);
		// Pastikan jam diset ke 00:00 agar rapi
		inputDate.setHours(0, 0, 0, 0);

		// Cek apakah sudah ada jurnal di jadwal dan tanggal yang sama persis
		const besok = new Date(inputDate);
		besok.setDate(besok.getDate() + 1);

		const existingJurnal = await prisma.jurnalMengajar.findFirst({
			where: {
				jadwalId: data.jadwalId,
				tanggal: { gte: inputDate, lt: besok },
			},
		});

		if (existingJurnal) {
			return {
				success: false,
				message: "Jurnal untuk kelas dan tanggal tersebut sudah ada. Silakan edit di tabel bawah.",
			};
		}

		const jurnal = await prisma.jurnalMengajar.create({
			data: {
				jadwalId: data.jadwalId,
				tanggal: inputDate,
				materiBab: data.materi + (data.tujuan ? `\nTujuan: ${data.tujuan}` : ""),
				catatan: data.catatan,
				status: "SUBMITTED", // Langsung disubmit
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

		// Cek apakah sebelumnya sesi ini sudah pernah punya QR/Kode Manual
		if (jurnal.qrToken) {
			const parts = jurnal.qrToken.split("_");
			// Asumsi format token: QR_jurnalId_KODEMANUAL_timestamp
			if (parts.length >= 3) {
				manualCode = parts[2]; // Ambil & pertahankan kode statis yang lama
			} else {
				manualCode = Math.random().toString(36).substring(2, 8).toUpperCase();
			}
		} else {
			// Jika baru pertama kali buka QR, buat 6 digit huruf/angka acak
			manualCode = Math.random().toString(36).substring(2, 8).toUpperCase();
		}

		// Rangkai token baru dengan timestamp yang selalu berubah
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
	presensiData: { siswaId: string; status: string }[],
) {
	try {
		// Karena kita mengubah banyak data sekaligus, kita lakukan loop
		for (const data of presensiData) {
			// Cek apakah siswa ini sudah punya record presensi di jurnal ini
			const existing = await prisma.presensiSiswa.findFirst({
				where: { jurnalId: jurnalId, siswaId: data.siswaId },
			});

			if (existing) {
				// Jika sudah ada (misal sebelumnya Alpha, mau diubah jadi Hadir), kita Update
				await prisma.presensiSiswa.update({
					where: { id: existing.id },
					data: { status: data.status },
				});
			} else {
				// Jika belum ada record sama sekali, kita Create
				await prisma.presensiSiswa.create({
					data: {
						jurnalId: jurnalId,
						siswaId: data.siswaId,
						status: data.status,
						waktuScan: new Date(), // Catat waktu saat guru mengabsenkan
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
export async function updateJurnalAction(jurnalId: string, data: { tanggal: string; materi: string }) {
	try {
		const inputDate = new Date(data.tanggal);
		inputDate.setHours(0, 0, 0, 0);

		await prisma.jurnalMengajar.update({
			where: { id: jurnalId },
			data: {
				tanggal: inputDate,
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

		// Jika guru mengisi catatan di modal, simpan ke database
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
