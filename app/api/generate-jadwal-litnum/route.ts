import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const activeTahunAjar = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    });

    if (!activeTahunAjar) {
      return NextResponse.json({ error: "No active academic year found." }, { status: 400 });
    }

    // Cari mapel Literasi dan Numerasi
    const litMapel = await prisma.mataPelajaran.findFirst({ where: { nama: { contains: "Literasi" } } });
    const numMapel = await prisma.mataPelajaran.findFirst({ where: { nama: { contains: "Numerasi" } } });

    if (!litMapel || !numMapel) {
      return NextResponse.json({ error: "Mata pelajaran Literasi/Numerasi belum ada." }, { status: 400 });
    }

    // Ambil kelas XI dan XII yang bukan TKA
    const kelasLitnum = await prisma.kelas.findMany({
      where: {
        isTka: false,
        OR: [
          { nama: { startsWith: "XI-" } },
          { nama: { startsWith: "XII-" } },
          { nama: { startsWith: "XI " } },
          { nama: { startsWith: "XII " } },
        ]
      },
      include: {
        waliKelas: true
      }
    });

    let countLit = 0;
    let countNum = 0;

    for (const kelas of kelasLitnum) {
      const wali = kelas.waliKelas[0]; // Ambil wali kelas pertama (karena relasi many-to-many tapi logikanya 1 kelas 1 wali)
      if (!wali) continue;

      const ruangKelas = kelas.tempat || kelas.nama;

      // Cek jadwal Literasi (Selasa = 2)
      const existingLit = await prisma.jadwalPelajaran.findFirst({
        where: {
          kelasId: kelas.id,
          tahunAjaranId: activeTahunAjar.id,
          mapelId: litMapel.id,
          hari: 2
        }
      });

      if (!existingLit) {
        await prisma.jadwalPelajaran.create({
          data: {
            guruId: wali.guruId,
            mapelId: litMapel.id,
            kelasId: kelas.id,
            tahunAjaranId: activeTahunAjar.id,
            hari: 2, // Selasa
            waktuMulai: "1",
            waktuSelesai: "-",
            ruang: ruangKelas
          }
        });
        countLit++;
      } else {
        const updateData: any = {};
        if (!existingLit.ruang || existingLit.ruang.trim() === "") updateData.ruang = ruangKelas;
        if (existingLit.guruId !== wali.guruId) updateData.guruId = wali.guruId;
        
        if (Object.keys(updateData).length > 0) {
          await prisma.jadwalPelajaran.update({
            where: { id: existingLit.id },
            data: updateData
          });
        }
      }

      // Cek jadwal Numerasi (Kamis = 4)
      const existingNum = await prisma.jadwalPelajaran.findFirst({
        where: {
          kelasId: kelas.id,
          tahunAjaranId: activeTahunAjar.id,
          mapelId: numMapel.id,
          hari: 4
        }
      });

      if (!existingNum) {
        await prisma.jadwalPelajaran.create({
          data: {
            guruId: wali.guruId,
            mapelId: numMapel.id,
            kelasId: kelas.id,
            tahunAjaranId: activeTahunAjar.id,
            hari: 4, // Kamis
            waktuMulai: "1",
            waktuSelesai: "-",
            ruang: ruangKelas
          }
        });
        countNum++;
      } else {
        const updateData: any = {};
        if (!existingNum.ruang || existingNum.ruang.trim() === "") updateData.ruang = ruangKelas;
        if (existingNum.guruId !== wali.guruId) updateData.guruId = wali.guruId;
        
        if (Object.keys(updateData).length > 0) {
          await prisma.jadwalPelajaran.update({
            where: { id: existingNum.id },
            data: updateData
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menambahkan ${countLit} jadwal Literasi dan ${countNum} jadwal Numerasi.`
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
