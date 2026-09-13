import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/**
 * True for Prisma's unique-constraint violation (P2002). The pre-check
 * pattern (`findFirst` then `create`) most call sites use isn't atomic —
 * two near-simultaneous requests can both pass the check before either
 * commits — so `create` calls on a unique field should catch this and
 * turn it into a normal user-facing message instead of an uncaught 500.
 */
export function isUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}
