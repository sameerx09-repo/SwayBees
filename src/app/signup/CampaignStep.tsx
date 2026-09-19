"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/Button";
import { StepIndicator } from "./StepIndicator";
import { createCampaign, type FormState } from "./actions";
import { UGC_COST, BLENDED_COMMENT_COST, PRO_UGC_ALLOCATION, PRO_ENGAGEMENT_ALLOCATION } from "@/lib/pricing";
import { NICHES } from "@/lib/niches";

const PLATFORMS = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TWITTER", label: "Twitter / X" },
  { value: "REDDIT", label: "Reddit" },
] as const;
const initialState: FormState = {};

export function CampaignStep({ companyName }: { companyName: string }) {
  const [state, formAction, isPending] = useActionState(createCampaign, initialState);

  const [plan, setPlan] = useState<"starter" | "pro">("pro");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["value"]>("INSTAGRAM");
  const [budget, setBudget] = useState(1000);
  const [gender, setGender] = useState<"any" | "women" | "men">("women");
  const [ageMin, setAgeMin] = useState(30);
  const [ageMax, setAgeMax] = useState(45);
  const [location, setLocation] = useState("New York, LA, Chicago");
  const [niche, setNiche] = useState<(typeof NICHES)[number]>("Beauty");

  const estimate = useMemo(() => {
    const ugcBudget = plan === "pro" ? budget * PRO_UGC_ALLOCATION : budget;
    const engagementBudget = plan === "pro" ? budget * PRO_ENGAGEMENT_ALLOCATION : 0;
    const videos = Math.floor(ugcBudget / UGC_COST);
    const comments = Math.floor(engagementBudget / BLENDED_COMMENT_COST);
    return { videos, comments };
  }, [plan, budget]);

  return (
    <div className="flex flex-col items-center px-4 w-full">
      <StepIndicator step={2} />

      <div className="w-full max-w-[600px] bg-surface border border-border p-6 sm:p-11 flex flex-col gap-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Set up your campaign, {companyName}
          </h1>
          <p className="text-sm text-muted mt-1.5">
            This decides what SwayBees creates and who it&rsquo;s matched to.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-8">
          <input type="hidden" name="plan" value={plan} />
          <input type="hidden" name="platform" value={platform} />
          <input type="hidden" name="gender" value={gender} />
          <input type="hidden" name="niche" value={niche} />

          <div className="flex flex-col gap-3">
            <div className="text-xs text-muted">Plan</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-border">
              <button
                type="button"
                onClick={() => setPlan("starter")}
                className={`p-4 flex flex-col gap-0.5 text-left border-b sm:border-b-0 sm:border-r border-border ${
                  plan === "starter" ? "bg-accent-soft" : ""
                }`}
              >
                <div className="text-sm font-semibold">Starter</div>
                <div className="text-xs text-muted">UGC only &middot; $30/mo</div>
              </button>
              <button
                type="button"
                onClick={() => setPlan("pro")}
                className={`p-4 flex flex-col gap-0.5 text-left relative ${
                  plan === "pro" ? "bg-accent-soft" : ""
                }`}
              >
                {plan === "pro" && (
                  <div className="absolute top-4 right-4 h-1.5 w-1.5 rounded-full bg-accent" />
                )}
                <div className="text-sm font-semibold">Pro</div>
                <div className="text-xs text-muted">UGC + engagement &middot; $100/mo</div>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="text-xs text-muted">Platform</div>
            <div className="flex border border-border w-fit">
              {PLATFORMS.map((p) => (
                <button
                  type="button"
                  key={p.value}
                  onClick={() => setPlatform(p.value)}
                  className={`text-sm px-4 py-2 ${
                    platform === p.value ? "bg-ink text-paper font-semibold" : "text-muted"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">
              {platform === "INSTAGRAM" &&
                "UGC videos and comments, verified through Instagram's API."}
              {platform === "TWITTER" &&
                "Tweets and replies. No automated verification yet — see BUILD_STATUS.md."}
              {platform === "REDDIT" &&
                "Reddit posts and comments. No automated verification yet — see BUILD_STATUS.md."}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="text-xs text-muted">Monthly budget</div>
            <div className="flex items-baseline gap-1 border-b border-ink pb-2 w-fit">
              <div className="font-mono text-[13px] text-muted">$</div>
              <input
                type="number"
                name="budget"
                min={UGC_COST}
                step={10}
                value={budget}
                onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                className="font-mono text-[22px] font-medium w-28 bg-transparent outline-none"
              />
            </div>
            <div className="text-xs text-muted">
              &asymp; {estimate.videos} UGC videos
              {plan === "pro" && <> + ~{estimate.comments} comments</>} this month at
              current rates. Separate from your ${plan === "pro" ? "100" : "30"}/mo
              subscription.
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="text-xs text-muted">Target audience</div>

            <div className="flex flex-col gap-1.5">
              <div className="text-[11px] text-faint">Gender</div>
              <div className="flex border border-border w-fit">
                {(["any", "women", "men"] as const).map((g) => (
                  <button
                    type="button"
                    key={g}
                    onClick={() => setGender(g)}
                    className={`text-sm px-4 py-2 capitalize ${
                      gender === g ? "bg-ink text-paper font-semibold" : "text-muted"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-1.5">
                <div className="text-[11px] text-faint">Age range</div>
                <div className="flex items-baseline gap-2">
                  <input
                    type="number"
                    name="ageMin"
                    value={ageMin}
                    onChange={(e) => setAgeMin(Number(e.target.value))}
                    className="font-mono text-[15px] border-b border-border pb-1 w-12 bg-transparent outline-none"
                  />
                  <span className="text-faint">&ndash;</span>
                  <input
                    type="number"
                    name="ageMax"
                    value={ageMax}
                    onChange={(e) => setAgeMax(Number(e.target.value))}
                    className="font-mono text-[15px] border-b border-border pb-1 w-12 bg-transparent outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="text-[11px] text-faint">Location</div>
                <input
                  type="text"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="text-sm border-b border-border pb-1.5 bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="text-[11px] text-faint">Niche</div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {NICHES.map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setNiche(n)}
                    className={`text-sm pb-1 border-b-[1.5px] ${
                      niche === n
                        ? "font-semibold border-accent"
                        : "text-muted border-transparent"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {state.error && <p className="text-xs text-red-600">{state.error}</p>}

          <div className="flex items-center justify-end pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : "Start my plan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
