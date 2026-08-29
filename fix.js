const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSchedules() {
    const classes = await prisma.kelas.findMany({
        where: {
            OR: [
                { nama: { startsWith: 'XI ' } },
                { nama: { startsWith: 'XII ' } },
                { nama: { startsWith: 'XI-' } },
                { nama: { startsWith: 'XII-' } }
            ]
        },
        include: { waliKelas: true }
    });

    const mapelLitNum = await prisma.mataPelajaran.findMany({
        where: { OR: [{ nama: { contains: 'Literasi' } }, { nama: { contains: 'Numerasi' } }] }
    });
    const mapelIds = mapelLitNum.map(m => m.id);

    if (mapelIds.length === 0) {
        console.log('No Lit/Num mapel found');
        return;
    }

    let updated = 0;
    for (const k of classes) {
        if (k.waliKelas && k.waliKelas.length > 0) {
            const result = await prisma.jadwalPelajaran.updateMany({
                where: { kelasId: k.id, mapelId: { in: mapelIds } },
                data: { guruId: k.waliKelas[0].guruId }
            });
            updated += result.count;
        }
    }
    console.log('Updated schedules: ' + updated);
}

fixSchedules().finally(() => prisma.$disconnect());
