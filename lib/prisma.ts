import { PrismaClient } from "@prisma/client";

// Mengamankan Prisma Client dari hot-reloading Next.js di mode development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
