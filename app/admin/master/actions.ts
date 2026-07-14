"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";

// Fungsi untuk menambah data Siswa
// Fungsi untuk menambah data Siswa
export async function tambahSiswaAction(formData: {
	nis: string; // <-- TAMBAHKAN INI
	nisn: string;
	nama: string;
	jenisKelamin: string;
	kelasNama: string;
}) {
	try {
		// 1. Validasi apakah username/NISN sudah terdaftar
		const userExist = await prisma.user.findUnique({
			where: { username: formData.nisn },
		});

		if (userExist) {
			return { success: false, message: "NISN sudah terdaftar di sistem!" };
		}

		// 2. Hash password default 'smanda123'
		const hashedPassword = await bcrypt.hash("smanda123", 10);

		// 3. Ambil Tahun Ajaran yang sedang aktif
		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({
			where: { isActive: true },
		});

		if (!tahunAjaranAktif) {
			return { success: false, message: "Tidak ada Tahun Ajaran aktif yang ditemukan!" };
		}

		// 4. Cari atau buat entitas Kelas
		let kelas = await prisma.kelas.findFirst({
			where: { nama: formData.kelasNama },
		});

		if (!kelas) {
			kelas = await prisma.kelas.create({
				data: { nama: formData.kelasNama },
			});
		}

		// 5. Transaksi Database
		await prisma.$transaction(async (tx) => {
			const newUser = await tx.user.create({
				data: {
					username: formData.nisn, // NISN tetap sebagai username login
					password: hashedPassword,
					nama: formData.nama,
					role: "SISWA",
				},
			});

			const newSiswa = await tx.siswa.create({
				data: {
					userId: newUser.id,
					nis: formData.nis, // <-- TAMBAHKAN INI (Kirim NIS ke database)
					nisn: formData.nisn,
					jenisKelamin: formData.jenisKelamin,
				},
			});

			await tx.riwayatKelasSiswa.create({
				data: {
					siswaId: newSiswa.id,
					kelasId: kelas.id,
					tahunAjaranId: tahunAjaranAktif.id,
				},
			});
		});

		revalidatePath("/admin/master");
		return { success: true, message: "Data Siswa berhasil disimpan!" };
	} catch (error) {
		console.error("Error tambahSiswa:", error);
		return { success: false, message: "Terjadi kesalahan internal pada server." };
	}
}

// Fungsi untuk menambah data Guru
// Fungsi untuk menambah data Guru
export async function tambahGuruAction(formData: { nipNpp: string; nama: string; jenisKelamin: string }) {
	try {
		const userExist = await prisma.user.findUnique({
			where: { username: formData.nipNpp },
		});

		if (userExist) {
			return { success: false, message: "NIP/NPP sudah terdaftar di sistem!" };
		}

		const hashedPassword = await bcrypt.hash("smanda123", 10);

		await prisma.$transaction(async (tx) => {
			const newUser = await tx.user.create({
				data: {
					username: formData.nipNpp,
					password: hashedPassword,
					nama: formData.nama,
					role: "GURU",
				},
			});

			await tx.guru.create({
				data: {
					userId: newUser.id,
					npp: formData.nipNpp, // <-- REVISI DISINI: Ubah dari nipNpp menjadi npp
					jenisKelamin: formData.jenisKelamin,
					status: true,
				},
			});
		});

		revalidatePath("/admin/master");
		return { success: true, message: "Data Guru berhasil disimpan!" };
	} catch (error) {
		console.error("Error tambahGuru:", error);
		return { success: false, message: "Terjadi kesalahan internal pada server." };
	}
}
