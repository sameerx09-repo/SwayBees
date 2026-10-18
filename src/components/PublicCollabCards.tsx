import Link from "next/link";
import type { PublicCollabPreview } from "@/lib/public-collab-preview";
import { LandingIcon, type LandingIconName } from "@/components/LandingIcon";

type PreviewCard = Omit<PublicCollabPreview, "type"> & { type: PublicCollabPreview["type"] | "CAMPAIGN"; example?: boolean };

export const creatorCollabExamples: PreviewCard[] = [
  { type: "UGC_VIDEO", title: "Create 1 UGC video", description: "Film one original video following the brand’s brief.", label: "UGC video", instagramLabel: null, example: true },
  { type: "CAMPAIGN", title: "Join a campaign and complete multiple tasks", description: "An example campaign combining content and engagement tasks.", label: "Campaign", instagramLabel: null, example: true },
];

const iconForType: Record<PreviewCard["type"], LandingIconName> = { UGC_VIDEO: "video", CAMPAIGN: "campaign", COMMENT: "comment", LIKE: "like", TAG_FRIEND: "tag", SHARE: "campaign" };

export function PublicCollabCards({ previews, label = "Available collab previews" }: { previews: PreviewCard[]; label?: string }) {
  return <ul className="flex flex-col gap-2.5" aria-label={label}>
    {previews.map((preview,index)=><li key={`${preview.type}-${index}`}><Link href="/creator/signup" prefetch={false} aria-label={`View ${preview.label.toLowerCase()} collab details${preview.example ? " example" : ""}`} className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 transition-shadow hover:border-accent/50 hover:shadow-[0_8px_28px_-18px_rgba(0,0,0,0.25)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="flex min-w-0 flex-1 items-start gap-3"><span className="mt-0.5 rounded-xl bg-accent-soft p-2.5 text-accent"><LandingIcon name={iconForType[preview.type]} className="h-5 w-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="text-sm font-semibold">{preview.title}</h3>{preview.example && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">Example</span>}</div><p className="mt-1 text-xs leading-relaxed text-muted-strong">{preview.example ? preview.description : preview.instagramLabel ?? (preview.type === "UGC_VIDEO" ? "Video creation brief" : "Instagram post")}</p></div></div>
      <div className="flex shrink-0 items-center justify-between gap-7 border-t border-border-light pt-3 sm:border-0 sm:pt-0"><div><span className="block text-[11px] text-muted">Brand</span><span aria-label="Brand name hidden" className="mt-0.5 block text-sm tracking-wide text-muted-strong">••••••••</span></div><div><span className="block text-[11px] text-muted">Payout</span><span aria-label="Payout amount hidden" className="mt-0.5 block font-mono text-sm text-muted-strong">₹•••</span></div></div>
    </Link></li>)}
  </ul>;
}
