import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireBrandSession } from "@/lib/auth";
import { CollabsTable, type CollabRow } from "@/components/CollabsTable";

export default async function BrandCollabsPage() {
  const brand = await requireBrandSession();
  if (!brand) {
    redirect("/login");
  }

  const invitations = await db.taskInvitation.findMany({
    where: { task: { brandId: brand.id } },
    include: { task: true, influencer: true },
    orderBy: { createdAt: "desc" },
  });

  const counts = invitations.reduce(
    (acc, inv) => {
      acc[inv.status] = (acc[inv.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const rows: CollabRow[] = invitations.map((inv) => ({
    id: inv.id,
    description: inv.task.description,
    creatorHandle: inv.influencer.handle,
    type: inv.task.type,
    platform: inv.task.platform,
    status: inv.status,
    payoutAmount: inv.task.payoutAmount,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Collabs</h1>
        <div className="flex items-center gap-5 text-xs text-muted">
          <span>{invitations.length} total</span>
          <span>{counts.PENDING ?? 0} awaiting response</span>
          <span>{counts.CREDITED ?? 0} completed</span>
        </div>
      </div>

      <CollabsTable
        rows={rows}
        emptyMessage="No collabs yet — generate this cycle's collabs from the Overview tab to dispatch some."
      />
    </div>
  );
}
