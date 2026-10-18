import type { SVGProps } from "react";

export type LandingIconName = "brand" | "video" | "campaign" | "comment" | "like" | "tag" | "review";

export function LandingIcon({ name, ...props }: SVGProps<SVGSVGElement> & { name: LandingIconName }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    {name === "brand" && <><path d="M3 10h18l-2-6H5l-2 6Z" /><path d="M4 10v10h16V10M9 20v-6h6v6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /></>}
    {name === "video" && <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 10h18M8 5l3 5M15 5l3 5m-8 3 5 2.5-5 2.5v-5Z" /></>}
    {name === "campaign" && <><path d="m3 6 1.5 1.5L7 5M10 6h11M3 12l1.5 1.5L7 11M10 12h11M3 18l1.5 1.5L7 17M10 18h11" /></>}
    {name === "comment" && <path d="M21 11a8.5 8.5 0 0 1-12 8L3 21l2-6a8.5 8.5 0 1 1 16-4Z" />}
    {name === "like" && <path d="M20.5 5.5a5 5 0 0 0-7 0L12 7l-1.5-1.5a5 5 0 0 0-7 7L12 21l8.5-8.5a5 5 0 0 0 0-7Z" />}
    {name === "tag" && <><circle cx="12" cy="12" r="4" /><path d="M16 8v6a2 2 0 0 0 4 0v-2a8 8 0 1 0-3 6.3" /></>}
    {name === "review" && <><path d="m12 3 7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3Z" /><path d="m8.5 11.5 2.5 2.5 4.5-4.5" /></>}
  </svg>;
}
