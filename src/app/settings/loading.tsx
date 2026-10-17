export default function LoadingSettings() {
  return <div role="status" aria-live="polite" className="flex flex-col gap-4">
    <p className="text-sm text-muted">Loading your account…</p>
    <div className="h-48 animate-pulse rounded-2xl bg-accent-soft" />
  </div>;
}
