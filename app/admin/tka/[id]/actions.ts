"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

// ==============================
// MANAJEMEN MAPEL PILIHAN TKA
// ==============================
export async function buatMapelTkaAction(kode: string, nama: string, tahunAjaranId: string) {
	try {
		await prisma.mataPelajaran.create({
			data: { kode, nama, isTka: true },
		});
		revalidatePath(`/admin/tka/${tahunAjaranId}`);
		return { success: true, message: "Mapel Pilihan TKA berhasil ditambahkan." };
	} catch (e: any) {
		return { success: false, message: "Gagal membuat Mapel. Kode mungkin sudah dipakai." };
	}
}

export async function editMapelTkaAction(id: string, kode: string, nama: string, tahunAjaranId: string) {
	try {
		await prisma.mataPelajaran.update({
			where: { id },
			data: { kode, nama },
		});
		revalidatePath(`/admin/tka/${tahunAjaranId}`);
		return { success: true, message: "Mapel Pilihan TKA berhasil diperbarui." };
	} catch (e: any) {
		return { success: false, message: "Gagal memperbarui Mapel. Kode mungkin sudah dipakai." };
	}
}

export async function hapusMapelTkaAction(id: string, tahunAjaranId: string) {
	try {
		await prisma.mataPelajaran.delete({ where: { id } });
		revalidatePath(`/admin/tka/${tahunAjaranId}`);
		return { success: true, message: "Mapel Pilihan TKA berhasil dihapus." };
	} catch (e: any) {
		return { success: false, message: "Gagal menghapus Mapel TKA. Mapel mungkin sedang digunakan." };
	}
}

