// Pricing/allocation model for the trendCraft "Drive Engagement" integration
// — a separate rate card from lib/pricing.ts (which is USD, for SwayBees'
// own brand-subscription plans). This one is INR, for ad-hoc per-campaign
// budgets coming from an external brand tool (trendCraft) that has no
// SwayBees subscription/plan of its own.
//
// Rates are a real-world-grounded estimate, not a sourced rate card — no
// public per-action (like/comment) INR rate card exists for this kind of
// gig-style micro-task (confirmed via live web research, 2026-10-04: public
// data only covers full sponsored-post rates, e.g. nano-tier ₹2,000-8,000
// per POST, not per discrete action). Calibrated against two real anchors
// instead of invented outright:
//   1. SwayBees' own real $1.5 blended comment cost (lib/pricing.ts) —
//      ~₹125 at a rough $-to-₹ rate, in the same ballpark as COMMENT below.
//   2. The brand's own explicit instruction: ₹1000 budget, Engagement goal
//      (comment+like), should produce exactly 10 influencers — solved
//      backwards from that to LIKE=40/COMMENT=60 (sums to ₹100/influencer).
export const UGC_COST_INR = 3000; // flat, brand-specified — doesn't scale with scope

type EngagementType = "LIKE" | "COMMENT" | "SHARE";
const BASE_RATES_INR: Record<EngagementType, number> = {
  LIKE: 40,
  COMMENT: 60,
  SHARE: 50, // "reach" goal — maps to TaskType.SHARE (share to story/feed), not a FOLLOW type (doesn't exist in the schema)
};

export type Scope = "low" | "medium" | "high";

/** "High means target more followers" — scope sets the MINIMUM follower
 * count of influencers eligible for this campaign, reusing the real
 * tier bands matching-engine.ts already defines (tierOf), not a new
 * parallel system. Higher-reach influencers command a higher per-task
 * rate — this is also what makes "High" naturally infeasible on a small
 * budget (the brand's own "can't have High on ₹1000" point) without a
 * hardcoded wall: the real influencer count just comes out too low. */
export const SCOPE_CONFIG: Record<Scope, { minFollowers: number; rateMultiplier: number; label: string }> = {
  low: { minFollowers: 3_000, rateMultiplier: 1, label: "Low" },
  medium: { minFollowers: 5_000, rateMultiplier: 1.5, label: "Medium" },
  high: { minFollowers: 10_000, rateMultiplier: 2.5, label: "High" },
};

export type Goal = "reach" | "engagement" | "ugc";

/** One real influencer, per the brand's own instruction, gets ALL of the
 * task types implied by the selected goal(s) — not a split pool. "reach"
 * → one SHARE task; "engagement" → one COMMENT + one LIKE task; "ugc" →
 * one UGC_VIDEO task. Goals can combine (e.g. reach + engagement). */
function tasksPerInfluencerForGoals(goals: Goal[], scope: Scope): { type: EngagementType | "UGC_VIDEO"; rate: number }[] {
  const mult = SCOPE_CONFIG[scope].rateMultiplier;
  const tasks: { type: EngagementType | "UGC_VIDEO"; rate: number }[] = [];
  if (goals.includes("reach")) tasks.push({ type: "SHARE", rate: Math.round(BASE_RATES_INR.SHARE * mult) });
  if (goals.includes("engagement")) {
    tasks.push({ type: "COMMENT", rate: Math.round(BASE_RATES_INR.COMMENT * mult) });
    tasks.push({ type: "LIKE", rate: Math.round(BASE_RATES_INR.LIKE * mult) });
  }
  if (goals.includes("ugc")) tasks.push({ type: "UGC_VIDEO", rate: UGC_COST_INR }); // flat, not scope-scaled
  return tasks;
}

export interface EngagementPlanTaskGroup {
  type: "SHARE" | "COMMENT" | "LIKE" | "UGC_VIDEO";
  countTasks: number; // == influencerCount, one per influencer
  payoutPerTask: number;
  totalCost: number;
}

export interface EngagementPlan {
  scope: Scope;
  minFollowers: number;
  goals: Goal[];
  costPerInfluencer: number;
  influencerCount: number;
  taskGroups: EngagementPlanTaskGroup[];
  totalCost: number;
  remainingBudget: number;
  viable: boolean; // false if budget can't even cover 1 influencer, or influencerCount < MIN_VIABLE
}

const MIN_VIABLE_INFLUENCERS = 3;

/** Pure function — same math powers both the live preview (trendCraft
 * polls this shape on every input change) and the real task-creation
 * call, so the preview can never drift from what submission actually
 * does. */
export function computeEngagementPlan(budgetInr: number, scope: Scope, goals: Goal[]): EngagementPlan {
  const perInfluencerTasks = tasksPerInfluencerForGoals(goals, scope);
  const costPerInfluencer = perInfluencerTasks.reduce((sum, t) => sum + t.rate, 0);
  const influencerCount = costPerInfluencer > 0 ? Math.floor(budgetInr / costPerInfluencer) : 0;
  const totalCost = influencerCount * costPerInfluencer;

  const taskGroups: EngagementPlanTaskGroup[] = perInfluencerTasks.map((t) => ({
    type: t.type,
    countTasks: influencerCount,
    payoutPerTask: t.rate,
    totalCost: t.rate * influencerCount,
  }));

  return {
    scope,
    minFollowers: SCOPE_CONFIG[scope].minFollowers,
    goals,
    costPerInfluencer,
    influencerCount,
    taskGroups,
    totalCost,
    remainingBudget: budgetInr - totalCost,
    viable: influencerCount >= MIN_VIABLE_INFLUENCERS,
  };
}
