"use client";

import { useState, useTransition } from "react";
import { runTaskGeneration } from "./actions";

export function GenerateCollabsButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function run() {
    startTransition(async () => {
      const result = await runTaskGeneration();
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setMessage(
        `Dispatched ${result.ugcTasksCreated} UGC collab${result.ugcTasksCreated === 1 ? "" : "s"}` +
          (result.commentTasksCreated > 0
            ? ` and ${result.commentTasksCreated} comment collab${result.commentTasksCreated === 1 ? "" : "s"}`
            : "") +
          ` to your eligible pool of ${result.eligiblePoolSize} creator${result.eligiblePoolSize === 1 ? "" : "s"}.`
      );
    });
  }

  return (
    <div className="flex flex-col gap-2 items-end">
      <button
        disabled={isPending}
        onClick={run}
        className="text-xs font-medium underline disabled:opacity-50"
      >
        {isPending ? "Dispatching…" : "Generate this cycle's collabs"}
      </button>
      {message && <p className="text-[11px] text-muted text-right max-w-[220px]">{message}</p>}
    </div>
  );
}
