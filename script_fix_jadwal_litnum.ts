import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Memulai proses perbaikan jadwal Literasi & Numerasi yang sudah ada...");

    // Cari mapel Literasi
    const mapelLit = await prisma.mataPelajaran.findFirst({ where: { nama: { contains: "Literasi" } } });
    // Cari mapel Numerasi
    const mapelNum = await prisma.mataPelajaran.findFirst({ where: { nama: { contains: "Numerasi" } } });

    if (!mapelLit || !mapelNum) {
        console.error("Mata pelajaran Literasi atau Numerasi tidak ditemukan.");
        return;
    }

    // 1. Pindahkan semua jadwal Literasi yang ada di hari Selasa (2) ke hari Kamis (4)
    const updateLit = await prisma.jadwalPelajaran.updateMany({
        where: {
            mapelId: mapelLit.id,
            hari: 2
        },
        data: {
            hari: 4
        }
    });
    console.log(`Berhasil mengubah ${updateLit.count} jadwal Literasi dari Selasa ke Kamis.`);

    // 2. Pindahkan semua jadwal Numerasi yang ada di hari Kamis (4) ke hari Selasa (2)
    const updateNum = await prisma.jadwalPelajaran.updateMany({
        where: {
            mapelId: mapelNum.id,
            hari: 4
        },
        data: {
            hari: 2
        }
    });
    console.log(`Berhasil mengubah ${updateNum.count} jadwal Numerasi dari Kamis ke Selasa.`);

    console.log("Proses perbaikan jadwal selesai.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
