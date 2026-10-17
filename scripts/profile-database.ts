import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { writeFile } from "node:fs/promises";
loadEnvConfig(process.cwd());
const db = new PrismaClient({ log: [{ level: "query", emit: "event" }] });
let queryTimes: number[] = [];
db.$on("query", e => { queryTimes.push(e.duration); });
async function measure(label: string, fn: () => Promise<unknown>) {
  queryTimes = [];
  const start = performance.now();
  await fn();
  const result = { label, wallMs: Math.round(performance.now() - start), sqlCalls: queryTimes.length, queryMs: [...queryTimes] };
  console.log(JSON.stringify(result)); return result;
}
async function main() {
  const results = [];
  for (let i = 0; i < 6; i++) results.push(await measure(`database-ping-${i}`, () => db.$queryRaw`SELECT 1`));
  const creator = await db.influencer.findUniqueOrThrow({ where: { email: "mia@example.com" }, select: { id: true } });
  for (let i = 0; i < 3; i++) {
    results.push(await measure("creator-session", () => db.influencer.findUnique({ where: { id: creator.id } })));
    results.push(await measure("previous-profile-queries", () => Promise.all([
      db.walletLedgerEntry.aggregate({ where: { influencerId: creator.id, status: { in: ["CREDITED", "PAID"] } }, _sum: { amount: true } }),
      db.taskInvitation.count({ where: { influencerId: creator.id, status: "CREDITED" } }),
      db.influencerNiche.findMany({ where: { influencerId: creator.id }, include: { niche: true } }),
      db.socialAccount.findMany({ where: { influencerId: creator.id } }),
    ])));
    results.push(await measure("joined-profile-candidate", () => Promise.all([
      db.influencer.findUnique({ where: { id: creator.id }, include: {
        niches: { include: { niche: true } }, socialAccounts: true,
        _count: { select: { niches: true, invitations: { where: { status: "CREDITED" } } } },
      }, relationLoadStrategy: "join" }),
      db.walletLedgerEntry.aggregate({ where: { influencerId: creator.id, status: { in: ["CREDITED", "PAID"] } }, _sum: { amount: true } }),
    ])));
  }
  const indexes = await db.$queryRaw`SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename IN ('TaskInvitation', 'Task', 'WalletLedgerEntry')`;
  const plan = await db.$queryRaw`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) SELECT id FROM "TaskInvitation" WHERE "influencerId" = ${creator.id} AND status <> 'DECLINED' ORDER BY "createdAt" DESC`;
  const region = new URL(process.env.DATABASE_URL!).hostname.match(/(?:us|eu|ap|sa|ca|me|af)-(?:east|west|south|north|central|southeast|northeast)-\d/)?.[0] ?? "not identifiable from hostname";
  if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify({ results, indexes, plan, region }, null, 2));
  console.log("Database region:", region);
  await db.$disconnect();
}
main().catch(async err => { console.error(err); await db.$disconnect(); process.exitCode = 1; });
