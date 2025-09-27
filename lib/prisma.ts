// lib/prisma.ts
import { PrismaClient, Prisma } from '@prisma/client';

const g = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaDirect?: PrismaClient;
};

const logs: (Prisma.LogLevel | Prisma.LogDefinition)[] =
  process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['query', 'warn', 'error'];

export const prisma = g.prisma ?? new PrismaClient({ log: logs });

// 👇 direct (NO pooler) for interactive transactions
export const prismaDirect =
  g.prismaDirect ??
  new PrismaClient({
    log: logs,
    datasources: { db: { url: process.env.DIRECT_URL! } }, // supabase :5432
  });

if (process.env.NODE_ENV !== 'production') {
  g.prisma = prisma;
  g.prismaDirect = prismaDirect;
}
