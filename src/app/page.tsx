import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";

const steps = [
  {
    n: "01",
    title: "Pick a plan, set your budget",
    body: "Starter covers UGC creation. Pro adds verified engagement. Your budget — separate from the subscription — decides how many creators get engaged each month.",
  },
  {
    n: "02",
    title: "We match, dispatch & verify",
    body: "Our engine matches your audience criteria to eligible creators, dispatches collabs, and confirms every post and comment automatically — no submissions to check by hand.",
  },
  {
    n: "03",
    title: "Watch it happen",
    body: "No submissions to review. Track UGC created, profiles engaged, and engagement rate from one dashboard, in real time.",
  },
];

const stats = [
  { label: "verified creators", value: "1,200+" },
  { label: "auto-verified", value: "100%" },
  { label: "briefs you have to write", value: "0" },
];

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <path d="M12 21s-6.7-4.35-9.3-8.1C.9 10.2 1.4 6.9 4 5.3c2.2-1.4 4.9-.8 6.4 1.1L12 8l1.6-1.6c1.5-1.9 4.2-2.5 6.4-1.1 2.6 1.6 3.1 4.9 1.3 7.6C18.7 16.65 12 21 12 21z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
      <path d="M22 2 11 13" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 2 15 22l-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <header className="flex items-center justify-between px-4 sm:px-8 lg:px-18 py-5 sm:py-6 border-b border-border-light sticky top-0 bg-paper/85 backdrop-blur-sm z-10">
        <Logo />
        <nav className="hidden md:flex items-center gap-10">
          <a href="#how-it-works" className="text-sm text-muted-strong">
            How it works
          </a>
          <a href="#plans" className="text-sm text-muted-strong">
            Pricing
          </a>
          <Link href="/creator/signup" className="text-sm text-muted-strong">
            Creators: join here
          </Link>
          <Link href="/login" className="text-sm text-muted-strong">
            Log in
          </Link>
          <Button href="/signup">Get started</Button>
        </nav>
        <div className="flex md:hidden items-center gap-4">
          <Link href="/login" className="text-sm text-muted-strong">
            Log in
          </Link>
          <Button href="/signup">Get started</Button>
        </div>
      </header>

      <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 lg:gap-16 px-4 sm:px-8 lg:px-18 py-14 sm:py-20 lg:py-28 items-center">
        <div className="flex flex-col gap-7">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-accent-soft px-3.5 py-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-gradient-social" />
            <div className="text-xs font-semibold tracking-wide text-accent">
              FOR BEAUTY, WELLNESS &amp; DTC BRANDS
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] lg:leading-[1.1] max-w-xl">
            UGC and engagement,{" "}
            <span className="text-gradient-social">on autopilot.</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-strong max-w-md">
            Subscribe, set a budget, and SwayFam sources creators, dispatches
            collabs, verifies every post automatically, and pays out. No briefs to
            write, no submissions to review.
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
            <Button href="/signup">Start your plan</Button>
            <a href="#how-it-works" className="text-sm font-semibold flex items-center gap-1.5">
              See how it works <span>&rarr;</span>
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface shadow-[0_20px_60px_-24px_rgba(0,0,0,0.18)] overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="ring-gradient-social">
              <div className="h-9 w-9 rounded-full bg-surface flex items-center justify-center text-xs font-bold">
                LS
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-sm font-semibold">lumiere.skincare</div>
              <div className="text-[11px] text-muted">Sponsored &middot; via SwayFam</div>
            </div>
          </div>
          <div className="h-64 bg-gradient-social" />
          <div className="flex items-center gap-4 px-5 pt-4 text-ink">
            <HeartIcon />
            <CommentIcon />
            <ShareIcon />
          </div>
          <div className="px-5 pt-2 pb-5 flex flex-col gap-1">
            <div className="text-sm font-semibold">2,481 likes</div>
            <div className="text-sm text-muted-strong">
              <span className="font-semibold text-ink">sophia.glow</span> obsessed
              with this serum 😍 #lumiereskincare
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border-light border-t border-border-light">
            {[
              ["UGC this month", "12"],
              ["Profiles engaged", "34"],
              ["Avg. engagement", "4.8%"],
            ].map(([label, value]) => (
              <div key={label} className="px-4 py-3.5 flex flex-col gap-0.5">
                <div className="font-mono text-base font-semibold">{value}</div>
                <div className="text-[11px] text-muted">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col sm:flex-row border-t border-b border-border-light px-4 sm:px-8 lg:px-18">
        {stats.map(({ label, value }, i) => (
          <div
            key={label}
            className={`flex-1 py-5 sm:py-6.5 ${
              i > 0 ? "border-t sm:border-t-0 sm:border-l border-border-light sm:pl-8" : ""
            }`}
          >
            <div className="text-[22px] font-bold text-gradient-social">{value}</div>
            <div className="text-sm text-muted mt-0.5">{label}</div>
          </div>
        ))}
      </section>

      <section id="how-it-works" className="px-4 sm:px-8 lg:px-18 py-14 sm:py-20 lg:py-24 flex flex-col gap-10 lg:gap-13">
        <h2 className="text-[26px] font-bold tracking-tight">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col gap-3.5">
              <div className="h-9 w-9 rounded-full bg-gradient-social text-white flex items-center justify-center text-xs font-bold">
                {s.n}
              </div>
              <div className="text-base font-semibold">{s.title}</div>
              <p className="text-sm leading-relaxed text-muted-strong">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="plans" className="px-4 sm:px-8 lg:px-18 pb-16 sm:pb-20 lg:pb-26 flex flex-col gap-11">
        <h2 className="text-[26px] font-bold tracking-tight">Plans</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-9 rounded-3xl border border-border flex flex-col gap-5.5">
            <div>
              <div className="text-[15px] font-semibold">Starter</div>
              <div className="text-sm text-muted mt-0.5">UGC creation only</div>
            </div>
            <div className="text-[32px] font-bold">
              $30<span className="text-sm text-muted font-normal">/mo</span>
            </div>
            <ul className="flex flex-col gap-2.5 text-sm text-ink/85">
              <li>Auto-matched creators</li>
              <li>Auto-verified posts</li>
              <li>Outcome dashboard</li>
              <li>Your budget, your volume</li>
            </ul>
            <Button href="/signup" variant="secondary" className="text-center">
              Choose Starter
            </Button>
          </div>
          <div className="p-[2px] rounded-3xl bg-gradient-social">
            <div className="p-9 rounded-3xl bg-surface h-full flex flex-col gap-5.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[15px] font-semibold">Pro</div>
                  <div className="text-sm text-muted mt-0.5">
                    UGC + verified engagement
                  </div>
                </div>
                <div className="text-[11px] font-bold text-white bg-gradient-social px-2.5 py-1 rounded-full">
                  POPULAR
                </div>
              </div>
              <div className="text-[32px] font-bold">
                $100<span className="text-sm text-muted font-normal">/mo</span>
              </div>
              <ul className="flex flex-col gap-2.5 text-sm text-ink/85">
                <li>Everything in Starter</li>
                <li>Comment collabs on new &amp; existing posts</li>
                <li>Speed-tiered payouts</li>
                <li>Priority creator matching</li>
              </ul>
              <Button href="/signup" className="text-center">
                Choose Pro
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-8 lg:px-18 py-6.5 border-t border-border-light">
        <div className="text-sm text-muted">&copy; SwayFam</div>
        <div className="flex gap-6">
          <a href="#" className="text-sm text-muted">
            Privacy
          </a>
          <a href="#" className="text-sm text-muted">
            Terms
          </a>
          <a href="#" className="text-sm text-muted">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
