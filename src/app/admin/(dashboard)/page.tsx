import { getTaskMode } from "@/lib/application-mode";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { CollabsTable, type CollabRow } from "@/components/CollabsTable";
import { AdhocCollabForm, type CreatorOption } from "./AdhocCollabForm";
import { markInvitationCredited } from "./actions";

const RECENT_LIMIT = 10;

export default async function AdminPage() {
  const mode = await getTaskMode();
  const admin = await requireAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  const [influencers, recentCount, recentInvitations] = await Promise.all([
    db.influencer.findMany({
      select: { id: true, handle: true, followerCount: true, gender: true, niches: { select: { niche: { select: { name: true } } } } },
      relationLoadStrategy: "join",
      orderBy: { handle: "asc" },
    }),
    db.taskInvitation.count({ where: { task: { brandId: null, mode } } }),
    db.taskInvitation.findMany({
      where: { task: { brandId: null, mode } },
      select: { id: true, status: true, task: { select: { description: true, type: true, platform: true, payoutAmount: true } }, influencer: { select: { handle: true } } },
      relationLoadStrategy: "join",
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
    }),
  ]);

  const creators: CreatorOption[] = influencers.map((inf) => ({
    id: inf.id,
    handle: inf.handle,
    followerCount: inf.followerCount,
    gender: inf.gender,
    niches: inf.niches.map((n) => n.niche.name),
  }));

  const rows: CollabRow[] = recentInvitations.map((inv) => ({
    id: inv.id,
    description: inv.task.description,
    creatorHandle: inv.influencer.handle,
    type: inv.task.type,
    platform: inv.task.platform,
    status: inv.status,
    payoutAmount: inv.task.payoutAmount,
  }));

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">Post a collab</h1>

      <AdhocCollabForm creators={creators} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-base font-semibold">
            Most recent {Math.min(RECENT_LIMIT, recentCount)} of {recentCount} dispatched
          </h2>
          <div className="flex items-center gap-5">
            <a href="/admin/export/verification" className="text-xs font-medium underline">
              Export all for verification (CSV)
            </a>
            <Link href="/admin/insights" className="text-xs font-medium underline">
              Full breakdown by brand/creator/type &rarr;
            </Link>
          </div>
        </div>
        <CollabsTable
          rows={rows}
          emptyMessage="No collabs dispatched yet — use the form above."
          markCreditedAction={markInvitationCredited}
        />
      </div>
    </>
  );
}
