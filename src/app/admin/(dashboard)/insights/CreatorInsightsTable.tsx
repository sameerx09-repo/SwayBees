"use client";

import { useMemo, useState } from "react";
import type { CreatorBreakdown } from "@/lib/admin-insights";

export function CreatorInsightsTable({ rows }: { rows: CreatorBreakdown[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.handle.toLowerCase().includes(q) || r.niches.some((n) => n.toLowerCase().includes(q))
    );
  }, [rows, search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">By creator ({rows.length})</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by handle or niche…"
          className="text-sm border-b border-border pb-1.5 bg-transparent outline-none focus:border-ink w-56"
        />
      </div>
      <div className="border border-border">
        <div className="grid grid-cols-[1.2fr_1.4fr_0.7fr_0.9fr_0.7fr_0.9fr_0.9fr] px-5.5 py-3 text-[11px] text-muted">
          <div>CREATOR</div>
          <div>NICHES</div>
          <div>FOLLOWERS</div>
          <div>COLLABS</div>
          <div>COMPLETED</div>
          <div>COMPLETION</div>
          <div>EARNED</div>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted px-5.5 py-8 text-center border-t border-border-light">
              No creators match &ldquo;{search}&rdquo;.
            </div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-[1.2fr_1.4fr_0.7fr_0.9fr_0.7fr_0.9fr_0.9fr] items-center px-5.5 py-3 border-t border-border-light"
              >
                <div className="text-sm font-medium">{r.handle}</div>
                <div className="text-xs text-muted truncate">{r.niches.join(", ")}</div>
                <div className="font-mono text-xs text-muted">
                  {r.followerCount.toLocaleString()}
                </div>
                <div className="font-mono text-sm">{r.invitationCount}</div>
                <div className="font-mono text-sm">{r.credited}</div>
                <div className="font-mono text-sm">{r.completionRate}%</div>
                <div className="font-mono text-sm">${r.totalEarned.toFixed(2)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
