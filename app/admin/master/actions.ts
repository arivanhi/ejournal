"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";
import { Role } from "@prisma/client"; // <-- KUNCI PERBAIKAN: Import Enum

// ==========================================
// FITUR RESET PASSWORD
// ==========================================
export async function resetPasswordAction(userId: string) {
	try {
		const hashedPassword = await bcrypt.hash("smanda123", 10);
		await prisma.user.update({
			where: { id: userId },
			data: { password: hashedPassword },
		});
		return { success: true, message: "Password berhasil direset menjadi 'smanda123'!" };
	} catch (error) {
		console.error("Error reset password:", error);
		return { success: false, message: "Terjadi kesalahan saat mereset password." };
	}
}

// ==========================================
// CRUD SISWA
// ==========================================
export async function tambahSiswaAction(formData: {
	nis: string;
	nisn: string;
	nama: string;
	jenisKelamin: string;
	kelasNama: string;
}) {
	try {
		const userExist = await prisma.user.findUnique({
			where: { username: formData.nisn },
		});

		if (userExist) {
			return { success: false, message: "NISN sudah terdaftar di sistem!" };
		}

		const hashedPassword = await bcrypt.hash("smanda123", 10);
		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({
			where: { isActive: true },
		});

		if (!tahunAjaranAktif) {
			return { success: false, message: "Tidak ada Tahun Ajaran aktif yang ditemukan!" };
		}

		let kelas = await prisma.kelas.findFirst({
			where: { nama: formData.kelasNama },
		});

		if (!kelas) {
			kelas = await prisma.kelas.create({
				data: { nama: formData.kelasNama },
			});
		}

		await prisma.$transaction(async (tx) => {
			const newUser = await tx.user.create({
				data: {
					username: formData.nisn,
					password: hashedPassword,
					nama: formData.nama,
					role: Role.SISWA, // <-- Perbaikan menggunakan Enum
				},
			});

			const newSiswa = await tx.siswa.create({
				data: {
					userId: newUser.id,
					nis: formData.nis,
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

export async function editSiswaAction(
	id: string,
	formData: { nis: string; nisn: string; nama: string; jenisKelamin: string; kelasNama: string },
) {
	try {
		const siswa = await prisma.siswa.findUnique({ where: { id }, include: { user: true } });
		if (!siswa) return { success: false, message: "Data siswa tidak ditemukan!" };

		if (siswa.nisn !== formData.nisn) {
			const exist = await prisma.user.findUnique({ where: { username: formData.nisn } });
			if (exist) return { success: false, message: "NISN sudah dipakai akun lain!" };
		}

		const tahunAjaranAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
		let kelas = await prisma.kelas.findFirst({ where: { nama: formData.kelasNama } });
		if (!kelas) kelas = await prisma.kelas.create({ data: { nama: formData.kelasNama } });

		await prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: siswa.userId },
				data: { username: formData.nisn, nama: formData.nama },
			});
			await tx.siswa.update({
				where: { id },
				data: { nis: formData.nis, nisn: formData.nisn, jenisKelamin: formData.jenisKelamin },
			});

			if (tahunAjaranAktif) {
				const riwayatExist = await tx.riwayatKelasSiswa.findFirst({
					where: { siswaId: id, tahunAjaranId: tahunAjaranAktif.id },
				});

				if (riwayatExist) {
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

export async function hapusSiswaAction(ids: string[]) {
	try {
		const siswaRecords = await prisma.siswa.findMany({ where: { id: { in: ids } } });
		const userIds = siswaRecords.map((s) => s.userId);

		await prisma.user.deleteMany({ where: { id: { in: userIds } } });

		revalidatePath("/admin/master");
		return { success: true, message: `${ids.length} data Siswa berhasil dihapus!` };
	} catch (error) {
		console.error("Error hapusSiswa:", error);
		return { success: false, message: "Terjadi kesalahan saat menghapus data." };
	}
}

// ==========================================
// CRUD GURU & STAF
// ==========================================
export async function tambahGuruAction(formData: { nipNpp: string; nama: string; jenisKelamin: string; role: string }) {
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
					role: formData.role as Role, // <-- Casting agar Prisma tidak error
				},
			});

			await tx.guru.create({
				data: {
					userId: newUser.id,
					npp: formData.nipNpp,
					jenisKelamin: formData.jenisKelamin,
					status: true,
				},
			});
		});

		revalidatePath("/admin/master");
		return { success: true, message: "Data Guru/Staf berhasil disimpan!" };
	} catch (error) {
		console.error("Error tambahGuru:", error);
		return { success: false, message: "Terjadi kesalahan internal pada server." };
	}
}

export async function editGuruAction(
	userId: string,
	formData: { nipNpp: string; nama: string; jenisKelamin: string; status: boolean; role: string },
) {
	try {
		const user = await prisma.user.findUnique({ where: { id: userId }, include: { guru: true } });
		if (!user) return { success: false, message: "Data guru/staf tidak ditemukan!" };

		if (user.username !== formData.nipNpp) {
			const exist = await prisma.user.findUnique({ where: { username: formData.nipNpp } });
			if (exist) return { success: false, message: "NIP/NPP sudah dipakai akun lain!" };
		}

		await prisma.$transaction(async (tx) => {
			await tx.user.update({
				where: { id: userId },
				data: { username: formData.nipNpp, nama: formData.nama, role: formData.role as Role }, // Casting Role
			});

			if (user.guru) {
				await tx.guru.update({
					where: { id: user.guru.id },
					data: { npp: formData.nipNpp, jenisKelamin: formData.jenisKelamin, status: formData.status },
				});
			} else {
				await tx.guru.create({
					data: { userId: userId, npp: formData.nipNpp, jenisKelamin: formData.jenisKelamin, status: formData.status },
				});
			}
		});

		revalidatePath("/admin/master");
		return { success: true, message: "Data berhasil diperbarui!" };
	} catch (error) {
		console.error("Error editGuru:", error);
		return { success: false, message: "Terjadi kesalahan saat memperbarui data." };
	}
}

export async function hapusGuruAction(userIds: string[]) {
	try {
		await prisma.user.deleteMany({ where: { id: { in: userIds } } });

		revalidatePath("/admin/master");
		return { success: true, message: `${userIds.length} data Guru/Staf berhasil dihapus!` };
	} catch (error) {
		console.error("Error hapusGuru:", error);
		return { success: false, message: "Terjadi kesalahan saat menghapus data." };
	}
}

// ==========================================
// IMPORT MASSAL EXCEL
// ==========================================
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
		const hashedPassword = await bcrypt.hash("smanda123", 10);

		for (const row of dataExcel) {
			if (!row.NISN || !row.Kelas_Tujuan) continue;

			const nisnStr = String(row.NISN).trim();
			const namaKelasStr = String(row.Kelas_Tujuan).trim();

			const namaStr = row.Nama_Lengkap ? String(row.Nama_Lengkap).trim() : "Siswa Tanpa Nama";
			const nisStr = row.NIS ? String(row.NIS).trim() : nisnStr.slice(-4);
			const jkStr = row.Jenis_Kelamin ? String(row.Jenis_Kelamin).trim() : "Laki-laki";

			await prisma.$transaction(async (tx) => {
				let siswa = await tx.siswa.findUnique({ where: { nisn: nisnStr } });

				if (!siswa) {
					const newUser = await tx.user.create({
						data: {
							username: nisnStr,
							password: hashedPassword,
							nama: namaStr,
							role: Role.SISWA,
						},
					});
					siswa = await tx.siswa.create({
						data: {
							userId: newUser.id,
							nisn: nisnStr,
							nis: nisStr,
							jenisKelamin: jkStr,
						},
					});
				} else if (siswa && row.Nama_Lengkap) {
					await tx.user.update({
						where: { id: siswa.userId },
						data: { nama: namaStr },
					});
				}

				let kelas = await tx.kelas.findFirst({ where: { nama: namaKelasStr } });
				if (!kelas) {
					kelas = await tx.kelas.create({ data: { nama: namaKelasStr } });
				}

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
		return { success: true, message: `${successCount} data siswa berhasil diproses!` };
	} catch (error) {
		console.error("Error upload Excel:", error);
		return { success: false, message: "Gagal memproses file Excel. Pastikan format kolom benar." };
	}
}

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
			const roleStr = row.Role || "GURU";

			await prisma.$transaction(async (tx) => {
				let guru = await tx.guru.findUnique({ where: { npp: nppStr }, include: { user: true } });

				if (!guru) {
					const newUser = await tx.user.create({
						data: {
							username: nppStr,
							password: hashedPassword,
							nama: namaStr,
							role: roleStr as Role, // <-- Casting
						},
					});
					await tx.guru.create({
						data: {
							userId: newUser.id,
							npp: nppStr,
							jenisKelamin: jkStr,
							status: true,
						},
					});
					successCount++;
				} else {
					await tx.user.update({
						where: { id: guru.userId },
						data: { nama: namaStr, role: roleStr as Role }, // <-- Casting
					});
				}
			});
		}

		revalidatePath("/admin/master");
		return { success: true, message: `${successCount} data Staf/Guru baru berhasil diimpor ke sistem!` };
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
		await prisma.mataPelajaran.deleteMany({ where: { id: { in: ids } } });
		revalidatePath("/admin/master");
		return { success: true, message: `${ids.length} Mata Pelajaran berhasil dihapus!` };
	} catch (error: any) {
		console.error("Error hapusMapel:", error);
		if (error.code === "P2003") {
			return { success: false, message: "Gagal menghapus: Mapel sedang digunakan pada pemetaan (Manajemen Mapel)!" };
		}
		return { success: false, message: "Terjadi kesalahan saat menghapus data." };
	}
}

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

