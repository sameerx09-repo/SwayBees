"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireInfluencerSession } from "@/lib/auth";
import { verifyUgcPost, verifyComment } from "@/lib/verification";
import { InvitationStatus, LedgerStatus } from "@prisma/client";

export async function acceptInvitation(invitationId: string) {
  const influencer = await requireInfluencerSession();
  if (!influencer) return;

  const invitation = await db.taskInvitation.findUniqueOrThrow({
    where: { id: invitationId, influencerId: influencer.id },
    include: { task: true },
  });

  await db.$transaction([
    db.taskInvitation.update({
      where: { id: invitationId },
      data: { status: InvitationStatus.ACCEPTED, respondedAt: new Date() },
    }),
    // Earmark the payout the moment the task is accepted — a real
    // ledger entry from a real event, not seed data. Credited only
    // once verification (checkVerification below) succeeds.
    db.walletLedgerEntry.create({
      data: {
        invitationId,
        influencerId: influencer.id,
        amount: invitation.task.payoutAmount,
        status: LedgerStatus.PENDING,
      },
    }),
  ]);
  revalidatePath("/collabs");
}

export async function declineInvitation(invitationId: string) {
  const influencer = await requireInfluencerSession();
  if (!influencer) return;

  await db.taskInvitation.update({
    where: { id: invitationId, influencerId: influencer.id },
    data: { status: InvitationStatus.DECLINED, respondedAt: new Date() },
  });
  revalidatePath("/collabs");
}

/** Influencer confirms they've posted/commented — moves ACCEPTED → SUBMITTED. */
export async function submitInvitation(invitationId: string) {
  const influencer = await requireInfluencerSession();
  if (!influencer) return;

  await db.taskInvitation.update({
    where: { id: invitationId, influencerId: influencer.id },
    data: { status: InvitationStatus.SUBMITTED },
  });
  revalidatePath("/collabs");
}

export type VerificationCheckResult = { verified: boolean; reason?: string };

/**
 * Runs the real verification check (see lib/verification.ts, backed by
 * Apify's public scrapers — lib/apify.ts) for one submitted task. In a
 * production system this would run on a schedule, not on manual click —
 * exposed here so the flow is demonstrable without a cron/queue. Needs
 * a real, public creator profile (and for comment/tag-friend tasks, a
 * resolved targetPostUrl) to find anything — seeded demo data has
 * neither, so it will realistically report "no matching post/comment
 * found yet" rather than a fake success. Like/Share tasks always report
 * "pending manual review" — see markInvitationCredited in app/admin.
 */
export async function checkVerification(
  invitationId: string
): Promise<VerificationCheckResult> {
  const influencer = await requireInfluencerSession();
  if (!influencer) return { verified: false, reason: "Not signed in." };

  const invitation = await db.taskInvitation.findUnique({
    where: { id: invitationId, influencerId: influencer.id },
    include: { task: true },
  });
  if (!invitation) return { verified: false, reason: "Collab not found." };

  if (invitation.task.platform !== "INSTAGRAM") {
    // No OAuth/verification API exists for Twitter or Reddit yet — see
    // BUILD_STATUS.md. Report that plainly instead of pretending to check.
    return {
      verified: false,
      reason: "Automated verification isn't available for this platform yet — pending manual review.",
    };
  }

  if (invitation.task.type === "LIKE" || invitation.task.type === "SHARE") {
    // No API/scraping surface exists for who liked or shared a post, in
    // either direction — see the TaskType comment in schema.prisma.
    // Not a gap to close later; a permanent limitation of the platform.
    // An admin can still manually mark this credited (app/admin).
    return {
      verified: false,
      reason: "Likes and shares can't be automatically verified — pending manual review.",
    };
  }

  const result =
    invitation.task.type === "UGC_VIDEO"
      ? await verifyUgcPost(influencer, invitation.task)
      : await verifyComment(influencer, invitation.task);

  if (result.verified) {
    await db.$transaction([
      db.taskInvitation.update({
        where: { id: invitationId },
        data: { status: InvitationStatus.CREDITED },
      }),
      db.walletLedgerEntry.update({
        where: { invitationId },
        data: { status: LedgerStatus.CREDITED },
      }),
      db.influencer.update({
        where: { id: influencer.id },
        data: { walletBalance: { increment: invitation.task.payoutAmount } },
      }),
    ]);
    revalidatePath("/collabs");
    return { verified: true };
  }

  await db.taskInvitation.update({
    where: { id: invitationId },
    data: { status: InvitationStatus.VERIFYING },
  });
  revalidatePath("/collabs");
  return { verified: false, reason: result.reason };
}
