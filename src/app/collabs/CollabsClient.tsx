"use client";

import { useState, useTransition } from "react";
import type { TaskType } from "@prisma/client";
import { TASK_TYPE_LABEL } from "@/lib/task-type-label";
import {
  acceptInvitation,
  declineInvitation,
  submitInvitation,
  checkVerification,
} from "./actions";

export type InvitationRow = {
  id: string;
  brand: string;
  type: TaskType;
  description: string;
  payoutLabel: string;
};

export type ActiveCollabRow = {
  id: string;
  name: string;
  brand: string;
  status: "Accepted" | "Submitted" | "Verifying" | "Credited";
  amount: string;
};

const statusColor: Record<string, string> = {
  Credited: "text-success",
  Verifying: "text-accent",
  Submitted: "text-muted",
  Accepted: "text-accent",
};

export function CollabsClient({
  invitations,
  activeCollabs,
}: {
  invitations: InvitationRow[];
  activeCollabs: ActiveCollabRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Record<string, string>>({});

  function runCheck(id: string) {
    startTransition(async () => {
      const result = await checkVerification(id);
      setNotes((prev) => ({
        ...prev,
        [id]: result.verified ? "Verified — credited!" : (result.reason ?? "Not verified yet."),
      }));
    });
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">New collabs</h2>
        {invitations.length === 0 ? (
          <div className="text-sm text-muted border border-border rounded-2xl px-6 py-8 text-center">
            No new collabs right now — check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-5.5 flex flex-col gap-3.5 rounded-2xl border border-border bg-surface hover:shadow-[0_12px_32px_-16px_rgba(0,0,0,0.18)] transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-gradient-social flex items-center justify-center text-[11px] font-bold text-white">
                      {inv.brand.charAt(0)}
                    </div>
                    <div className="text-sm font-semibold">{inv.brand}</div>
                  </div>
                  <div className="text-[11px] font-semibold text-accent bg-accent-soft px-2.5 py-1 rounded-full">
                    {TASK_TYPE_LABEL[inv.type]}
                  </div>
                </div>
                <p className="text-sm text-muted-strong leading-relaxed">
                  {inv.description}
                </p>
                <div className="flex items-center justify-between pt-0.5">
                  <div className="text-[17px] font-bold">
                    {inv.payoutLabel}
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => declineInvitation(inv.id))
                      }
                      className="text-sm text-muted disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => acceptInvitation(inv.id))
                      }
                      className="text-sm font-semibold bg-gradient-social text-white px-4.5 py-2.5 rounded-full disabled:opacity-50"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-base font-semibold">Active collabs</h2>
        <div className="border border-border rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1.3fr] px-5.5 py-3 text-[11px] text-muted">
            <div>COLLAB</div>
            <div>BRAND</div>
            <div>STATUS</div>
            <div>PAYOUT</div>
            <div>ACTION</div>
          </div>
          {activeCollabs.length === 0 ? (
            <div className="text-sm text-muted px-5.5 py-8 text-center border-t border-border-light">
              Nothing here yet — accepted invitations will show up as active collabs.
            </div>
          ) : (
            activeCollabs.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[2fr_1fr_0.8fr_0.8fr_1.3fr] items-center px-5.5 py-3.5 border-t border-border-light"
              >
                <div className="text-sm">{t.name}</div>
                <div className="text-sm text-muted-strong">{t.brand}</div>
                <div className={`text-xs ${statusColor[t.status] ?? "text-muted"}`}>
                  {t.status}
                </div>
                <div className="font-mono text-sm">{t.amount}</div>
                <div className="flex flex-col gap-0.5">
                  {t.status === "Accepted" && (
                    <button
                      disabled={isPending}
                      onClick={() => startTransition(() => submitInvitation(t.id))}
                      className="text-xs font-medium underline disabled:opacity-50 text-left"
                    >
                      Mark as posted
                    </button>
                  )}
                  {(t.status === "Submitted" || t.status === "Verifying") && (
                    <button
                      disabled={isPending}
                      onClick={() => runCheck(t.id)}
                      className="text-xs font-medium underline disabled:opacity-50 text-left"
                    >
                      Check verification
                    </button>
                  )}
                  {notes[t.id] && (
                    <span className="text-[11px] text-muted">{notes[t.id]}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
