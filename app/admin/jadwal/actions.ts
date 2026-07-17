"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function simpanJadwalAction(formData: {
	id?: string;
	kelasId: string;
	mapelId: string;
	guruId: string;
	hari: string;
	jam: string;
	ruang: string;
}) {
	try {
		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
		if (!tahunAjaranAktif) return { success: false, message: "Tahun Ajaran aktif tidak ditemukan!" };

		// KAMUS PENERJEMAH (UI String -> Database Int)
		const mapHariToInt: Record<string, number> = {
			Senin: 1,
			Selasa: 2,
			Rabu: 3,
			Kamis: 4,
			Jumat: 5,
			Sabtu: 6,
			Minggu: 7,
		};
		const hariInt = mapHariToInt[formData.hari] || 1; // Default ke 1 jika tidak ada

		// Pecah jam menjadi mulai dan selesai ("07:00 - 08:30" => ["07:00", "08:30"])
		const jamSplit = formData.jam.split(" - ");
		const waktuMulaiStr = jamSplit[0] || "-";
		const waktuSelesaiStr = jamSplit[1] || "-";

		// 1. VALIDASI BENTROK GURU
		const jadwalBentrok = await prisma.jadwalPelajaran.findFirst({
			where: {
				guruId: formData.guruId,
				hari: hariInt, // <--- Cek berdasarkan Integer Hari
				waktuMulai: formData.jam, // Kita simpan full string "07:00 - 08:30" di field waktuMulai untuk kemudahan display UI
				tahunAjaranId: tahunAjaranAktif.id,
				id: formData.id ? { not: formData.id } : undefined,
			},
			include: { kelas: true },
		});

		if (jadwalBentrok) {
			return {
				success: false,
				message: `BENTROK! Guru ini sudah dijadwalkan mengajar di kelas ${jadwalBentrok.kelas.nama} pada hari ${formData.hari} jam ${formData.jam}.`,
			};
		}

		// 2. SIMPAN / UPDATE JADWAL
		const dataJadwal = {
			guruId: formData.guruId,
			mapelId: formData.mapelId,
			kelasId: formData.kelasId,
			tahunAjaranId: tahunAjaranAktif.id,
			hari: hariInt, // <--- Simpan sebagai Integer
			waktuMulai: formData.jam,
			waktuSelesai: waktuSelesaiStr, // Isi field wajib agar Prisma tidak error
			ruang: formData.ruang,
		};

		if (formData.id) {
			await prisma.jadwalPelajaran.update({ where: { id: formData.id }, data: dataJadwal });
		} else {
			await prisma.jadwalPelajaran.create({ data: dataJadwal });
		}

		revalidatePath("/admin/jadwal");
		return { success: true, message: "Jadwal pelajaran berhasil disimpan!" };
	} catch (error) {
		console.error("Error simpan jadwal:", error);
		return { success: false, message: "Terjadi kesalahan pada server saat menyimpan jadwal." };
	}
}

export async function hapusJadwalAction(id: string) {
	try {
		await prisma.jadwalPelajaran.delete({ where: { id } });
		revalidatePath("/admin/jadwal");
		return { success: true, message: "Jadwal berhasil dihapus!" };
	} catch (error) {
		return { success: false, message: "Gagal menghapus jadwal." };
	}
}
