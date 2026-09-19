// Additive, non-destructive: upserts by unique email, never deletes
// anything — safe to run anytime, unlike seed.ts. Creates the one admin
// account used to log in at /admin/login and post ad-hoc tasks.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? "admin@swaybees.internal";
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? "password123";

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await db.admin.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { email: ADMIN_EMAIL, passwordHash },
  });

  console.log(`Admin account ready: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log("Override with ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD env vars before running.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
