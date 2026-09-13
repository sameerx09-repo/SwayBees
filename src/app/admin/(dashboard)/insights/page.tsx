import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { TASK_TYPE_LABEL } from "@/lib/task-type-label";
import {
  computeOverview,
  computeByBrand,
  computeByCreator,
  computeByType,
  computeByPlatform,
  type InsightRow,
} from "@/lib/admin-insights";
import { CreatorInsightsTable } from "./CreatorInsightsTable";

export const dynamic = "force-dynamic";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

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
  }));

  const overview = computeOverview(rows);
  const byBrand = computeByBrand(rows);
  const byCreator = computeByCreator(rows);
  const byType = computeByType(rows);
  const byPlatform = computeByPlatform(rows);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold tracking-tight">Insights</h1>

      {rows.length === 0 ? (
        <div className="text-sm text-muted border border-border px-6 py-10 text-center">
          Nothing dispatched yet — insights will populate once collabs go out (from
          &ldquo;Post a collab&rdquo; or brand-side auto-generation).
        </div>
      ) : (
        <>
          <div className="grid grid-cols-6 border border-border divide-x divide-border">
            <StatTile label="Invitations" value={overview.totalInvitations.toString()} />
            <StatTile label="Distinct collabs" value={overview.distinctTasks.toString()} />
            <StatTile label="Brands active" value={overview.activeBrands.toString()} />
            <StatTile label="Creators active" value={overview.activeCreators.toString()} />
            <StatTile label="Completion rate" value={`${overview.completionRate}%`} accent />
            <StatTile label="Total credited" value={`$${overview.totalCredited.toFixed(2)}`} accent />
          </div>

          <div className="grid grid-cols-5 border border-border divide-x divide-border text-center">
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
            <h2 className="text-base font-semibold">By brand ({byBrand.length})</h2>
            <div className="border border-border">
              <div className="grid grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_0.9fr_1fr_1fr] px-5.5 py-3 text-[11px] text-muted">
                <div>BRAND</div>
                <div>COLLABS</div>
                <div>INVITATIONS</div>
                <div>COMPLETED</div>
                <div>COMPLETION</div>
                <div>COMMITTED</div>
                <div>CREDITED</div>
              </div>
              {byBrand.map((b) => (
                <div
                  key={b.key}
                  className="grid grid-cols-[1.4fr_0.8fr_0.9fr_0.8fr_0.9fr_1fr_1fr] items-center px-5.5 py-3 border-t border-border-light"
                >
                  <div className="text-sm font-medium">{b.name}</div>
                  <div className="font-mono text-sm">{b.taskCount}</div>
                  <div className="font-mono text-sm">{b.invitationCount}</div>
                  <div className="font-mono text-sm">{b.credited}</div>
                  <div className="font-mono text-sm">{b.completionRate}%</div>
                  <div className="font-mono text-sm">${b.totalCommitted.toFixed(2)}</div>
                  <div className="font-mono text-sm text-success">
                    ${b.totalCredited.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">By collab type</h2>
              <div className="border border-border">
                <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_1fr] px-5.5 py-3 text-[11px] text-muted">
                  <div>TYPE</div>
                  <div>SENT</div>
                  <div>COMPLETED</div>
                  <div>RATE</div>
                  <div>CREDITED</div>
                </div>
                {byType.map((t) => (
                  <div
                    key={t.type}
                    className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_1fr] items-center px-5.5 py-3 border-t border-border-light"
                  >
                    <div className="font-mono text-[11px] text-muted">
                      {TASK_TYPE_LABEL[t.type]}
                    </div>
                    <div className="font-mono text-sm">{t.invitationCount}</div>
                    <div className="font-mono text-sm">{t.credited}</div>
                    <div className="font-mono text-sm">{t.completionRate}%</div>
                    <div className="font-mono text-sm">${t.totalCredited.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold">By platform</h2>
              <div className="border border-border">
                <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr] px-5.5 py-3 text-[11px] text-muted">
                  <div>PLATFORM</div>
                  <div>SENT</div>
                  <div>COMPLETED</div>
                  <div>RATE</div>
                </div>
                {byPlatform.map((p) => (
                  <div
                    key={p.platform}
                    className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr] items-center px-5.5 py-3 border-t border-border-light"
                  >
                    <div className="text-sm">{capitalize(p.platform.toLowerCase())}</div>
                    <div className="font-mono text-sm">{p.invitationCount}</div>
                    <div className="font-mono text-sm">{p.credited}</div>
                    <div className="font-mono text-sm">{p.completionRate}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <CreatorInsightsTable rows={byCreator} />
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
