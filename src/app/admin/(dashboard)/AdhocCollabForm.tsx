"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { NICHES } from "@/lib/niches";
import { createAdhocCollab, type AdhocCollabState } from "./actions";

const initialState: AdhocCollabState = {};

const TASK_TYPES = [
  { value: "UGC_VIDEO", label: "UGC video" },
  { value: "COMMENT", label: "Comment" },
  { value: "LIKE", label: "Like" },
  { value: "SHARE", label: "Share" },
  { value: "TAG_FRIEND", label: "Tag a friend" },
] as const;

type TaskTypeValue = (typeof TASK_TYPES)[number]["value"];

// Like/Share genuinely can't be auto-verified — no API or scraping
// method exists in either direction, for anyone (see the TaskType
// comment in schema.prisma). Surfaced here so an admin picking these
// from the dropdown knows upfront, rather than discovering it only
// when the task gets stuck in "Verifying" forever.
const UNVERIFIABLE_NOTE: Partial<Record<TaskTypeValue, string>> = {
  LIKE: "Can't be auto-verified — this collab will need Mark credited by hand once done.",
  SHARE: "Can't be auto-verified — this collab will need Mark credited by hand once done.",
};

const DEFAULT_PAYOUT: Record<TaskTypeValue, number> = {
  UGC_VIDEO: 40,
  COMMENT: 2,
  LIKE: 0.5,
  SHARE: 1,
  TAG_FRIEND: 2,
};

const PLATFORMS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TWITTER", label: "Twitter / X" },
  { value: "REDDIT", label: "Reddit" },
] as const;

export type CreatorOption = {
  id: string;
  handle: string;
  followerCount: number;
  gender: string | null;
  niches: string[];
};

export function AdhocCollabForm({ creators }: { creators: CreatorOption[] }) {
  const [state, formAction, isPending] = useActionState(createAdhocCollab, initialState);
  const [type, setType] = useState<TaskTypeValue>("UGC_VIDEO");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["value"]>("INSTAGRAM");
  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState<"any" | "women" | "men">("any");
  const [nicheFilter, setNicheFilter] = useState<Set<string>>(new Set());
  const [maxBudget, setMaxBudget] = useState(200);
  const [payoutAmount, setPayoutAmount] = useState(DEFAULT_PAYOUT.UGC_VIDEO);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const maxCreators = payoutAmount > 0 ? Math.floor(maxBudget / payoutAmount) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return creators.filter((c) => {
      if (genderFilter !== "any" && c.gender !== genderFilter) return false;
      if (nicheFilter.size > 0 && !c.niches.some((n) => nicheFilter.has(n))) return false;
      if (!q) return true;
      return c.handle.toLowerCase().includes(q) || c.niches.some((n) => n.toLowerCase().includes(q));
    });
  }, [creators, search, genderFilter, nicheFilter]);

  function toggleCreator(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxCreators) {
        next.add(id);
      }
      return next;
    });
  }

  function toggleNiche(n: string) {
    setNicheFilter((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  }

  function handleTypeChange(value: TaskTypeValue) {
    setType(value);
    setPayoutAmount(DEFAULT_PAYOUT[value]);
  }

  return (
    <form action={formAction} className="flex flex-col gap-6 border border-border p-6.5">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="platform" value={platform} />
      {[...selected].map((id) => (
        <input key={id} type="hidden" name="influencerIds" value={id} />
      ))}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Post a collab</h2>
        <span className="text-[11px] text-muted">
          No brand/budget behind this — for seeding creator engagement.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Type</span>
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as TaskTypeValue)}
            className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink"
          >
            {TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {UNVERIFIABLE_NOTE[type] && (
            <span className="text-[11px] text-accent">{UNVERIFIABLE_NOTE[type]}</span>
          )}
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Platform</span>
          <div className="flex border border-border w-fit">
            {PLATFORMS.map((p) => (
              <button
                type="button"
                key={p.value}
                onClick={() => setPlatform(p.value)}
                className={`text-sm px-4 py-2 ${
                  platform === p.value ? "bg-ink text-paper font-semibold" : "text-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Additional instructions</span>
        <textarea
          name="description"
          required
          rows={2}
          placeholder="e.g. Post a reel styling one piece from your closet with #SwayBeesSeed"
          className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink resize-none"
        />
      </label>

      {type === "UGC_VIDEO" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">
            Required caption/hashtag <span className="text-faint">(optional — needed only for auto-verification)</span>
          </span>
          <input
            type="text"
            name="verificationTag"
            placeholder="#SwayBeesSeed"
            className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink"
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">
            Target post URL <span className="text-faint">(the post to like/comment/share/tag on)</span>
          </span>
          <input
            type="url"
            name="targetPostUrl"
            placeholder="https://www.instagram.com/p/…"
            className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink"
          />
        </label>
      )}

      <div className="flex flex-col gap-3">
        <span className="text-xs text-muted">Criteria (filters the creator list below)</span>
        <div className="flex items-center gap-6">
          <div className="flex border border-border w-fit">
            {(["any", "women", "men"] as const).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGenderFilter(g)}
                className={`text-sm px-4 py-2 capitalize ${
                  genderFilter === g ? "bg-ink text-paper font-semibold" : "text-muted"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {NICHES.map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => toggleNiche(n)}
              className={`text-xs pb-0.5 border-b-[1.5px] ${
                nicheFilter.has(n) ? "font-semibold border-accent" : "text-muted border-transparent"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Max total budget ($)</span>
          <input
            type="number"
            name="maxBudget"
            min={0.5}
            step={0.5}
            value={maxBudget}
            onChange={(e) => setMaxBudget(Math.max(0, Number(e.target.value)))}
            required
            className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink w-32"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Max payout per creator ($)</span>
          <input
            type="number"
            name="payoutAmount"
            min={0.5}
            step={0.5}
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(Math.max(0, Number(e.target.value)))}
            required
            className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink w-32"
          />
        </label>
      </div>
      <p className="text-xs text-muted -mt-3">
        &asymp; up to <span className="font-mono font-medium">{maxCreators}</span> creators at this
        budget/rate.
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-muted">
            Send to ({selected.size}/{maxCreators} selected)
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by handle or niche…"
            className="text-sm border-b border-border pb-1.5 bg-transparent outline-none focus:border-ink w-full sm:w-56"
          />
        </div>
        <div className="border border-border max-h-64 overflow-y-auto divide-y divide-border-light">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted px-4 py-6 text-center">
              No creators match these criteria.
            </div>
          ) : (
            filtered.map((c) => {
              const disabled = !selected.has(c.id) && selected.size >= maxCreators;
              return (
                <label
                  key={c.id}
                  className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${
                    disabled ? "opacity-40" : "cursor-pointer hover:bg-accent-soft"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      disabled={disabled}
                      onChange={() => toggleCreator(c.id)}
                    />
                    <span className="font-medium truncate">{c.handle}</span>
                    <span className="text-xs text-muted truncate hidden sm:inline">
                      {c.niches.join(", ")}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted whitespace-nowrap">
                    {c.followerCount.toLocaleString()} followers
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-success">{state.success}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || selected.size === 0}>
          {isPending ? "Dispatching…" : `Dispatch to ${selected.size || ""} creator${selected.size === 1 ? "" : "s"}`}
        </Button>
      </div>
    </form>
  );
}
