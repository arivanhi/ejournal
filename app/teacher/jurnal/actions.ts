"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Fungsi 1: Saat tombol "Isi Jurnal" / "Buka Jurnal" dipencet
export async function bukaAtauBuatJurnalAction(jadwalId: string) {
	try {
		// Cek apakah hari ini sudah ada jurnal untuk jadwal ini
		const hariIni = new Date();
		hariIni.setHours(0, 0, 0, 0);
		const besok = new Date(hariIni);
		besok.setDate(besok.getDate() + 1);

		let jurnal = await prisma.jurnalMengajar.findFirst({
			where: {
				jadwalId: jadwalId,
				tanggal: { gte: hariIni, lt: besok },
			},
			include: {
				presensi: true,
				jadwal: { include: { kelas: { include: { riwayatSiswa: { include: { siswa: true } } } }, mapel: true } },
			},
		});

		// Jika belum ada, buat DRAFT baru
		if (!jurnal) {
			jurnal = await prisma.jurnalMengajar.create({
				data: { jadwalId: jadwalId, status: "DRAFT" },
				include: {
					presensi: true,
					jadwal: { include: { kelas: { include: { riwayatSiswa: { include: { siswa: true } } } }, mapel: true } },
				},
			});
		}

		return { success: true, data: jurnal };
	} catch (error) {
		return { success: false, message: "Gagal membuka jurnal." };
	}
}

// Fungsi 2: Generate Token QR Presensi
export async function aktifkanPresensiQR(jurnalId: string) {
	try {
		const token = `QR_${jurnalId}_${Date.now()}`;
		await prisma.jurnalMengajar.update({
			where: { id: jurnalId },
			data: { qrToken: token },
		});
		revalidatePath("/teacher/jurnal");
		return { success: true, token };
	} catch (error) {
		return { success: false, message: "Gagal mengaktifkan QR." };
	}
}

// Fungsi 3: Simpan / Submit Jurnal
export async function simpanJurnalAction(
	jurnalId: string,
	materi: string,
	tujuan: string,
	catatan: string,
	submitStatus: "DRAFT" | "SUBMITTED",
) {
	try {
		await prisma.jurnalMengajar.update({
			where: { id: jurnalId },
			data: {
				materiBab: materi + (tujuan ? `\nTujuan: ${tujuan}` : ""),
				catatan: catatan,
				status: submitStatus,
				// Jika disubmit, tutup akses QR
				qrToken: submitStatus === "SUBMITTED" ? null : undefined,
			},
		});
		revalidatePath("/teacher/jurnal");
		return { success: true };
	} catch (error) {
		return { success: false, message: "Gagal menyimpan jurnal." };
	}
}
