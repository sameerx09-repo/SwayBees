import { TASK_TYPE_LABEL } from "@/lib/task-type-label";
import type { TaskType } from "@prisma/client";

export type CollabRow = {
  id: string;
  description: string;
  creatorHandle: string;
  type: TaskType;
  platform: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "SUBMITTED" | "VERIFYING" | "CREDITED";
  payoutAmount: number;
};

const statusLabel: Record<CollabRow["status"], string> = {
  PENDING: "Awaiting response",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  SUBMITTED: "Submitted",
  VERIFYING: "Verifying",
  CREDITED: "Completed",
};

const statusColor: Record<CollabRow["status"], string> = {
  CREDITED: "text-success",
  VERIFYING: "text-accent",
  SUBMITTED: "text-accent",
  ACCEPTED: "text-muted-strong",
  DECLINED: "text-muted",
  PENDING: "text-muted",
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const MANUALLY_CREDITABLE: CollabRow["status"][] = ["SUBMITTED", "VERIFYING"];

/**
 * `markCreditedAction`, when passed, adds an ACTION column with a
 * "Mark credited" button for rows stuck in SUBMITTED/VERIFYING — the
 * only way to ever pay out a Like/Share collab, since those have no
 * automated verification path at all (see lib/verification.ts). Plain
 * server-action-bound form, no client component needed. Omit the prop
 * for a read-only view (e.g. the brand's own /settings/collabs).
 */
export function CollabsTable({
  rows,
  emptyMessage,
  markCreditedAction,
}: {
  rows: CollabRow[];
  emptyMessage: string;
  markCreditedAction?: (formData: FormData) => void | Promise<void>;
}) {
  // Tailwind needs complete, literal class strings to detect arbitrary
  // values at build time — a template-interpolated grid-cols class
  // would silently produce no CSS at all, so this picks between two
  // whole class names rather than building one from parts.
  const gridClass = markCreditedAction
    ? "grid grid-cols-[1.4fr_0.9fr_0.8fr_0.8fr_0.8fr_0.8fr_0.9fr]"
    : "grid grid-cols-[1.6fr_1fr_0.9fr_0.9fr_0.9fr_0.9fr]";

  return (
    <div className="border border-border">
      <div className={`${gridClass} px-5.5 py-3 text-[11px] text-muted`}>
        <div>COLLAB</div>
        <div>CREATOR</div>
        <div>TYPE</div>
        <div>PLATFORM</div>
        <div>STATUS</div>
        <div>PAYOUT</div>
        {markCreditedAction && <div>ACTION</div>}
      </div>
      {rows.length === 0 ? (
        <div className="text-sm text-muted px-5.5 py-8 text-center border-t border-border-light">
          {emptyMessage}
        </div>
      ) : (
        rows.map((row) => (
          <div
            key={row.id}
            className={`${gridClass} items-center px-5.5 py-3.5 border-t border-border-light`}
          >
            <div className="text-sm">{row.description}</div>
            <div className="text-sm text-muted-strong">{row.creatorHandle}</div>
            <div className="font-mono text-[11px] text-muted">
              {TASK_TYPE_LABEL[row.type]}
            </div>
            <div className="font-mono text-[11px] text-muted">
              {capitalize(row.platform.toLowerCase())}
            </div>
            <div className={`text-xs ${statusColor[row.status]}`}>
              {statusLabel[row.status]}
            </div>
            <div className="font-mono text-sm">${row.payoutAmount.toFixed(2)}</div>
            {markCreditedAction && (
              <div>
                {MANUALLY_CREDITABLE.includes(row.status) && (
                  <form action={markCreditedAction}>
                    <input type="hidden" name="invitationId" value={row.id} />
                    <button type="submit" className="text-xs font-medium underline">
                      Mark credited
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
