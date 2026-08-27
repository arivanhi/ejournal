"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function buatJurnalTkaAction(data: {
	jadwalId: string;
	tanggal: string;
	waktuMulai: string;
	waktuSelesai: string;
	materi: string;
	tujuan: string;
	catatan: string;
	tugas: string;
	siswaIds: string[];
}) {
	try {
		const startOfDay = new Date(data.tanggal);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(startOfDay);
		endOfDay.setDate(endOfDay.getDate() + 1);

		// Cari informasi kelas, mapel, dan tahun ajaran dari jadwal ini
		const jadwalSumber = await prisma.jadwalPelajaran.findUnique({
			where: { id: data.jadwalId },
			select: { kelasId: true, mapelId: true, tahunAjaranId: true }
		});

		if (!jadwalSumber) {
			return { success: false, message: "Jadwal TKA tidak ditemukan." };
		}

		// Cari semua jadwal TKA yang memiliki kelas, mapel, dan tahun ajaran yang sama
		// Ini adalah tim guru (Team Teaching) yang mengampu mapel tersebut di rombel tersebut
		const jadwalTim = await prisma.jadwalPelajaran.findMany({
			where: {
				kelasId: jadwalSumber.kelasId,
				mapelId: jadwalSumber.mapelId,
				tahunAjaranId: jadwalSumber.tahunAjaranId,
				hari: 0
			},
			select: { id: true }
		});

		const inputDate = new Date(data.tanggal);
		const now = new Date();
		inputDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

		// Buat jurnal untuk setiap guru di tim
		for (const jadwal of jadwalTim) {
			// Pastikan belum ada jurnal di tanggal yang sama untuk guru tersebut
			const existingJurnal = await prisma.jurnalMengajar.findFirst({
				where: {
					jadwalId: jadwal.id,
					tanggal: { gte: startOfDay, lt: endOfDay },
				},
			});

			if (!existingJurnal) {
				await prisma.jurnalMengajar.create({
					data: {
						jadwalId: jadwal.id,
						tanggal: inputDate,
						waktuMulai: data.waktuMulai,
						waktuSelesai: data.waktuSelesai,
						materiBab: data.materi + (data.tujuan ? `\nTujuan: ${data.tujuan}` : ""),
						catatan: data.catatan,
						tugas: data.tugas,
						status: "SUBMITTED",
					},
				});
			}
		}

		revalidatePath("/teacher/jurnal-tka");
		return { success: true, message: "Jurnal berhasil dibuat untuk seluruh Tim Fasilitator TKA." };
	} catch (error) {
		return { success: false, message: "Gagal menyimpan jurnal." };
	}
}

