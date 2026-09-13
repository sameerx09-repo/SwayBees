import { db } from "@/lib/db";
import { InvitationStatus } from "@prisma/client";
import { requireInfluencerSession } from "@/lib/auth";
import { CollabsClient, type ActiveCollabRow, type InvitationRow } from "./CollabsClient";
import { OnboardingChecklist } from "./OnboardingChecklist";

const statusLabel: Record<string, ActiveCollabRow["status"]> = {
  ACCEPTED: "Accepted",
  SUBMITTED: "Submitted",
  VERIFYING: "Verifying",
  CREDITED: "Credited",
};

export default async function CollabsPage({
  searchParams,
}: {
  searchParams: Promise<{ instagram?: string; instagram_error?: string }>;
}) {
  const { instagram, instagram_error } = await searchParams;

  // Layout already redirects if unauthenticated, so this is always present.
  const influencer = (await requireInfluencerSession())!;

  const invitations = await db.taskInvitation.findMany({
    where: { influencerId: influencer.id, status: InvitationStatus.PENDING },
    include: { task: { include: { brand: true } } },
    orderBy: { createdAt: "asc" },
  });

  const activeInvitations = await db.taskInvitation.findMany({
    where: {
      influencerId: influencer.id,
      status: { in: ["ACCEPTED", "SUBMITTED", "VERIFYING", "CREDITED"] },
    },
    include: { task: { include: { brand: true } } },
    orderBy: { createdAt: "desc" },
  });

  const invitationRows: InvitationRow[] = invitations.map((inv) => ({
    id: inv.id,
    brand: inv.task.brand?.companyName ?? "SwayFam",
    type: inv.task.type,
    description: inv.task.description,
    payoutLabel:
      inv.task.type === "COMMENT"
        ? `up to $${inv.task.payoutAmount.toFixed(2)}`
        : `$${inv.task.payoutAmount.toFixed(2)}`,
  }));

  const activeCollabRows: ActiveCollabRow[] = activeInvitations.map((inv) => ({
    id: inv.id,
    name: inv.task.description,
    brand: inv.task.brand?.companyName ?? "SwayFam",
    status: statusLabel[inv.status]!,
    amount: `$${inv.task.payoutAmount.toFixed(2)}`,
  }));

  const nicheCount = await db.influencerNiche.count({ where: { influencerId: influencer.id } });
  const needsProfile =
    !influencer.gender || !influencer.age || !influencer.location || nicheCount === 0;

  return (
    <div className="flex flex-col gap-8">
      <OnboardingChecklist
        needsProfile={needsProfile}
        needsInstagram={!influencer.instagramConnected}
      />

      {instagram === "connected" && (
        <div className="text-sm bg-accent-soft px-5 py-3 border border-accent/30">
          Instagram connected — follower count and verification are now live.
        </div>
      )}
      {instagram === "error" && (
        <div className="text-sm bg-red-50 text-red-700 px-5 py-3 border border-red-200">
          Couldn&rsquo;t connect Instagram
          {instagram_error ? `: ${instagram_error}` : "."}
        </div>
      )}

      <CollabsClient invitations={invitationRows} activeCollabs={activeCollabRows} />
    </div>
  );
}