export async function importMapelTkaMassalAction(formData: FormData, tahunAjaranId: string) {
	try {
		const file = formData.get("file") as File;
		if (!file) return { success: false, message: "File Excel tidak ditemukan!" };

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		const workbook = XLSX.read(buffer, { type: "buffer" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];

		const dataExcel = XLSX.utils.sheet_to_json(worksheet) as any[];

		if (dataExcel.length === 0) {
			return { success: false, message: "File Excel kosong atau format tidak sesuai!" };
		}

		let successCount = 0;

		for (const row of dataExcel) {
			if (!row.Kode_Mapel || !row.Nama_Mapel) continue;

			const kodeStr = String(row.Kode_Mapel).trim();
			const namaStr = String(row.Nama_Mapel).trim();

			await prisma.mataPelajaran.upsert({
				where: { kode: kodeStr },
				update: { nama: namaStr, isTka: true },
				create: { kode: kodeStr, nama: namaStr, isTka: true },
			});

			successCount++;
		}

		revalidatePath(`/admin/tka/${tahunAjaranId}`);
		return { success: true, message: `${successCount} data Mapel Pilihan TKA berhasil diimpor!` };
	} catch (error) {
		console.error("Error import Mapel TKA:", error);
		return { success: false, message: "Gagal memproses file Excel. Pastikan format kolom benar." };
	}
}

// ==============================
// MANAJEMEN ROMBEL TKA
// ==============================
export async function buatRombelAction(nama: string, tahunAjaranId: string) {
	try {
		await prisma.kelas.create({ data: { nama, isTka: true } });
		revalidatePath(`/admin/tka/${tahunAjaranId}`);
		return { success: true, message: "Berhasil membuat rombel TKA." };
	} catch (e: any) {
		return { success: false, message: e.message };
	}
}

export async function hapusRombelAction(kelasId: string, tahunAjaranId: string) {
	try {
		await prisma.kelas.delete({ where: { id: kelasId } });
		revalidatePath(`/admin/tka/${tahunAjaranId}`);
		return { success: true, message: "Rombel TKA berhasil dihapus." };
	} catch (e: any) {
		return { success: false, message: "Gagal menghapus rombel. Pastikan tidak ada data yang terkait." };
	}
}

export async function updateSiswaRombelAction(kelasId: string, siswaIds: string[], tahunAjaranId: string) {
	try {
		await prisma.$transaction(async (tx) => {
			// Hapus riwayat TKA dari rombel ini
			await tx.riwayatKelasSiswa.deleteMany({
				where: { kelasId, tahunAjaranId, isTka: true },
			});

			if (siswaIds.length > 0) {
				// Hapus siswa ini dari rombel TKA manapun di tahun ini agar tidak ada duplikasi
				await tx.riwayatKelasSiswa.deleteMany({
					where: { siswaId: { in: siswaIds }, tahunAjaranId, isTka: true },
				});
				await tx.riwayatKelasSiswa.createMany({
					data: siswaIds.map((id) => ({
						siswaId: id,
						kelasId,
						tahunAjaranId,
						isTka: true,
					})),
				});
			}
		});
		revalidatePath(`/admin/tka/${tahunAjaranId}`);
		return { success: true, message: "Berhasil menyimpan anggota rombel." };
	} catch (e: any) {
		return { success: false, message: e.message };
	}
}

// ==============================
// PENUGASAN GURU TKA (MULTI-GURU)
// ==============================
export async function setTimFasilitatorMapelAction(
	mapelId: string,
	guruIds: string[],
	tahunAjaranId: string
) {
	try {
		await prisma.$transaction(async (tx) => {
			// 1. Update tabel TimFasilitatorTka
			await tx.timFasilitatorTka.deleteMany({
				where: { mapelId, tahunAjaranId }
			});

			if (guruIds.length > 0) {
				await tx.timFasilitatorTka.createMany({
					data: guruIds.map(guruId => ({
						mapelId,
						guruId,
						tahunAjaranId
					}))
				});
			}

			// 2. Sync ke JadwalPelajaran untuk Rombel yang mengambil Mapel ini
			// Cari Rombel mana saja yang mengambil mapel ini
			const jadwalExisting = await tx.jadwalPelajaran.findMany({
				where: { mapelId, tahunAjaranId },
				select: { kelasId: true },
				distinct: ['kelasId']
			});
			const rombelIds = jadwalExisting.map(j => j.kelasId);

			if (rombelIds.length > 0) {
				// Hapus jadwal lama di rombel tersebut untuk mapel ini
				await tx.jadwalPelajaran.deleteMany({
					where: {
						kelasId: { in: rombelIds },
						mapelId,
						tahunAjaranId,
						hari: 0
					}
				});

				// Masukkan jadwal baru (tim baru)
				if (guruIds.length > 0) {
					const jadwalBaru = [];
					for (const kelasId of rombelIds) {
						for (const guruId of guruIds) {
							jadwalBaru.push({
								kelasId,
								mapelId,
								tahunAjaranId,
								guruId,
								hari: 0,
								waktuMulai: "00:00",
								waktuSelesai: "00:00",
								ruang: "-",
							});
						}
					}
					await tx.jadwalPelajaran.createMany({ data: jadwalBaru });
				}
			}
		});
		revalidatePath(`/admin/tka/${tahunAjaranId}`);
		return { success: true, message: "Berhasil menyimpan Tim Fasilitator dan mensinkronisasi ke Rombel." };
	} catch (e: any) {
		return { success: false, message: e.message };
	}
}

// ==============================
// PENUGASAN MAPEL KE ROMBEL (TAB 4)
// ==============================
export async function setMapelRombelAction(
	kelasId: string,
	mapelIds: string[],
	tahunAjaranId: string
) {
	try {
		await prisma.$transaction(async (tx) => {
			// Hapus semua mapel TKA di rombel ini sebelumnya
			await tx.jadwalPelajaran.deleteMany({
				where: {
					kelasId,
					tahunAjaranId,
					hari: 0,
					mapel: { isTka: true }
				}
			});

			if (mapelIds.length > 0) {
				// Cari Tim Fasilitator untuk mapel-mapel tersebut
				const timTka = await tx.timFasilitatorTka.findMany({
					where: {
						mapelId: { in: mapelIds },
						tahunAjaranId
					}
				});

				// Buatkan jadwal baru untuk rombel ini
				if (timTka.length > 0) {
					const jadwalBaru = timTka.map(tim => ({
						kelasId,
						mapelId: tim.mapelId,
						tahunAjaranId,
						guruId: tim.guruId,
						hari: 0,
						waktuMulai: "00:00",
						waktuSelesai: "00:00",
						ruang: "-",
					}));
					await tx.jadwalPelajaran.createMany({ data: jadwalBaru });
				}
			}
		});
		revalidatePath(`/admin/tka/${tahunAjaranId}`);
		return { success: true, message: "Berhasil mengatur Jadwal Mata Pelajaran untuk Rombel ini." };
	} catch (e: any) {
		return { success: false, message: e.message };
	}
}
