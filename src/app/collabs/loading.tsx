export default function LoadingCollabs() {
  return <div role="status" aria-live="polite" className="flex flex-col gap-4">
    <p className="text-sm text-muted">Loading your collabs…</p>
    {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-accent-soft" />)}
  </div>;
}
