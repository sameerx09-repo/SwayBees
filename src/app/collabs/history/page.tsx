import { db } from "@/lib/db";
import { requireInfluencerSession } from "@/lib/auth";
import { TASK_TYPE_LABEL } from "@/lib/task-type-label";

export default async function HistoryPage() {
  const influencer = (await requireInfluencerSession())!;

  const past = await db.taskInvitation.findMany({
    where: {
      influencerId: influencer.id,
      status: { in: ["CREDITED", "DECLINED"] },
    },
    include: { task: { include: { brand: true } }, ledgerEntry: true },
    orderBy: { createdAt: "desc" },
  });

  const totalEarned = past
    .filter((p) => p.status === "CREDITED")
    .reduce((sum, p) => sum + p.task.payoutAmount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Collab history</h1>
        <div className="text-right">
          <div className="text-[11px] text-muted">Total earned</div>
          <div className="font-mono text-lg font-medium">${totalEarned.toFixed(2)}</div>
        </div>
      </div>

      <div className="border border-border overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr] px-5.5 py-3 text-[11px] text-muted">
            <div>COLLAB</div>
            <div>BRAND</div>
            <div>TYPE</div>
            <div>OUTCOME</div>
            <div>AMOUNT</div>
          </div>
          {past.length === 0 ? (
            <div className="text-sm text-muted px-5.5 py-8 text-center border-t border-border-light">
              No completed or declined collabs yet — they&rsquo;ll show up here once you
              do.
            </div>
          ) : (
            past.map((p) => (
              <div
                key={p.id}
                className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr] items-center px-5.5 py-3.5 border-t border-border-light"
              >
                <div className="text-sm">{p.task.description}</div>
                <div className="text-sm text-muted-strong">
                  {p.task.brand?.companyName ?? "SwayFam"}
                </div>
                <div className="font-mono text-[11px] text-muted">
                  {TASK_TYPE_LABEL[p.task.type]}
                </div>
                <div
                  className={`text-xs ${
                    p.status === "CREDITED" ? "text-success" : "text-muted"
                  }`}
                >
                  {p.status === "CREDITED" ? "Completed" : "Declined"}
                </div>
                <div className="font-mono text-sm">
                  {p.status === "CREDITED" ? `$${p.task.payoutAmount.toFixed(2)}` : "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
