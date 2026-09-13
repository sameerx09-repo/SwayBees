import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { buildCsv, csvResponse } from "@/lib/csv";
import { TASK_TYPE_LABEL } from "@/lib/task-type-label";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Awaiting response",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  SUBMITTED: "Submitted",
  VERIFYING: "Verifying",
  CREDITED: "Completed",
};

/**
 * Every collab invitation, one row each, with everything an admin needs
 * to manually check a submission — target URL, expected hashtag/mention,
 * creator handles across platforms — without opening the app. Exists
 * because LIKE/SHARE (and anything a real verification failure leaves
 * stuck in VERIFYING) can only ever be resolved by a human looking at
 * the actual post, and that review often happens outside the app
 * (spreadsheet, second monitor) rather than by clicking through here row
 * by row. GET, not a server action, so it can be a plain downloadable
 * link — session cookie rides along automatically.
 */
export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return new Response("Not signed in.", { status: 401 });
  }

  const invitations = await db.taskInvitation.findMany({
    include: {
      task: { include: { brand: true } },
      influencer: {
        include: {
          niches: { include: { niche: true } },
          socialAccounts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const headers = [
    "Invitation ID",
    "Status",
    "Collab Type",
    "Platform",
    "Brand",
    "Instructions",
    "Required Hashtag/Mention",
    "Target Post URL",
    "Creator Handle",
    "Creator Email",
    "Creator Followers",
    "Creator Niches",
    "Creator Twitter Handle",
    "Creator Reddit Handle",
    "Payout Amount",
    "Dispatched At",
    "Responded At",
    "Credited At",
  ];

  const rows = invitations.map((inv) => {
    const twitter = inv.influencer.socialAccounts.find((s) => s.platform === "TWITTER");
    const reddit = inv.influencer.socialAccounts.find((s) => s.platform === "REDDIT");
    return [
      inv.id,
      STATUS_LABEL[inv.status] ?? inv.status,
      TASK_TYPE_LABEL[inv.task.type],
      capitalize(inv.task.platform.toLowerCase()),
      inv.task.brand?.companyName ?? "SwayFam (ad-hoc)",
      inv.task.description,
      inv.task.verificationTag ?? "",
      inv.task.targetPostUrl ?? "",
      inv.influencer.handle,
      inv.influencer.email,
      inv.influencer.followerCount,
      inv.influencer.niches.map((n) => n.niche.name).join("; "),
      twitter?.handle ?? "",
      reddit?.handle ?? "",
      inv.task.payoutAmount.toFixed(2),
      inv.createdAt.toISOString(),
      inv.respondedAt?.toISOString() ?? "",
      inv.creditedAt?.toISOString() ?? "",
    ];
  });

  const csv = buildCsv(headers, rows);
  const filename = `swayfam-collabs-verification-${new Date().toISOString().slice(0, 10)}.csv`;
  return csvResponse(csv, filename);
}
