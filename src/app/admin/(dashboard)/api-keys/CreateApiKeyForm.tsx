"use client";

import { useActionState } from "react";
import { Button } from "@/components/Button";
import { createApiKey, type CreateApiKeyState } from "./actions";

const initialState: CreateApiKeyState = {};

export function CreateApiKeyForm() {
  const [state, formAction, isPending] = useActionState(createApiKey, initialState);

  return (
    <div className="flex flex-col gap-4 border border-border p-6.5">
      <form action={formAction} className="flex items-end gap-4">
        <label className="flex flex-col gap-1.5 flex-1">
          <span className="text-xs text-muted">Name</span>
          <input
            type="text"
            name="name"
            required
            placeholder="e.g. UGC Creation App"
            className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink"
          />
        </label>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create key"}
        </Button>
      </form>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      {state.rawKey && (
        <div className="border border-accent/30 bg-accent-soft px-5 py-4 flex flex-col gap-2">
          <div className="text-sm font-semibold">
            &ldquo;{state.keyName}&rdquo; created — copy this now
          </div>
          <p className="text-xs text-muted-strong">
            This is the only time the full key is shown. It can&rsquo;t be recovered later —
            only revoked and replaced with a new one.
          </p>
          <code className="text-sm font-mono bg-surface border border-border px-3 py-2 break-all select-all">
            {state.rawKey}
          </code>
        </div>
      )}
    </div>
  );
}
