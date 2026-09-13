"use client";

import { useMemo, useState } from "react";
import type { TaskType } from "@prisma/client";
import { TASK_TYPE_LABEL } from "@/lib/task-type-label";

export type CellFormat =
  | "text"
  | "number"
  | "percent"
  | "money"
  | "money-success"
  | "task-type"
  | "platform"
  | "niches";

export type InsightsColumn<T> = {
  key: keyof T & string;
  label: string;
  format?: CellFormat;
};

type SortDir = "asc" | "desc";

const NUMERIC_FORMATS: CellFormat[] = ["number", "percent", "money", "money-success"];

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function renderCell(value: unknown, format?: CellFormat): React.ReactNode {
  switch (format) {
    case "money":
      return `$${Number(value).toFixed(2)}`;
    case "money-success":
      return <span className="text-success">${Number(value).toFixed(2)}</span>;
    case "percent":
      return `${value}%`;
    case "number":
      return typeof value === "number" ? value.toLocaleString() : String(value);
    case "task-type":
      return (
        <span className="font-mono text-[11px] text-muted">
          {TASK_TYPE_LABEL[value as TaskType]}
        </span>
      );
    case "platform":
      return capitalize(String(value).toLowerCase());
    case "niches":
      return (
        <span className="text-xs text-muted truncate">
          {Array.isArray(value) ? value.join(", ") : String(value)}
        </span>
      );
    default:
      return String(value);
  }
}

/**
 * Shared sortable (and optionally searchable) breakdown table for every
 * cut on the Insights page — by brand/type/platform/creator all follow
 * the exact same interaction (click a header to sort, click again to
 * flip direction). Columns are plain serializable data (a field key + a
 * format enum), not functions — this renders as a Client Component but
 * the page that feeds it rows is a Server Component, and functions
 * can't cross that boundary as props.
 * `gridColsClass` must be a complete literal string at the call site —
 * Tailwind's build-time scanner needs to see the whole arbitrary-value
 * class as text somewhere in source, same constraint as CollabsTable.
 */
export function InsightsTable<T extends Record<string, unknown>>({
  title,
  rows,
  columns,
  idKey,
  gridColsClass,
  minWidthClass = "min-w-[640px]",
  defaultSortKey,
  defaultSortDir = "desc",
  search,
  scrollable,
  emptyMessage = "Nothing here yet.",
}: {
  title: string;
  rows: T[];
  columns: InsightsColumn<T>[];
  idKey: keyof T & string;
  gridColsClass: string;
  minWidthClass?: string;
  defaultSortKey: keyof T & string;
  defaultSortDir?: SortDir;
  search?: { placeholder: string; keys: (keyof T & string)[] };
  scrollable?: boolean;
  emptyMessage?: string;
}) {
  const [sortKey, setSortKey] = useState<string>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultSortDir);
  const [query, setQuery] = useState("");

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = useMemo(() => {
    if (!search || !query.trim()) return rows;
    const q = query.trim().toLowerCase();
    return rows.filter((r) =>
      search.keys.some((k) => {
        const v = r[k];
        if (Array.isArray(v)) return v.some((x) => String(x).toLowerCase().includes(q));
        return String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, query, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-base font-semibold">
          {title} ({rows.length})
        </h2>
        {search && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={search.placeholder}
            className="text-sm border-b border-border pb-1.5 bg-transparent outline-none focus:border-ink w-full sm:w-56"
          />
        )}
      </div>
      <div className="border border-border overflow-x-auto">
        <div className={minWidthClass}>
          <div className={`${gridColsClass} px-5.5 py-3 text-[11px] text-muted`}>
            {columns.map((c) => {
              const numeric = c.format ? NUMERIC_FORMATS.includes(c.format) : false;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => handleSort(c.key)}
                  className={`flex items-center gap-1 ${numeric ? "justify-end" : "justify-start"} ${
                    sortKey === c.key ? "text-ink font-semibold" : ""
                  }`}
                >
                  {c.label}
                  {sortKey === c.key && (
                    <span className="text-[9px]">{sortDir === "asc" ? "▲" : "▼"}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className={scrollable ? "max-h-[480px] overflow-y-auto" : undefined}>
            {sorted.length === 0 ? (
              <div className="text-sm text-muted px-5.5 py-8 text-center border-t border-border-light">
                {emptyMessage}
              </div>
            ) : (
              sorted.map((row) => (
                <div
                  key={String(row[idKey])}
                  className={`${gridColsClass} items-center px-5.5 py-3 border-t border-border-light`}
                >
                  {columns.map((c) => {
                    const numeric = c.format ? NUMERIC_FORMATS.includes(c.format) : false;
                    return (
                      <div key={c.key} className={`text-sm ${numeric ? "font-mono text-right" : ""}`}>
                        {renderCell(row[c.key], c.format)}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
