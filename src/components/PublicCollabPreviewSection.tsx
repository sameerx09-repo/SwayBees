import Link from "next/link";
import { getPublicCollabPreviews } from "@/lib/public-collabs";
import { PublicCollabCards } from "@/components/PublicCollabCards";

export async function PublicCollabPreviewSection() {
  let previews;
  try { previews = await getPublicCollabPreviews(); }
  catch {
    console.error("Public collab previews are temporarily unavailable.");
    return <PreviewSection><p className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted">Collab previews are temporarily unavailable. You can still create your creator profile.</p></PreviewSection>;
  }
  return <PreviewSection>
    {previews.length ? <PublicCollabCards previews={previews.slice(0, 3)} /> : <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8"><h3 className="font-semibold">New collabs are on the way</h3><p className="mt-2 text-sm text-muted-strong">Create your profile to get matched when suitable collabs become available.</p></div>}
  </PreviewSection>;
}

function PreviewSection({ children }: { children: React.ReactNode }) {
  return <section id="available-collabs" aria-labelledby="available-collabs-title" className="scroll-mt-24 border-y border-border-light bg-accent-soft/20 px-4 py-7 sm:px-8 sm:py-8 lg:px-18 flex flex-col gap-4">
    <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-wider text-accent">For creators</p><h2 id="available-collabs-title" className="mt-2 text-2xl font-bold tracking-tight">Available collabs</h2><p className="mt-2 text-sm leading-relaxed text-muted-strong">Create, comment, like or share. Find your next collab on SwayBees.</p></div>
    {children}
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted"><p>Collabs are matched to your profile.</p><p>Already registered? <Link href="/creator/login" className="font-semibold text-ink underline">Creator log in</Link></p></div>
  </section>;
}
