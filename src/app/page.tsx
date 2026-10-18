import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { LandingIcon } from "@/components/LandingIcon";
import { PublicCollabPreviewSection } from "@/components/PublicCollabPreviewSection";

export const revalidate = 60;

const brandSteps = [
  { title: "Set your brief & budget", body: "Choose the work you need and the audience you want to reach." },
  { title: "Invite matched creators", body: "Send collabs to creators who meet your campaign criteria." },
  { title: "Track progress & approval", body: "Follow responses and submissions. The SwayBees team verifies completed work." },
];

export default function LandingPage() {
  return <div className="flex min-h-screen flex-col">
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-border-light bg-paper/95 px-4 py-4 backdrop-blur-sm sm:px-8 sm:py-5 lg:px-18">
      <Logo />
      <nav aria-label="Main navigation" className="order-3 flex w-full items-center justify-between gap-3 border-t border-border-light pt-3 text-xs text-muted-strong sm:order-none sm:w-auto sm:gap-7 sm:border-0 sm:pt-0 sm:text-sm">
        <a href="#for-brands" className="py-2 hover:text-ink">For brands</a>
        <a href="#available-collabs" className="py-2 hover:text-ink">For creators</a>
        <a href="#plans" className="py-2 hover:text-ink">Brand plans</a>
      </nav>
      <Link href="/login" className="py-2 text-sm text-muted-strong underline underline-offset-4">Log in</Link>
    </header>
    <main>
      <section className="grid items-center gap-9 px-4 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14 lg:px-18 lg:py-18">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Brands meet creators</p>
          <h1 className="mt-4 max-w-xl text-4xl font-bold leading-[1.12] tracking-tight sm:text-5xl">Great brands.<br />Creative people.<br /><span className="text-gradient-social">Collabs that connect.</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-strong sm:text-base">Brands find creators for content and Instagram engagement. Creators find paid video tasks, engagement collabs and campaigns matched to their profile.</p>
          <div className="mt-7 flex flex-col gap-3 min-[400px]:flex-row min-[400px]:flex-wrap"><Button href="#for-brands" className="text-center">I&rsquo;m a brand <span aria-hidden="true" className="ml-2">&rarr;</span></Button><Button href="#available-collabs" variant="secondary" className="bg-surface text-center">I&rsquo;m a creator <span aria-hidden="true" className="ml-2">&rarr;</span></Button></div>
          <p className="mt-3 text-xs text-muted">Choose your path. Both belong here.</p>
        </div>
        <div aria-label="How brands and creators collaborate" className="overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_16px_40px_-24px_rgba(0,0,0,0.18)]">
          <p className="border-b border-border-light px-5 py-4 text-sm font-semibold">One platform. Two sides of a collab.</p>
          <div className="flex items-center justify-between gap-3 bg-gradient-social px-5 py-8 text-white sm:px-7">
            <div className="flex flex-1 flex-col items-center gap-2 text-center"><span className="mb-1 rounded-2xl border border-white/50 bg-white/10 p-3"><LandingIcon name="brand" className="h-6 w-6" /></span><span className="text-sm font-semibold">Brands</span><span className="text-xs">Set the brief &amp; budget</span></div>
            <span aria-hidden="true" className="text-xl">&harr;</span>
            <div className="flex flex-1 flex-col items-center gap-2 text-center"><span className="mb-1 rounded-2xl border border-white/50 bg-white/10 p-3"><LandingIcon name="video" className="h-6 w-6" /></span><span className="text-sm font-semibold">Creators</span><span className="text-xs">Complete &amp; submit work</span></div>
          </div>
          <div className="flex items-start gap-3 px-5 py-4"><LandingIcon name="review" className="mt-0.5 h-5 w-5 shrink-0 text-muted-strong" /><div><p className="text-sm font-semibold">Reviewed by the SwayBees team</p><p className="mt-1 text-xs leading-relaxed text-muted-strong">Approved work is credited to the creator&rsquo;s wallet.</p></div></div>
        </div>
      </section>
      <Suspense fallback={<section id="available-collabs" className="scroll-mt-40 px-4 py-8 sm:scroll-mt-24 sm:px-8 lg:px-18"><h2 className="text-2xl font-bold tracking-tight">Find your next collab.</h2><p role="status" className="mt-4 text-sm text-muted">Loading collabs…</p></section>}><PublicCollabPreviewSection /></Suspense>
      <section id="for-brands" aria-labelledby="for-brands-title" className="scroll-mt-40 px-4 py-10 sm:scroll-mt-24 sm:px-8 sm:py-14 lg:px-18">
        <div className="flex flex-wrap items-end justify-between gap-5"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-widest text-accent">For brands · Fund your next campaign</p><h2 id="for-brands-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Find creators. Manage your collabs.</h2><p className="mt-3 text-sm leading-relaxed text-muted-strong">Create a campaign for video content or Instagram engagement, with a budget and audience criteria you choose.</p></div><Button href="/signup" className="text-center">Create a brand account <span aria-hidden="true" className="ml-2">&rarr;</span></Button></div>
        <h3 id="how-it-works" className="mt-8 scroll-mt-40 text-sm font-semibold sm:scroll-mt-24">How it works for brands</h3>
        <ol className="mt-5 grid gap-7 sm:grid-cols-3 sm:gap-9">{brandSteps.map((step,index)=><li key={step.title}><span className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">{String(index+1).padStart(2,"0")}</span><h4 className="text-sm font-semibold">{step.title}</h4><p className="mt-2 text-sm leading-relaxed text-muted-strong">{step.body}</p></li>)}</ol>
      </section>
      <section id="plans" aria-labelledby="brand-plans-title" className="scroll-mt-40 px-4 pb-12 sm:scroll-mt-24 sm:px-8 sm:pb-16 lg:px-18">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">For brands</p><h2 id="brand-plans-title" className="mt-2 text-2xl font-bold tracking-tight">Plans for brands</h2><p className="mt-3 text-sm text-muted-strong">Choose the type of creator work your brand needs.</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2"><div className="flex flex-col gap-4 rounded-3xl border border-border bg-surface p-6 sm:p-8"><div><h3 className="text-lg font-semibold">Starter</h3><p className="mt-1 text-sm text-muted-strong">Creator-made video content</p></div><p className="text-sm leading-relaxed text-muted-strong">Find creators for user-generated content and track their collabs through submission and team review.</p><Button href="/signup?plan=starter" variant="secondary" className="mt-auto text-center">Brand signup · Starter</Button></div><div className="rounded-3xl bg-gradient-social p-[2px]"><div className="flex h-full flex-col gap-4 rounded-3xl bg-surface p-6 sm:p-8"><div><h3 className="text-lg font-semibold">Pro</h3><p className="mt-1 text-sm text-muted-strong">Video content + Instagram engagement</p></div><p className="text-sm leading-relaxed text-muted-strong">Combine creator videos with engagement collabs in one campaign workflow.</p><Button href="/signup?plan=pro" className="mt-auto text-center">Brand signup · Pro</Button></div></div></div>
      </section>
    </main>
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-light px-4 py-6 text-xs text-muted sm:px-8 lg:px-18"><span>&copy; SwayBees</span><span>Brands fund collabs. Creators earn for approved work.</span></footer>
  </div>;
}
