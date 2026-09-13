import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import {
  computeOverview,
  computeByBrand,
  computeByCreator,
  computeByType,
  computeByPlatform,
  computeCreditedTrend,
  type InsightRow,
  type BrandBreakdown,
  type CreatorBreakdown,
  type TypeBreakdown,
  type PlatformBreakdown,
} from "@/lib/admin-insights";
import { InsightsTable, type InsightsColumn } from "./InsightsTable";

export const dynamic = "force-dynamic";

const brandColumns: InsightsColumn<BrandBreakdown>[] = [
  { key: "name", label: "BRAND" },
  { key: "taskCount", label: "COLLABS", format: "number" },
  { key: "invitationCount", label: "INVITATIONS", format: "number" },
  { key: "credited", label: "COMPLETED", format: "number" },
  { key: "completionRate", label: "COMPLETION", format: "percent" },
  { key: "totalCommitted", label: "COMMITTED", format: "money" },
  { key: "totalCredited", label: "CREDITED", format: "money-success" },
];

const typeColumns: InsightsColumn<TypeBreakdown>[] = [
  { key: "type", label: "TYPE", format: "task-type" },
  { key: "invitationCount", label: "SENT", format: "number" },
  { key: "credited", label: "COMPLETED", format: "number" },
  { key: "completionRate", label: "RATE", format: "percent" },
  { key: "totalCredited", label: "CREDITED", format: "money" },
];

const platformColumns: InsightsColumn<PlatformBreakdown>[] = [
  { key: "platform", label: "PLATFORM", format: "platform" },
  { key: "invitationCount", label: "SENT", format: "number" },
  { key: "credited", label: "COMPLETED", format: "number" },
  { key: "completionRate", label: "RATE", format: "percent" },
];

const creatorColumns: InsightsColumn<CreatorBreakdown>[] = [
  { key: "handle", label: "CREATOR" },
  { key: "niches", label: "NICHES", format: "niches" },
  { key: "followerCount", label: "FOLLOWERS", format: "number" },
  { key: "invitationCount", label: "COLLABS", format: "number" },
  { key: "credited", label: "COMPLETED", format: "number" },
  { key: "completionRate", label: "COMPLETION", format: "percent" },
  { key: "totalEarned", label: "EARNED", format: "money" },
];

export default async function AdminInsightsPage() {
  const admin = await requireAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  const invitations = await db.taskInvitation.findMany({
    include: {
      task: { include: { brand: true } },
      influencer: { include: { niches: { include: { niche: true } } } },
    },
  });

  const rows: InsightRow[] = invitations.map((inv) => ({
    id: inv.id,
    status: inv.status,
    taskId: inv.taskId,
    taskType: inv.task.type,
    taskPlatform: inv.task.platform,
    payoutAmount: inv.task.payoutAmount,
    brandId: inv.task.brandId,
    brandName: inv.task.brand?.companyName ?? null,
    influencerId: inv.influencerId,
    influencerHandle: inv.influencer.handle,
    influencerFollowerCount: inv.influencer.followerCount,
    influencerNiches: inv.influencer.niches.map((n) => n.niche.name),
    creditedAt: inv.creditedAt,
  }));

  const overview = computeOverview(rows);
  const byBrand = computeByBrand(rows);
  const byCreator = computeByCreator(rows);
  const byType = computeByType(rows);
  const byPlatform = computeByPlatform(rows);
  const trend = computeCreditedTrend(rows);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-semibold tracking-tight">Insights</h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/export/verification"
            className="text-xs font-medium border border-border rounded-full px-4 py-2 hover:border-accent hover:text-accent transition-colors"
          >
            Export for verification (CSV)
          </a>
          <a
            href="/admin/export/payouts"
            className="text-xs font-medium border border-border rounded-full px-4 py-2 hover:border-accent hover:text-accent transition-colors"
          >
            Export payouts (CSV)
          </a>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-muted border border-border px-6 py-10 text-center">
          Nothing dispatched yet — insights will populate once collabs go out (from
          &ldquo;Post a collab&rdquo; or brand-side auto-generation).
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 border border-border divide-x divide-y sm:divide-y-0 divide-border">
            <StatTile label="Invitations" value={overview.totalInvitations.toString()} />
            <StatTile label="Distinct collabs" value={overview.distinctTasks.toString()} />
            <StatTile label="Brands active" value={overview.activeBrands.toString()} />
            <StatTile label="Creators active" value={overview.activeCreators.toString()} />
            <StatTile label="Completion rate" value={`${overview.completionRate}%`} accent />
            <StatTile label="Total credited" value={`$${overview.totalCredited.toFixed(2)}`} accent />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 border border-border divide-x divide-y sm:divide-y-0 divide-border text-center">
            <StatusTile label="Awaiting response" value={overview.pending} />
            <StatusTile label="In progress" value={overview.inProgress} />
            <StatusTile label="Declined" value={overview.declined} />
            <StatusTile label="Completed" value={overview.credited} success />
            <StatusTile
              label="Committed if all complete"
              value={overview.totalCommitted}
              money
            />
          </div>

          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold">Credited — last 14 days</h2>
            <div className="border border-border overflow-x-auto">
              <div className="flex divide-x divide-border-light min-w-max">
                {trend.map((d) => (
                  <div key={d.date} className="px-4 py-3 flex flex-col gap-1 min-w-[84px]">
                    <div className="text-[10px] text-muted font-mono">{d.date.slice(5)}</div>
                    <div className="font-mono text-sm font-medium">{d.count}</div>
                    <div className="font-mono text-[11px] text-success">
                      ${d.amount.toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <InsightsTable
            title="By brand"
            rows={byBrand}
            columns={brandColumns}
            idKey="key"
            gridColsClass="grid grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_0.9fr_1fr_1fr]"
            minWidthClass="min-w-[720px]"
            defaultSortKey="totalCredited"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <InsightsTable
              title="By collab type"
              rows={byType}
              columns={typeColumns}
              idKey="type"
              gridColsClass="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_1fr]"
              minWidthClass="min-w-[480px]"
              defaultSortKey="invitationCount"
            />

            <InsightsTable
              title="By platform"
              rows={byPlatform}
              columns={platformColumns}
              idKey="platform"
              gridColsClass="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr]"
              minWidthClass="min-w-[400px]"
              defaultSortKey="invitationCount"
            />
          </div>

          <InsightsTable
            title="By creator"
            rows={byCreator}
            columns={creatorColumns}
            idKey="id"
            gridColsClass="grid grid-cols-[1.2fr_1.4fr_0.7fr_0.9fr_0.7fr_0.9fr_0.9fr]"
            minWidthClass="min-w-[720px]"
            defaultSortKey="totalEarned"
            scrollable
            search={{
              placeholder: "Search by handle or niche…",
              keys: ["handle", "niches"],
            }}
          />
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="px-5.5 py-4 flex flex-col gap-1">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`font-mono text-lg font-medium ${accent ? "text-accent" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function StatusTile({
  label,
  value,
  success,
  money,
}: {
  label: string;
  value: number;
  success?: boolean;
  money?: boolean;
}) {
  return (
    <div className="px-5.5 py-4 flex flex-col gap-1">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`font-mono text-base font-medium ${success ? "text-success" : ""}`}>
        {money ? `$${value.toFixed(2)}` : value}
      </div>
    </div>
  );
}
