import Link from "next/link";
import { Button } from "@/components/Button";
import { getPublicCollabPreviews } from "@/lib/public-collabs";
import { PublicCollabCards, creatorCollabExamples } from "@/components/PublicCollabCards";

export async function PublicCollabPreviewSection() {
  let previews;
  try { previews = await getPublicCollabPreviews(); }
  catch { console.error("Public collab previews are temporarily unavailable."); }
  return <section id="available-collabs" aria-labelledby="available-collabs-title" className="scroll-mt-40 border-y border-border-light bg-accent-soft/30 px-4 py-8 sm:scroll-mt-24 sm:px-8 sm:py-10 lg:px-18">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-widest text-accent">For creators · Earn from approved work</p><h2 id="available-collabs-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Find your next collab.</h2><p className="mt-3 text-sm leading-relaxed text-muted-strong">Explore the kinds of work creators can do. Sign up to see full briefs, brands and payouts for collabs matched to your profile.</p></div><Button href="/creator/signup" variant="secondary" className="bg-surface text-center">Join as a creator <span aria-hidden="true" className="ml-2">&rarr;</span></Button></div>
    <PublicCollabCards previews={creatorCollabExamples} label="Examples of creator collabs" />
    <h3 className="mb-3 mt-5 text-sm font-semibold">Available collabs</h3>
    {previews === undefined ? <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted-strong">Current collabs are temporarily unavailable. You can still create your creator profile.</p> : previews.length ? <PublicCollabCards previews={previews.slice(0,3)} /> : <div className="rounded-2xl border border-border bg-surface p-5"><p className="text-sm font-semibold">New collabs are on the way</p><p className="mt-1 text-xs text-muted-strong">Create your profile to get matched when suitable collabs become available.</p></div>}
    <div className="mt-5 border-t border-border pt-4"><p className="text-xs font-semibold">Your creator journey</p><ol className="mt-2 flex flex-wrap gap-x-3 gap-y-2 text-xs text-muted-strong">{["Complete your profile", "Accept a matched collab", "Submit for team review", "Earn after approval"].map((step,index)=><li key={step} className="flex items-center gap-3">{index>0 && <span aria-hidden="true">&rarr;</span>}<span>{step}</span></li>)}</ol></div>
    <div className="mt-3 flex flex-wrap items-start justify-between gap-3 text-xs text-muted"><p className="max-w-2xl">Rows marked Example illustrate possible work, including a multi-task campaign format. Current availability and matching depend on your profile and the brand&rsquo;s criteria.</p><p>Already registered? <Link href="/creator/login" className="font-semibold text-ink underline underline-offset-2">Creator log in</Link></p></div>
  </section>;
}
