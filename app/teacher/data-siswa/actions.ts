"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

// 1. Tambah Siswa Baru
export async function tambahSiswaWaliAction(data: {
	nis: string;
	nisn: string;
	nama: string;
	jenisKelamin: string;
	kelasId: string;
}) {
	try {
		// Cek apakah NISN sudah terpakai
		const cekUser = await prisma.user.findUnique({ where: { username: data.nisn } });
		if (cekUser) return { success: false, message: "NISN sudah terdaftar di sistem." };

		await prisma.$transaction(async (tx) => {
			const userBaru = await tx.user.create({
				data: {
					username: data.nisn,
					password: "smanda123", // Password default
					nama: data.nama,
					role: "SISWA",
				},
			});

			const siswaBaru = await tx.siswa.create({
				data: {
					nis: data.nis,
					nisn: data.nisn,
					jenisKelamin: data.jenisKelamin,
					userId: userBaru.id,
				},
			});

			// Masukkan ke riwayat kelas aktif
			const tahunAktif = await tx.tahunAjaran.findFirst({ where: { isActive: true } });
			if (tahunAktif) {
				await tx.riwayatKelasSiswa.create({
					data: {
						siswaId: siswaBaru.id,
						kelasId: data.kelasId,
						tahunAjaranId: tahunAktif.id,
					},
				});
			}
		});

		revalidatePath("/teacher/data-siswa");
		return { success: true, message: "Siswa berhasil ditambahkan!" };
	} catch (error) {
		return { success: false, message: "Gagal menambahkan siswa." };
	}
}

// 2. Edit Siswa
export async function editSiswaWaliAction(
	siswaId: string,
	data: { nis: string; nisn: string; nama: string; jenisKelamin: string },
) {
	try {
		const siswa = await prisma.siswa.findUnique({ where: { id: siswaId } });
		if (!siswa) return { success: false, message: "Siswa tidak ditemukan." };

		await prisma.$transaction([
			prisma.user.update({
				where: { id: siswa.userId },
				data: { username: data.nisn, nama: data.nama },
			}),
			prisma.siswa.update({
				where: { id: siswaId },
				data: { nis: data.nis, nisn: data.nisn, jenisKelamin: data.jenisKelamin },
			}),
		]);

		revalidatePath("/teacher/data-siswa");
		return { success: true, message: "Data siswa berhasil diubah!" };
	} catch (error) {
		return { success: false, message: "Gagal mengubah data siswa." };
	}
}

// 3. Hapus Siswa (Massal/Satuan)
export async function hapusSiswaWaliAction(ids: string[]) {
	try {
		const siswaList = await prisma.siswa.findMany({ where: { id: { in: ids } } });
		const userIds = siswaList.map((s) => s.userId);

		await prisma.$transaction([
			prisma.riwayatKelasSiswa.deleteMany({ where: { siswaId: { in: ids } } }),
			prisma.siswa.deleteMany({ where: { id: { in: ids } } }),
			prisma.user.deleteMany({ where: { id: { in: userIds } } }),
		]);

		revalidatePath("/teacher/data-siswa");
		return { success: true, message: `${ids.length} Siswa berhasil dihapus.` };
	} catch (error) {
		return { success: false, message: "Gagal menghapus siswa." };
	}
}

// 4. Import Excel Khusus Wali Kelas
export async function importSiswaWaliAction(formData: FormData, kelasId: string) {
	try {
		const file = formData.get("file") as File;
		if (!file) return { success: false, message: "File tidak ditemukan." };

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const workbook = XLSX.read(buffer, { type: "buffer" });
		const sheetName = workbook.SheetNames[0];
		const sheet = workbook.Sheets[sheetName];
		const dataJson: any[] = XLSX.utils.sheet_to_json(sheet);

		const tahunAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
		if (!tahunAktif) return { success: false, message: "Tidak ada Tahun Ajaran aktif." };

		let successCount = 0;

		for (const row of dataJson) {
			const nisnStr = String(row.NISN || "").trim();
			if (!nisnStr) continue;

			const existingUser = await prisma.user.findUnique({ where: { username: nisnStr } });
			if (!existingUser) {
				const newUser = await prisma.user.create({
					data: {
						username: nisnStr,
						password: "smanda123",
						nama: row.Nama_Lengkap || "Siswa Baru",
						role: "SISWA",
					},
				});

				const newSiswa = await prisma.siswa.create({
					data: {
						nis: String(row.NIS || ""),
						nisn: nisnStr,
						jenisKelamin: row.Jenis_Kelamin === "Perempuan" ? "P" : "L",
						userId: newUser.id,
					},
				});

				await prisma.riwayatKelasSiswa.create({
					data: {
						siswaId: newSiswa.id,
						kelasId: kelasId,
						tahunAjaranId: tahunAktif.id,
					},
				});
				successCount++;
			}
		}

		revalidatePath("/teacher/data-siswa");
		return { success: true, message: `Berhasil mengimport ${successCount} siswa ke kelas Anda.` };
	} catch (error) {
		return { success: false, message: "Terjadi kesalahan saat memproses Excel." };
	}
}
