import Link from "next/link";
import type { PublicCollabPreview } from "@/lib/public-collab-preview";

function LockIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 shrink-0" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></svg>;
}

export function PublicCollabCards({ previews }: { previews: PublicCollabPreview[] }) {
  return <ul className="flex flex-col gap-3" aria-label="Available collab previews">
    {previews.map((preview, index) => <li key={`${preview.type}-${index}`}>
      <Link href="/creator/signup" prefetch={false} aria-label={`View ${preview.label.toLowerCase()} collab details`} className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 sm:px-5 sm:py-4 transition-shadow hover:border-accent/50 hover:shadow-[0_8px_28px_-18px_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2.5"><span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">{preview.label}</span><span className="text-xs text-muted">Instagram</span></div>
          <div><h3 className="text-sm sm:text-base font-semibold">{preview.title}</h3><p className="mt-1 text-sm text-muted-strong">{preview.description}</p></div>
          <p className="flex min-w-0 items-center gap-2 text-xs text-muted"><LockIcon /><span className="min-w-0 break-all">{preview.instagramLabel ?? (preview.type === "UGC_VIDEO" ? "Video creation brief" : "Instagram post")}</span></p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-7 gap-y-3 border-t border-border-light pt-4 sm:justify-end sm:border-t-0 sm:pt-0">
          <div className="flex flex-col gap-1"><span className="text-[11px] text-muted">Brand</span><span className="flex items-center gap-2 text-sm text-muted-strong"><LockIcon /><span aria-label="Brand name hidden">••••••••</span></span></div>
          <div className="flex flex-col gap-1"><span className="text-[11px] text-muted">Payout</span><span className="font-mono text-sm text-muted-strong" aria-label="Payout amount hidden">₹•••</span></div>
        </div>
      </Link>
    </li>)}
  </ul>;
}
