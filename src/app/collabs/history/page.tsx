import { getTaskMode } from "@/lib/application-mode";
import { redirect } from "next/navigation";
import { formatINR } from "@/lib/currency";
import { db } from "@/lib/db";
import { getSession, requireInfluencerSession } from "@/lib/auth";
import { TASK_TYPE_LABEL } from "@/lib/task-type-label";

export default async function HistoryPage() {
  const mode = await getTaskMode();
  const session = await getSession();
  if (!session || session.kind !== "influencer") redirect("/creator/login");

  const [influencer, past] = await Promise.all([
    requireInfluencerSession(),
    db.taskInvitation.findMany({
    where: {
      influencerId: session.id,
      task: { mode },
      status: { in: ["CREDITED", "DECLINED"] },
    },
    select: { id: true, status: true, task: { select: { description: true, type: true, payoutAmount: true, brand: { select: { companyName: true } } } } },
    relationLoadStrategy: "join",
    orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!influencer) redirect("/creator/login");

  const totalEarned = past
    .filter((p) => p.status === "CREDITED")
    .reduce((sum, p) => sum + p.task.payoutAmount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Collab history</h1>
        <div className="text-right">
          <div className="text-[11px] text-muted">{mode === "TEST" ? "Total test earnings" : "Total earned"}</div>
          <div className="font-mono text-lg font-medium">{formatINR(totalEarned)}</div>
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
                  {p.task.brand?.companyName ?? "SwayBees"}
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
                  {p.status === "CREDITED" ? formatINR(p.task.payoutAmount) : "—"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
