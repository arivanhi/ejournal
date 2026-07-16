"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

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

// Fungsi untuk mengedit data Siswa
export async function editSiswaAction(
	id: string,
	formData: { nis: string; nisn: string; nama: string; jenisKelamin: string; kelasNama: string },
) {
	try {
		const siswa = await prisma.siswa.findUnique({ where: { id }, include: { user: true } });
		if (!siswa) return { success: false, message: "Data siswa tidak ditemukan!" };

		// Jika NISN diubah, cek apakah NISN baru sudah dipakai orang lain
		if (siswa.nisn !== formData.nisn) {
			const exist = await prisma.user.findUnique({ where: { username: formData.nisn } });
			if (exist) return { success: false, message: "NISN sudah dipakai akun lain!" };
		}

		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

		let kelas = await prisma.kelas.findFirst({ where: { nama: formData.kelasNama } });
		if (!kelas) kelas = await prisma.kelas.create({ data: { nama: formData.kelasNama } });

		await prisma.$transaction(async (tx) => {
			// Update User
			await tx.user.update({
				where: { id: siswa.userId },
				data: { username: formData.nisn, nama: formData.nama },
			});
			// Update Siswa
			await tx.siswa.update({
				where: { id },
				data: { nis: formData.nis, nisn: formData.nisn, jenisKelamin: formData.jenisKelamin },
			});

			// Update atau buat Riwayat Kelas
			if (tahunAjaranAktif) {
				const riwayatExist = await tx.riwayatKelasSiswa.findFirst({
					where: { siswaId: id, tahunAjaranId: tahunAjaranAktif.id },
				});

				if (riwayatExist) {
					// REVISI TYPO: Sebelumnya tx.tx, sekarang cukup tx
					await tx.riwayatKelasSiswa.update({
						where: { id: riwayatExist.id },
						data: { kelasId: kelas.id },
					});
				} else {
					await tx.riwayatKelasSiswa.create({
						data: { siswaId: id, kelasId: kelas.id, tahunAjaranId: tahunAjaranAktif.id },
					});
				}
			}
		});

		revalidatePath("/admin/master");
		return { success: true, message: "Data Siswa berhasil diperbarui!" };
	} catch (error) {
		console.error("Error editSiswa:", error);
		return { success: false, message: "Terjadi kesalahan saat memperbarui data." };
	}
}

// Fungsi untuk mengedit data Guru
export async function editGuruAction(
	id: string,
	formData: { nipNpp: string; nama: string; jenisKelamin: string; status: boolean }, // <-- Tambah status
) {
	try {
		const guru = await prisma.guru.findUnique({ where: { id }, include: { user: true } });
		if (!guru) return { success: false, message: "Data guru tidak ditemukan!" };

		if (guru.npp !== formData.nipNpp) {
			const exist = await prisma.user.findUnique({ where: { username: formData.nipNpp } });
			if (exist) return { success: false, message: "NIP/NPP sudah dipakai akun lain!" };
		}

		await prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: guru.userId },
				data: { username: formData.nipNpp, nama: formData.nama },
			});
			await tx.guru.update({
				where: { id },
				// REVISI: Sisipkan data status untuk diperbarui
				data: { npp: formData.nipNpp, jenisKelamin: formData.jenisKelamin, status: formData.status },
			});
		});

		revalidatePath("/admin/master");
		return { success: true, message: "Data Guru berhasil diperbarui!" };
	} catch (error) {
		console.error("Error editGuru:", error);
		return { success: false, message: "Terjadi kesalahan saat memperbarui data." };
	}
}

// Fungsi untuk menghapus data Siswa (Satu atau Massal)
export async function hapusSiswaAction(ids: string[]) {
	try {
		// Cari data Siswa untuk mendapatkan userId-nya
		const siswaRecords = await prisma.siswa.findMany({ where: { id: { in: ids } } });
		const userIds = siswaRecords.map((s) => s.userId);

		// Hapus dari tabel User (Data di tabel Siswa dan Riwayat otomatis terhapus karena Cascade)
		await prisma.user.deleteMany({ where: { id: { in: userIds } } });

		revalidatePath("/admin/master");
		return { success: true, message: `${ids.length} data Siswa berhasil dihapus!` };
	} catch (error) {
		console.error("Error hapusSiswa:", error);
		return { success: false, message: "Terjadi kesalahan saat menghapus data." };
	}
}

