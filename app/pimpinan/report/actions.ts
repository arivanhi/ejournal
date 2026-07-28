"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function savePdcaAction(
	tahunAjaranId: string,
	tipe: "Rekomendasi" | "RencanaAksi",
	data: any,
	userId: string, // <-- Kita tangkap User ID langsung dari Client
) {
	try {
		// Cari data PDCA berdasarkan Tahun Ajaran
		let pdca = await prisma.laporanPdca.findFirst({
			where: { tahunAjaranId },
		});

		// Jika belum ada di database, buat kerangkanya (DRAFT)
		if (!pdca) {
			pdca = await prisma.laporanPdca.create({
				data: {
					tahunAjaranId: tahunAjaranId,
					judul: "Laporan Evaluasi Akademik",
					pembuatId: userId,
					planProblem: "-",
					planRootCause: "-",
					checkFakta: "-",
					checkGap: "-",
					actRekomendasi: "-",
					doImplementasi: [], // Set array kosong untuk JSON
				},
			});
		}

		// Simpan sesuai Tipe Aksi
		if (tipe === "Rekomendasi") {
			await prisma.laporanPdca.update({
				where: { id: pdca.id },
				data: { actRekomendasi: data.teks },
			});
		} else if (tipe === "RencanaAksi") {
			// Parse array JSON yang sudah ada
			const currentImpl: any[] = pdca.doImplementasi ? JSON.parse(JSON.stringify(pdca.doImplementasi)) : [];

			// Cek apakah aspek tersebut sudah ada
			const index = currentImpl.findIndex((item: any) => item.aspek === data.aspek);
			if (index !== -1) {
				currentImpl[index] = data; // Timpa jika aspek sudah ada (Update)
			} else {
				currentImpl.push(data); // Tambah baru jika belum ada
			}

			await prisma.laporanPdca.update({
				where: { id: pdca.id },
				data: { doImplementasi: currentImpl },
			});
		}

		// Segarkan halaman agar tabel otomatis menarik data terbaru
		revalidatePath("/pimpinan/report");
		return { success: true, message: "Data berhasil disimpan!" };
	} catch (error: any) {
		console.error("ERROR SAVE PDCA:", error);
		return { success: false, message: error?.message || "Terjadi kesalahan di server." };
	}
}