// ==========================================
// ACTIONS UNTUK TAHUN AJARAN & PEMETAAN
// ==========================================
export async function tambahTahunAjarAction(data: { nama: string; isActive: boolean }) {
	try {
		if (data.isActive) {
			await prisma.tahunAjaran.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			});
		}
		await prisma.tahunAjaran.create({
			data: { nama: data.nama, isActive: data.isActive },
		});
		revalidatePath("/admin/master");
		return { success: true, message: "Tahun Ajaran berhasil ditambahkan!" };
	} catch (error) {
		console.error("Error tambah tahun ajar:", error);
		return { success: false, message: "Gagal menambahkan Tahun Ajaran." };
	}
}

export async function editTahunAjarAction(id: string, data: { nama: string; isActive: boolean }) {
	try {
		if (data.isActive) {
			await prisma.tahunAjaran.updateMany({
				where: { id: { not: id }, isActive: true },
				data: { isActive: false },
			});
		}
		await prisma.tahunAjaran.update({
			where: { id },
			data: { nama: data.nama, isActive: data.isActive },
		});
		revalidatePath("/admin/master");
		return { success: true, message: "Tahun Ajaran berhasil diperbarui!" };
	} catch (error) {
		console.error("Error edit tahun ajar:", error);
		return { success: false, message: "Gagal memperbarui Tahun Ajaran." };
	}
}

