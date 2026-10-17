export default function LoadingAdmin() {
  return <div role="status" aria-live="polite" className="flex flex-col gap-4">
    <p className="text-sm text-muted">Loading dashboard…</p>
    <div className="h-48 animate-pulse rounded-2xl bg-accent-soft" />
  </div>;
}