// Fungsi untuk menghapus data Guru (Satu atau Massal)
export async function hapusGuruAction(ids: string[]) {
	try {
		const guruRecords = await prisma.guru.findMany({ where: { id: { in: ids } } });
		const userIds = guruRecords.map((g) => g.userId);

		await prisma.user.deleteMany({ where: { id: { in: userIds } } });

		revalidatePath("/admin/master");
		return { success: true, message: `${ids.length} data Guru berhasil dihapus!` };
	} catch (error) {
		console.error("Error hapusGuru:", error);
		return { success: false, message: "Terjadi kesalahan saat menghapus data." };
	}
}

// Fungsi untuk memproses Upload Excel Assign Kelas Massal & Import Siswa Baru
export async function assignKelasMassalAction(formData: FormData) {
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

		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
		if (!tahunAjaranAktif) {
			return { success: false, message: "Tidak ada Tahun Ajaran aktif!" };
		}

		let successCount = 0;
		// Cache password hash agar tidak perlu di-hash berulang kali di dalam loop
		const hashedPassword = await bcrypt.hash("smanda123", 10);

		for (const row of dataExcel) {
			// Pastikan kolom wajib ada
			if (!row.NISN || !row.Kelas_Tujuan) continue;

			const nisnStr = String(row.NISN).trim();
			const namaKelasStr = String(row.Kelas_Tujuan).trim();

			// Ambil data tambahan untuk pembuatan siswa baru (gunakan fallback jika kosong)
			const namaStr = row.Nama_Lengkap ? String(row.Nama_Lengkap).trim() : "Siswa Tanpa Nama";
			const nisStr = row.NIS ? String(row.NIS).trim() : nisnStr.slice(-4); // Ambil 4 digit terakhir NISN sebagai fallback NIS
			const jkStr = row.Jenis_Kelamin ? String(row.Jenis_Kelamin).trim() : "Laki-laki";

			await prisma.$transaction(async (tx) => {
				// 1. Cek atau Buat Siswa Baru
				let siswa = await tx.siswa.findUnique({ where: { nisn: nisnStr } });

				if (!siswa) {
					// Buat akun login
					const newUser = await tx.user.create({
						data: {
							username: nisnStr,
							password: hashedPassword,
							nama: namaStr,
							role: "SISWA",
						},
					});
					// Buat profil siswa
					siswa = await tx.siswa.create({
						data: {
							userId: newUser.id,
							nisn: nisnStr,
							nis: nisStr,
							jenisKelamin: jkStr,
						},
					});
				} else if (siswa && row.Nama_Lengkap) {
					// Opsional: Update nama jika data Excel memiliki nama yang berbeda
					await tx.user.update({
						where: { id: siswa.userId },
						data: { nama: namaStr },
					});
				}

				// 2. Cek atau Buat Kelas
				let kelas = await tx.kelas.findFirst({ where: { nama: namaKelasStr } });
				if (!kelas) {
					kelas = await tx.kelas.create({ data: { nama: namaKelasStr } });
				}

				// 3. Masukkan ke Riwayat Kelas Tahun Ajaran Aktif
				const riwayatExist = await tx.riwayatKelasSiswa.findFirst({
					where: { siswaId: siswa.id, tahunAjaranId: tahunAjaranAktif.id },
				});

				if (riwayatExist) {
					await tx.riwayatKelasSiswa.update({
						where: { id: riwayatExist.id },
						data: { kelasId: kelas.id },
					});
				} else {
					await tx.riwayatKelasSiswa.create({
						data: { siswaId: siswa.id, kelasId: kelas.id, tahunAjaranId: tahunAjaranAktif.id },
					});
				}
			});

			successCount++;
		}

		revalidatePath("/admin/master");
		return { success: true, message: `${successCount} data siswa berhasil diproses (diimpor & diassign)!` };
	} catch (error) {
		console.error("Error upload Excel:", error);
		return { success: false, message: "Gagal memproses file Excel. Pastikan format kolom benar." };
	}
}

