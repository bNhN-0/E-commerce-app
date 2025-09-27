// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const make = (datasourceUrl?: string) =>
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? (["warn", "error"] as const) : (["error"] as const),
  });

// Keep instances on globalThis to avoid re-creating in dev (HMR)
type GlobalPrisma = {
  prisma?: PrismaClient;
  prismaDirect?: PrismaClient;
};
const globalForPrisma = globalThis as unknown as GlobalPrisma;

// Pooled (PgBouncer) — typical DATABASE_URL
export const prisma =
  globalForPrisma.prisma ?? make(process.env.DATABASE_URL);

// Direct (primary) — use DIRECT_URL if present, otherwise fall back to DATABASE_URL
export const prismaDirect =
  globalForPrisma.prismaDirect ?? make(process.env.DIRECT_URL ?? process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaDirect = prismaDirect;
}
