// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const make = (datasourceUrl?: string) =>
  new PrismaClient({
    datasourceUrl,
    log:
      process.env.NODE_ENV === "development"
        ? (["warn", "error"] as const)
        : (["error"] as const),
  });

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var prismaDirect: PrismaClient | undefined;
}

// Pooled (PgBouncer)
export const prisma =
  global.prisma ?? make(process.env.DATABASE_URL);

// Direct (primary)
export const prismaDirect =
  global.prismaDirect ?? make(process.env.DIRECT_URL);

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
  global.prismaDirect = prismaDirect;
}