// Fungsi untuk memproses Upload Excel Import Guru Massal
export async function importGuruMassalAction(formData: FormData) {
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
		const hashedPassword = await bcrypt.hash("smanda123", 10);

		for (const row of dataExcel) {
			if (!row.NPP || !row.Nama_Lengkap) continue;

			const nppStr = String(row.NPP).trim();
			const namaStr = String(row.Nama_Lengkap).trim();
			const jkStr = row.Jenis_Kelamin ? String(row.Jenis_Kelamin).trim() : "Laki-laki";

			await prisma.$transaction(async (tx) => {
				// Cek apakah NPP sudah terdaftar
				let guru = await tx.guru.findUnique({ where: { npp: nppStr } });

				if (!guru) {
					// Buat user login baru
					const newUser = await tx.user.create({
						data: {
							username: nppStr,
							password: hashedPassword,
							nama: namaStr,
							role: "GURU",
						},
					});
					// Buat profil guru
					await tx.guru.create({
						data: {
							userId: newUser.id,
							npp: nppStr,
							jenisKelamin: jkStr,
						},
					});
					successCount++;
				} else {
					// Jika guru sudah ada, perbarui namanya saja
					await tx.user.update({
						where: { id: guru.userId },
						data: { nama: namaStr },
					});
				}
			});
		}

		revalidatePath("/admin/master");
		return { success: true, message: `${successCount} data Guru baru berhasil diimpor ke sistem!` };
	} catch (error) {
		console.error("Error import Guru:", error);
		return { success: false, message: "Gagal memproses file Excel Guru. Pastikan format benar." };
	}
}

// ==========================================
// CRUD MATA PELAJARAN
// ==========================================

export async function tambahMapelAction(formData: { kode: string; nama: string }) {
	try {
		const exist = await prisma.mataPelajaran.findUnique({ where: { kode: formData.kode } });
		if (exist) return { success: false, message: "Kode Mapel sudah terdaftar!" };

		await prisma.mataPelajaran.create({
			data: { kode: formData.kode, nama: formData.nama },
		});

		revalidatePath("/admin/master");
		return { success: true, message: "Data Mata Pelajaran berhasil ditambahkan!" };
	} catch (error) {
		console.error("Error tambahMapel:", error);
		return { success: false, message: "Terjadi kesalahan internal pada server." };
	}
}

export async function editMapelAction(id: string, formData: { kode: string; nama: string }) {
	try {
		const mapel = await prisma.mataPelajaran.findUnique({ where: { id } });
		if (!mapel) return { success: false, message: "Data Mapel tidak ditemukan!" };

		if (mapel.kode !== formData.kode) {
			const exist = await prisma.mataPelajaran.findUnique({ where: { kode: formData.kode } });
			if (exist) return { success: false, message: "Kode Mapel sudah terpakai!" };
		}

		await prisma.mataPelajaran.update({
			where: { id },
			data: { kode: formData.kode, nama: formData.nama },
		});

		revalidatePath("/admin/master");
		return { success: true, message: "Data Mata Pelajaran berhasil diperbarui!" };
	} catch (error) {
		console.error("Error editMapel:", error);
		return { success: false, message: "Terjadi kesalahan internal pada server." };
	}
}

export async function hapusMapelAction(ids: string[]) {
	try {
		// Menghapus data mapel.
		// Catatan: Jika ada error constraint (sedang dipakai di relasi jadwal), akan ditangkap oleh catch
		await prisma.mataPelajaran.deleteMany({ where: { id: { in: ids } } });

		revalidatePath("/admin/master");
		return { success: true, message: `${ids.length} Mata Pelajaran berhasil dihapus!` };
	} catch (error: any) {
		console.error("Error hapusMapel:", error);
		// P2003 adalah kode error Prisma jika data sedang dipakai di tabel relasi lain
		if (error.code === "P2003") {
			return { success: false, message: "Gagal menghapus: Mapel sedang digunakan pada pemetaan (Manajemen Mapel)!" };
		}
		return { success: false, message: "Terjadi kesalahan saat menghapus data." };
	}
}

// Fungsi untuk memproses Upload Excel Import Mapel Massal
export async function importMapelMassalAction(formData: FormData) {
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

			// Gunakan upsert: jika kode sudah ada maka update namanya, jika belum ada maka buat baru
			await prisma.mataPelajaran.upsert({
				where: { kode: kodeStr },
				update: { nama: namaStr },
				create: { kode: kodeStr, nama: namaStr },
			});

			successCount++;
		}

		revalidatePath("/admin/master");
		return { success: true, message: `${successCount} Mata Pelajaran berhasil diimpor secara massal!` };
	} catch (error) {
		console.error("Error import Mapel Massal:", error);
		return { success: false, message: "Gagal memproses file Excel Mapel." };
	}
}