// Digunakan ketika menyimpan absensi manual di form TKA
export async function simpanPresensiTkaAction(
	jurnalId: string,
	presensiData: { siswaId: string; status: string; nilaiTugas?: number; alasanIzin?: string; isDispensasi?: boolean; isTerlambat?: boolean; alasan?: string; alasanTerlambat?: string; fileBukti?: string }[],
) {
	try {
		// Cari jadwal yang menaungi jurnal ini
		const jurnalAwal = await prisma.jurnalMengajar.findUnique({
			where: { id: jurnalId },
			include: { jadwal: true }
		});

		if (!jurnalAwal) return { success: false, message: "Jurnal tidak ditemukan" };

		// Cari semua jadwal tim teaching (kombinasi rombel, mapel, tahun ajaran)
		const jadwalTim = await prisma.jadwalPelajaran.findMany({
			where: {
				kelasId: jurnalAwal.jadwal.kelasId,
				mapelId: jurnalAwal.jadwal.mapelId,
				tahunAjaranId: jurnalAwal.jadwal.tahunAjaranId,
				hari: 0
			},
			select: { id: true }
		});
		const jadwalTimIds = jadwalTim.map(j => j.id);

		// Cari semua jurnal milik tim teaching pada tanggal yang sama
		const startOfDay = new Date(jurnalAwal.tanggal);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(startOfDay);
		endOfDay.setDate(endOfDay.getDate() + 1);

		const jurnalTim = await prisma.jurnalMengajar.findMany({
			where: {
				jadwalId: { in: jadwalTimIds },
				tanggal: { gte: startOfDay, lt: endOfDay },
			},
			select: { id: true }
		});

		// Insert / update presensi untuk SETIAP jurnal milik tim
		for (const jurnal of jurnalTim) {
			for (const data of presensiData) {
				const existing = await prisma.presensiSiswa.findFirst({
					where: { jurnalId: jurnal.id, siswaId: data.siswaId },
				});

				if (existing) {
					await prisma.presensiSiswa.update({
						where: { id: existing.id },
						data: { 
							status: data.status as any, 
							nilaiTugas: data.nilaiTugas, 
							alasanIzin: data.alasanIzin,
							isDispensasi: data.isDispensasi ?? false,
							isTerlambat: data.isTerlambat ?? false,
							alasanTerlambat: data.alasanTerlambat,
							alasan: data.alasan,
							fileBukti: data.fileBukti
						},
					});
				} else {
					await prisma.presensiSiswa.create({
						data: {
							jurnalId: jurnal.id,
							siswaId: data.siswaId,
							status: data.status as any,
							waktuScan: new Date(),
							nilaiTugas: data.nilaiTugas,
							alasanIzin: data.alasanIzin,
							isDispensasi: data.isDispensasi ?? false,
							isTerlambat: data.isTerlambat ?? false,
							alasanTerlambat: data.alasanTerlambat,
							alasan: data.alasan,
							fileBukti: data.fileBukti
						},
					});
				}
			}
		}

		revalidatePath("/teacher/jurnal-tka");
		return { success: true };
	} catch (error) {
		console.error("Error saving presensi:", error);
		return { success: false, message: "Gagal menyimpan perubahan presensi." };
	}
}

// Update Jurnal TKA juga sync ke semua guru tim
export async function updateJurnalTkaAction(
	jurnalId: string,
	data: { tanggal: string; waktuMulai: string; waktuSelesai: string; materi: string; tugas: string },
) {
	try {
		const jurnalAwal = await prisma.jurnalMengajar.findUnique({
			where: { id: jurnalId },
			include: { jadwal: true }
		});

		if (!jurnalAwal) return { success: false, message: "Jurnal tidak ditemukan" };

		const inputDate = new Date(data.tanggal);
		const now = new Date();
		inputDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

		const startOfDay = new Date(jurnalAwal.tanggal);
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = new Date(startOfDay);
		endOfDay.setDate(endOfDay.getDate() + 1);

		const jadwalTim = await prisma.jadwalPelajaran.findMany({
			where: {
				kelasId: jurnalAwal.jadwal.kelasId,
				mapelId: jurnalAwal.jadwal.mapelId,
				tahunAjaranId: jurnalAwal.jadwal.tahunAjaranId,
				hari: 0
			},
			select: { id: true }
		});
		const jadwalTimIds = jadwalTim.map(j => j.id);

		const jurnalTim = await prisma.jurnalMengajar.findMany({
			where: {
				jadwalId: { in: jadwalTimIds },
				tanggal: { gte: startOfDay, lt: endOfDay },
			},
			select: { id: true }
		});

		for (const jurnal of jurnalTim) {
			await prisma.jurnalMengajar.update({
				where: { id: jurnal.id },
				data: {
					tanggal: inputDate,
					waktuMulai: data.waktuMulai,
					waktuSelesai: data.waktuSelesai,
					materiBab: data.materi,
					tugas: data.tugas,
				},
			});
		}

		revalidatePath("/teacher/jurnal-tka");
		return { success: true };
	} catch (error) {
		return { success: false, message: "Gagal update jurnal." };
	}
}
