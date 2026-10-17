import { randomUUID } from "node:crypto";
import { TaskMode, type Prisma } from "@prisma/client";

/** State-guarded writes prevent stale clicks and concurrent approvals from crediting twice. */
export async function acceptTask(db: Pick<Prisma.TransactionClient, "$queryRaw">, invitationId: string, influencerId: string, mode: TaskMode = TaskMode.LIVE) {
  // One atomic statement avoids BEGIN/read/update/insert/COMMIT round trips.
  // The guarded UPDATE locks the invitation; concurrent retries cannot reserve twice.
  const reserved = await db.$queryRaw<Array<{ id: string }>>`
    WITH accepted AS (
      UPDATE "TaskInvitation"
      SET status = 'ACCEPTED'::"InvitationStatus", "respondedAt" = NOW()
      WHERE id = ${invitationId} AND "influencerId" = ${influencerId}
        AND status = 'PENDING'::"InvitationStatus"
        AND EXISTS (SELECT 1 FROM "Task" t WHERE t.id = "TaskInvitation"."taskId" AND t.mode = ${mode}::"TaskMode")
      RETURNING id, "taskId", "influencerId"
    )
    INSERT INTO "WalletLedgerEntry" (id, "invitationId", "influencerId", amount, status, "createdAt")
    SELECT ${randomUUID()}, accepted.id, accepted."influencerId", task."payoutAmount",
      'PENDING'::"LedgerStatus", NOW()
    FROM accepted JOIN "Task" task ON task.id = accepted."taskId"
    RETURNING id
  `;
  return reserved.length ? {} : { error: "This task is no longer awaiting a response." };
}
/** SUBMITTED is the persisted review queue; VERIFYING covers older submissions. */
export async function approveTask(tx: Prisma.TransactionClient, invitationId: string, mode: TaskMode = TaskMode.LIVE) {
  const invitation = await tx.taskInvitation.findUnique({ where: { id: invitationId, task: { mode } }, select: { influencerId: true, ledgerEntry: true }, relationLoadStrategy: "join" });
  if (!invitation?.ledgerEntry || invitation.ledgerEntry.status !== "PENDING") return;
  const updated = await tx.taskInvitation.updateMany({
    where: { id: invitationId, task: { mode }, status: { in: ["SUBMITTED", "VERIFYING"] } }, data: { status: "CREDITED", creditedAt: new Date() },
  });
  if (!updated.count) return;
  await tx.walletLedgerEntry.update({ where: { invitationId }, data: { status: "CREDITED" } });
  await tx.influencer.update({ where: { id: invitation.influencerId }, data: mode === TaskMode.TEST ? { testWalletBalance: { increment: invitation.ledgerEntry.amount } } : { walletBalance: { increment: invitation.ledgerEntry.amount } } });
}
