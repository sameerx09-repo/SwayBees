import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { PublicCollabPreviewSection } from "@/components/PublicCollabPreviewSection";

export const revalidate = 60;

const steps = [
  { n: "01", title: "Pick a plan, set your budget", body: "Choose UGC creation or add engagement collabs. Set your audience criteria and a budget for creator work." },
  { n: "02", title: "Match and dispatch", body: "Match your audience criteria to eligible creators and send collab invitations with the work you need." },
  { n: "03", title: "Review and track", body: "Creators submit completed work for review. Track collab progress and approved payouts from your dashboard." },
];

export default function LandingPage() {
  return <div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border-light bg-paper/85 px-4 py-5 backdrop-blur-sm sm:px-8 sm:py-6 lg:px-18">
      <Logo />
      <nav aria-label="Main navigation" className="hidden items-center gap-7 lg:flex">
        <a href="#how-it-works" className="text-sm text-muted-strong">How it works</a>
        <a href="#plans" className="text-sm text-muted-strong">Plans</a>
        <a href="#available-collabs" className="text-sm text-muted-strong">Available collabs</a>
        <Link href="/creator/signup" className="text-sm text-muted-strong">Creators: join here</Link>
      </nav>
      <div className="flex items-center gap-4">
        <Link href="/login" className="text-sm text-muted-strong">Log in</Link>
        <Button href="/signup" className="px-4 sm:px-5">Get started</Button>
      </div>
    </header>
    <main>
      <section className="grid grid-cols-1 items-center gap-10 px-4 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-18 lg:py-20">
        <div className="flex flex-col gap-7">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-gradient-social" />
            <div className="text-xs font-semibold tracking-wide text-accent">FOR BEAUTY, WELLNESS &amp; DTC BRANDS</div>
          </div>
          <h1 className="max-w-xl text-3xl font-bold leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.1]">UGC and engagement,{" "}<span className="text-gradient-social">in one place.</span></h1>
          <p className="max-w-md text-base leading-relaxed text-muted-strong">Set a budget, find creators, and manage your collabs with SwayBees. From UGC videos to Instagram engagement, follow each collab from invitation to review.</p>
          <div className="flex flex-wrap items-center gap-4 pt-2 sm:gap-6">
            <Button href="/signup">Get started</Button>
            <a href="#how-it-works" className="flex items-center gap-1.5 text-sm font-semibold">See how it works <span>&rarr;</span></a>
          </div>
        </div>
        <div aria-label="Collab workflow illustration" className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_20px_60px_-24px_rgba(0,0,0,0.18)]">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3"><div className="ring-gradient-social"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-xs font-bold">SB</div></div><div className="text-sm font-semibold">Your next brand collab</div></div>
            <span className="text-[11px] text-muted">Illustration</span>
          </div>
          <div className="flex h-48 flex-col items-center justify-center gap-3 bg-gradient-social text-white sm:h-56">
            <svg aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2" className="h-14 w-14"><rect x="9" y="5" width="30" height="38" rx="7" /><path d="m20 17 11 7-11 7V17Z" strokeLinejoin="round" /></svg>
            <span className="text-xl font-semibold">Create. Connect. Collaborate.</span>
          </div>
          <div className="px-5 py-5"><div className="text-sm font-semibold">Content made by creators</div><p className="mt-1 text-sm leading-relaxed text-muted-strong">Bring your brief to life with UGC and Instagram collabs.</p></div>
          <div className="grid grid-cols-3 divide-x divide-border-light border-t border-border-light text-center text-xs text-muted-strong">
            {["Match", "Create", "Review"].map(label => <div key={label} className="px-3 py-4 font-semibold">{label}</div>)}
          </div>
        </div>
      </section>
      <Suspense fallback={<section id="available-collabs" className="px-4 py-8 sm:px-8 lg:px-18"><h2 className="text-2xl font-bold tracking-tight">Available collabs</h2><p role="status" className="mt-4 text-sm text-muted">Loading collabs…</p></section>}>
        <PublicCollabPreviewSection />
      </Suspense>
      <section id="how-it-works" className="scroll-mt-24 flex flex-col gap-10 px-4 py-14 sm:px-8 sm:py-20 lg:px-18 lg:py-24">
        <h2 className="text-[26px] font-bold tracking-tight">How it works</h2>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:gap-12">
          {steps.map(step => <div key={step.n} className="flex flex-col gap-3.5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-social text-xs font-bold text-white">{step.n}</div><h3 className="text-base font-semibold">{step.title}</h3><p className="text-sm leading-relaxed text-muted-strong">{step.body}</p></div>)}
        </div>
      </section>
      <section id="plans" className="scroll-mt-24 flex flex-col gap-8 px-4 pb-16 sm:px-8 sm:pb-20 lg:px-18 lg:pb-26">
        <h2 className="text-[26px] font-bold tracking-tight">Plans</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-5 rounded-3xl border border-border p-7 sm:p-9"><div><h3 className="text-base font-semibold">Starter</h3><p className="mt-1 text-sm text-muted">UGC creation</p></div><p className="text-sm leading-relaxed text-muted-strong">Find creators for video content, manage collab invitations, and review submitted work.</p><Button href="/signup" variant="secondary" className="mt-auto text-center">Choose Starter</Button></div>
          <div className="rounded-3xl bg-gradient-social p-[2px]"><div className="flex h-full flex-col gap-5 rounded-3xl bg-surface p-7 sm:p-9"><div><h3 className="text-base font-semibold">Pro</h3><p className="mt-1 text-sm text-muted">UGC + engagement</p></div><p className="text-sm leading-relaxed text-muted-strong">Combine creator content with Instagram engagement collabs and track their progress in one dashboard.</p><Button href="/signup" className="mt-auto text-center">Choose Pro</Button></div></div>
        </div>
      </section>
    </main>
    <footer className="border-t border-border-light px-4 py-6 text-sm text-muted sm:px-8 lg:px-18">&copy; SwayBees</footer>
  </div>;
}
