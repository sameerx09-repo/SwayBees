import { getTaskMode } from "@/lib/application-mode";
import Link from "next/link";
import { CollabsTable, type CollabRow } from "@/components/CollabsTable";
import { markInvitationCredited } from "../actions";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { InsightsTable, type InsightsColumn } from "../insights/InsightsTable";
import type { TaskType, Platform, InvitationStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

type AllTasksRow = {
  id: string;
  brand: string;
  description: string;
  creatorHandle: string;
  type: TaskType;
  platform: Platform;
  status: InvitationStatus;
  payoutAmount: number;
  createdAt: Date;
};

const columns: InsightsColumn<AllTasksRow>[] = [
  { key: "brand", label: "BRAND" },
  { key: "description", label: "COLLAB" },
  { key: "creatorHandle", label: "CREATOR" },
  { key: "type", label: "TYPE", format: "task-type" },
  { key: "platform", label: "PLATFORM", format: "platform" },
  { key: "status", label: "STATUS", format: "status" },
  { key: "payoutAmount", label: "PAYOUT", format: "money" },
  { key: "createdAt", label: "DISPATCHED", format: "date" },
];

/**
 * Every task invitation ever dispatched, across every brand — admin's
 * own ad-hoc collabs, brand-triggered matching-engine runs, and anything
 * created via the external POST /api/v1/tasks API (e.g. TrendCraft).
 * `/admin` only ever showed ad-hoc (brandId: null) activity and
 * `/admin/insights` only shows aggregated rollups — neither lets an
 * admin see a specific task assigned to a specific creator, which this
 * exists to fix.
 */
export default async function AllTasksPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const reviewOnly = (await searchParams).status === "review";
  const mode = await getTaskMode();
  const admin = await requireAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  const invitations = await db.taskInvitation.findMany({
    where: { task: { mode }, ...(reviewOnly ? { status: { in: ["SUBMITTED", "VERIFYING"] as const } } : {}) },
    select: { id: true, status: true, createdAt: true, task: { select: { description: true, type: true, platform: true, payoutAmount: true, targetPostUrl: true, brand: { select: { companyName: true } } } }, influencer: { select: { handle: true } } },
    relationLoadStrategy: "join",
    orderBy: { createdAt: "desc" },
  });

  const rows: AllTasksRow[] = invitations.map((inv) => ({
    id: inv.id,
    brand: inv.task.brand?.companyName ?? "SwayBees (ad-hoc)",
    description: inv.task.description,
    creatorHandle: inv.influencer.handle,
    type: inv.task.type,
    platform: inv.task.platform,
    status: inv.status,
    payoutAmount: inv.task.payoutAmount,
    createdAt: inv.createdAt,
  }));

  const reviewRows: CollabRow[] = invitations
    .filter((inv) => inv.status === "SUBMITTED" || inv.status === "VERIFYING")
    .map((inv) => ({ id: inv.id, description: inv.task.description,
      creatorHandle: inv.influencer.handle, type: inv.task.type, platform: inv.task.platform,
      status: inv.status, payoutAmount: inv.task.payoutAmount, targetPostUrl: inv.task.targetPostUrl, createdAt: inv.createdAt,
    }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">All tasks</h1>
        <p className="text-sm text-muted mt-1.5">
          Every task dispatched to every creator, across every brand and source — admin ad-hoc,
          brand-triggered, and external API.
        </p>
      </div>

      <div className="flex flex-wrap gap-5 text-sm">
        <Link href="/admin/tasks" className="underline">All tasks</Link>
        <Link href="/admin/tasks?status=review" className="underline">In review</Link>
      </div>
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Awaiting backend review ({reviewRows.length})</h2>
        <p className="text-sm text-muted">Creators have marked these tasks complete. Verify their work before approving the payout.</p>
        <CollabsTable rows={reviewRows} emptyMessage="No tasks awaiting review." markCreditedAction={markInvitationCredited} />
      </section>
      <InsightsTable
        title="Tasks"
        rows={rows}
        columns={columns}
        idKey="id"
        gridColsClass="grid grid-cols-[1fr_1.4fr_1fr_0.9fr_0.8fr_1fr_0.8fr_1.1fr]"
        minWidthClass="min-w-[920px]"
        defaultSortKey="createdAt"
        scrollable
        emptyMessage="No tasks dispatched yet."
        search={{
          placeholder: "Search by brand, creator, or collab…",
          keys: ["brand", "creatorHandle", "description"],
        }}
      />
    </div>
  );
}
