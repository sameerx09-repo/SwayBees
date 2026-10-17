import { TaskDescription, TaskPostLink } from "@/components/TaskDescription";
import { formatINR } from "@/lib/currency";
import { TASK_TYPE_LABEL } from "@/lib/task-type-label";
import { INVITATION_STATUS_LABEL, INVITATION_STATUS_COLOR } from "@/lib/invitation-status-label";
import type { TaskType } from "@prisma/client";

export type CollabRow = {
  id: string;
  description: string;
  creatorHandle: string;
  type: TaskType;
  platform: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "SUBMITTED" | "VERIFYING" | "CREDITED";
  payoutAmount: number;
  targetPostUrl?: string | null;
  createdAt?: Date;
};

const statusLabel = INVITATION_STATUS_LABEL;
const statusColor = INVITATION_STATUS_COLOR;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const MANUALLY_CREDITABLE: CollabRow["status"][] = ["SUBMITTED", "VERIFYING"];

/**
 * `markCreditedAction`, when passed, adds an ACTION column with a
 * "Approve & credit" button for rows stuck in SUBMITTED/VERIFYING — the
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
  const minWidthClass = markCreditedAction ? "min-w-[760px]" : "min-w-[680px]";

  return (
    <div className="border border-border overflow-x-auto">
      <div className={minWidthClass}>
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
              <div className="text-sm pr-3 break-words">
                <TaskDescription text={row.description} />
                <div><TaskPostLink url={row.targetPostUrl ?? null} platform={row.platform} /></div>
                {row.createdAt && <time className="block text-xs text-muted mt-1" dateTime={row.createdAt.toISOString()}>Assigned {row.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</time>}
              </div>
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
              <div className="font-mono text-sm">{formatINR(row.payoutAmount)}</div>
              {markCreditedAction && (
                <div>
                  {MANUALLY_CREDITABLE.includes(row.status) && (
                    <form action={markCreditedAction}>
                      <input type="hidden" name="invitationId" value={row.id} />
                      <button type="submit" className="text-xs font-medium underline">
                        Approve & credit
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
