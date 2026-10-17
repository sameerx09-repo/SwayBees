import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { acceptTask } from "../src/lib/task-workflow";
import { writeFile } from "node:fs/promises";
loadEnvConfig(process.cwd());
const db = new PrismaClient({ log: [{ emit: "event", level: "query" }] });
let calls = 0;
db.$on("query", () => { calls++; });
const rollback = new Error("ROLLBACK_BENCHMARK");
async function main() {
  const results: Array<{ implementation: string; wallMs: number; sqlCalls: number }> = [];
  try {
    await db.$transaction(async tx => {
      const creator = await tx.influencer.create({ data: { handle: `perf-${Date.now()}`, email: `perf-${Date.now()}@example.invalid`, passwordHash: "benchmark-only" } });
      const task = await tx.task.create({ data: { type: "COMMENT", description: "Rollback-only benchmark", payoutAmount: 60 } });
      for (let i = 0; i < 3; i++) {
        for (const implementation of ["previous", "atomic"]) {
          const invitation = await tx.taskInvitation.create({ data: { influencerId: creator.id, taskId: task.id } });
          calls = 0;
          const start = performance.now();
          if (implementation === "previous") {
            const found = await tx.taskInvitation.findFirst({ where: { id: invitation.id, influencerId: creator.id, status: "PENDING" }, select: { task: { select: { payoutAmount: true } } } });
            const updated = await tx.taskInvitation.updateMany({ where: { id: invitation.id, influencerId: creator.id, status: "PENDING" }, data: { status: "ACCEPTED", respondedAt: new Date() } });
            if (!found || !updated.count) throw new Error("Invalid benchmark fixture");
            await tx.walletLedgerEntry.create({ data: { invitationId: invitation.id, influencerId: creator.id, amount: found.task.payoutAmount, status: "PENDING" } });
          } else { await acceptTask(tx, invitation.id, creator.id); }
          const result = { implementation, wallMs: Math.round(performance.now() - start), sqlCalls: calls };
          results.push(result); console.log(JSON.stringify(result));
        }
      }
      throw rollback;
    }, { timeout: 90000 });
  } catch (err) { if (err !== rollback) throw err; }
  finally { await db.$disconnect(); }
  if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify({ note: "Transaction body timings; previous public action also paid BEGIN/COMMIT and a creator lookup. All fixture changes rolled back.", results }, null, 2));
}
main().catch(err => { console.error(err); process.exitCode = 1; });