export async function hapusTahunAjarAction(ids: string[]) {
	try {
		await prisma.tahunAjaran.deleteMany({
			where: { id: { in: ids } },
		});
		revalidatePath("/admin/master");
		return { success: true, message: `${ids.length} Tahun Ajaran berhasil dihapus!` };
	} catch (error) {
		console.error("Error hapus tahun ajar:", error);
		return { success: false, message: "Gagal menghapus Tahun Ajaran. Pastikan data ini tidak sedang digunakan." };
	}
}

export async function simpanPemetaanMapelAction(tahunAjarId: string, mapelIds: string[]) {
	try {
		await prisma.tahunAjaran.update({
			where: { id: tahunAjarId },
			data: {
				mataPelajaran: {
					set: mapelIds.map((id) => ({ id })),
				},
			},
		});
		revalidatePath("/admin/master");
		return { success: true, message: "Pemetaan mata pelajaran berhasil disimpan!" };
	} catch (error) {
		console.error("Error simpan pemetaan:", error);
		return { success: false, message: "Gagal menyimpan pemetaan. Pastikan relasi database sesuai." };
	}
}

// ==========================================
// ACTIONS UNTUK KELAS
// ==========================================
export async function tambahKelasAction(nama: string) {
	try {
		const existing = await prisma.kelas.findUnique({ where: { nama } });
		if (existing) {
			return { success: false, message: `Kelas dengan nama "${nama}" sudah ada.` };
		}
		await prisma.kelas.create({ data: { nama } });
		revalidatePath("/admin/master");
		return { success: true, message: "Kelas berhasil ditambahkan!" };
	} catch (error) {
		console.error("Error tambah kelas:", error);
		return { success: false, message: "Terjadi kesalahan saat menambahkan kelas." };
	}
}

export async function editKelasAction(id: string, nama: string) {
	try {
		const existing = await prisma.kelas.findUnique({ where: { nama } });
		if (existing && existing.id !== id) {
			return { success: false, message: `Kelas dengan nama "${nama}" sudah ada.` };
		}
		await prisma.kelas.update({
			where: { id },
			data: { nama },
		});
		revalidatePath("/admin/master");
		return { success: true, message: "Kelas berhasil diperbarui!" };
	} catch (error) {
		console.error("Error edit kelas:", error);
		return { success: false, message: "Terjadi kesalahan saat memperbarui kelas." };
	}
}

export async function hapusKelasAction(ids: string[]) {
	try {
		await prisma.kelas.deleteMany({
			where: { id: { in: ids } },
		});
		revalidatePath("/admin/master");
		return { success: true, message: `${ids.length} Kelas berhasil dihapus!` };
	} catch (error) {
		console.error("Error hapus kelas:", error);
		return { success: false, message: "Terjadi kesalahan saat menghapus kelas. Mungkin sedang digunakan di tabel lain." };
	}
}

