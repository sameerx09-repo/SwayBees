import assert from "node:assert/strict";
import { loadEnvConfig } from "@next/env";
import { PrismaClient, TaskMode } from "@prisma/client";
import { acceptTask, approveTask } from "../src/lib/task-workflow";
loadEnvConfig(process.cwd());
const db = new PrismaClient();
const rollback = new Error("ROLLBACK_TEST");
async function main() {
  try {
    await db.$transaction(async (tx) => {
      const creator = await tx.influencer.create({ data: { handle: `test-${Date.now()}`, email: `test-${Date.now()}@example.invalid`, passwordHash: "test-only" } });
      const task = await tx.task.create({ data: { type: "COMMENT", description: "Workflow rollback test", payoutAmount: 60, targetPostUrl: "https://www.instagram.com/p/test/" } });
      const invitation = await tx.taskInvitation.create({ data: { influencerId: creator.id, taskId: task.id } });
      assert.ok((await acceptTask(tx, invitation.id, "another-creator")).error);
      assert.ok((await acceptTask(tx, invitation.id, creator.id, TaskMode.TEST)).error);
      await approveTask(tx, invitation.id);
      assert.equal((await tx.influencer.findUniqueOrThrow({ where: { id: creator.id } })).walletBalance, 0);
      assert.deepEqual(await acceptTask(tx, invitation.id, creator.id), {});
      assert.ok((await acceptTask(tx, invitation.id, creator.id)).error);
      assert.equal(await tx.walletLedgerEntry.count({ where: { invitationId: invitation.id } }), 1);
      assert.equal((await tx.walletLedgerEntry.findUniqueOrThrow({ where: { invitationId: invitation.id } })).status, "PENDING");
      await approveTask(tx, invitation.id);
      assert.equal((await tx.influencer.findUniqueOrThrow({ where: { id: creator.id } })).walletBalance, 0);
      await tx.taskInvitation.update({ where: { id: invitation.id }, data: { status: "SUBMITTED" } });
      await approveTask(tx, invitation.id);
      await approveTask(tx, invitation.id);
      const completed = await tx.taskInvitation.findUniqueOrThrow({ where: { id: invitation.id } });
      assert.equal(completed.status, "CREDITED");
      assert.ok(completed.creditedAt);
      assert.equal((await tx.walletLedgerEntry.findUniqueOrThrow({ where: { invitationId: invitation.id } })).status, "CREDITED");
      assert.equal((await tx.influencer.findUniqueOrThrow({ where: { id: creator.id } })).walletBalance, 60);
      assert.equal((await tx.influencer.findUniqueOrThrow({ where: { id: creator.id } })).testWalletBalance, 0);
      const testTask = await tx.task.create({ data: { type: "LIKE", mode: "TEST", description: "Mode isolation test", payoutAmount: 40 } });
      const testInvitation = await tx.taskInvitation.create({ data: { influencerId: creator.id, taskId: testTask.id } });
      assert.ok((await acceptTask(tx, testInvitation.id, creator.id, TaskMode.LIVE)).error);
      assert.deepEqual(await acceptTask(tx, testInvitation.id, creator.id, TaskMode.TEST), {});
      await tx.taskInvitation.update({ where: { id: testInvitation.id }, data: { status: "SUBMITTED" } });
      await approveTask(tx, testInvitation.id, TaskMode.LIVE);
      assert.equal((await tx.taskInvitation.findUniqueOrThrow({ where: { id: testInvitation.id } })).status, "SUBMITTED");
      await approveTask(tx, testInvitation.id, TaskMode.TEST);
      await approveTask(tx, testInvitation.id, TaskMode.TEST);
      const balances = await tx.influencer.findUniqueOrThrow({ where: { id: creator.id } });
      assert.equal(balances.walletBalance, 60);
      assert.equal(balances.testWalletBalance, 40);
      assert.equal(await tx.taskInvitation.count({ where: { influencerId: creator.id, task: { mode: "LIVE" } } }), 1);
      assert.equal(await tx.taskInvitation.count({ where: { influencerId: creator.id, task: { mode: "TEST" } } }), 1);
      const testEarnings = await tx.walletLedgerEntry.aggregate({ where: { influencerId: creator.id, status: "CREDITED", invitation: { task: { mode: "TEST" } } }, _sum: { amount: true } });
      assert.equal(testEarnings._sum.amount, 40);
      console.log("PASS: cross-mode actions blocked, test/live balances and earnings isolated.");
      console.log("PASS: ownership, duplicate accept, pending ledger, review-only approval, and exactly-once credit. Test data rolled back.");
      throw rollback;
    }, { timeout: 90000 });
  } catch (err) { if (err !== rollback) throw err; }
  finally { await db.$disconnect(); }
}
main().catch((err) => { console.error(err); process.exitCode = 1; });
