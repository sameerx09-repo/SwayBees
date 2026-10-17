"use client";
import { useState, useTransition } from "react";
import { setApplicationMode } from "@/app/mode-actions";

export function ModeSwitch({ mode }: { mode: "test" | "live" }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <div className="flex flex-col gap-1">
    <label className="flex items-center gap-2 text-xs font-medium">
      Mode
      <select aria-label="Application mode" value={mode} disabled={pending} className="border border-border rounded-full bg-surface px-3 py-2 disabled:opacity-50" onChange={(event) => {
        const next = event.target.value as "test" | "live";
        setError("");
        startTransition(async () => { try { const result = await setApplicationMode(next); setError(result.error ?? ""); } catch { setError("Couldn't switch mode. Try again."); } });
      }}><option value="live">Live</option><option value="test">Test</option></select>
      {pending && <span role="status">Switching…</span>}
    </label>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
  </div>;
}

export function ModeNotice({ mode }: { mode: "test" | "live" }) {
  return <div className={`rounded-xl border px-4 py-3 text-sm ${mode === "test" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-border text-muted"}`}>
    {mode === "test" ? "Test mode — showing test collabs and simulated earnings. No live payouts." : "Live mode — showing live collabs and earnings."}
  </div>;
}
