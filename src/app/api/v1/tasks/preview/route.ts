import { parseTaskMode, modeName } from "@/lib/task-mode";
import { db } from "@/lib/db";
import { authenticateExternalRequest } from "@/lib/api-request-auth";
import {
  UGC_COST,
  BLENDED_COMMENT_COST,
  REACH_COST,
  ENGAGEMENT_TIER_RANGE,
  ENGAGEMENT_TIER_MULTIPLIER,
} from "@/lib/pricing";

type EngagementTier = keyof typeof ENGAGEMENT_TIER_RANGE;
type TypeKey = "UGC" | "Engagement" | "Reach";

// Fixed processing order, independent of how the caller lists `type` —
// keeps the cross-type exclusion below (see TYPE_ORDER loop) and
// therefore the whole response deterministic for the same inputs.
const TYPE_ORDER: TypeKey[] = ["UGC", "Engagement", "Reach"];
const TYPE_ALIASES: Record<string, TypeKey> = {
  ugc: "UGC",
  engagement: "Engagement",
  reach: "Reach",
};
const BASE_COST: Record<TypeKey, number> = {
  UGC: UGC_COST,
  Engagement: BLENDED_COMMENT_COST,
  Reach: REACH_COST,
};

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Dry-run for POST /api/v1/tasks — given a budget, a target engagement-
 * rate tier, and one or more task types, estimates how many tasks (and
 * therefore how many distinct influencers, one task each) that budget
 * actually buys against the real current creator pool. Creates nothing.
 *
 * When multiple types are requested, the budget is split evenly across
 * them, and each type's pool excludes influencers already claimed by an
 * earlier type in TYPE_ORDER — the same exclusion pattern
 * generateTasksForBrand uses between its UGC and comment recipients —
 * so `totals.projectedInfluencers` is a real distinct count, not a sum
 * that can double-count someone picked for two types at once.
 */
export async function GET(request: Request) {
  const auth = await authenticateExternalRequest(request);
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);

  const mode = parseTaskMode(url.searchParams.get("mode") ?? undefined);
  if (!mode) return badRequest('mode must be "test" or "live".');

  const amount = Number(url.searchParams.get("amount"));
  if (!Number.isFinite(amount) || amount <= 0) {
    return badRequest("amount must be a positive number.");
  }

  const tierRaw = (url.searchParams.get("engagementRate") ?? "").toLowerCase();
  if (!(tierRaw in ENGAGEMENT_TIER_RANGE)) {
    return badRequest('engagementRate must be "low", "medium", or "high".');
  }
  const tier = tierRaw as EngagementTier;

  // Accept either repeated `type=UGC&type=Reach` or `type=UGC,Reach`.
  const typeParams = url.searchParams.getAll("type").flatMap((v) => v.split(","));
  const requestedTypes = new Set<TypeKey>();
  for (const raw of typeParams) {
    const key = TYPE_ALIASES[raw.trim().toLowerCase()];
    if (!key) {
      return badRequest('Each type must be one of "UGC", "Engagement", or "Reach".');
    }
    requestedTypes.add(key);
  }
  if (requestedTypes.size === 0) {
    return badRequest('type is required — one or more of "UGC", "Engagement", "Reach" (comma-separated for multiple).');
  }

  const selectedTypes = TYPE_ORDER.filter((t) => requestedTypes.has(t));
  const budgetPerType = amount / selectedTypes.length;
  const { gte, lt } = ENGAGEMENT_TIER_RANGE[tier];
  const multiplier = ENGAGEMENT_TIER_MULTIPLIER[tier];

  const pool = await db.influencer.findMany({
    where: { engagementRate: { gte, ...(lt !== undefined ? { lt } : {}) } },
    select: { id: true },
  });

  const claimed = new Set<string>();
  const breakdown: Array<{
    type: TypeKey;
    costPerTask: number;
    eligiblePoolSize: number;
    maxTasksFromBudget: number;
    projectedTasks: number;
    projectedInfluencers: number;
    budgetUsed: number;
  }> = [];

  for (const type of selectedTypes) {
    const available = pool.filter((p) => !claimed.has(p.id));
    const costPerTask = round2(BASE_COST[type] * multiplier);
    const maxTasksFromBudget = Math.floor(budgetPerType / costPerTask);
    const projectedTasks = Math.min(maxTasksFromBudget, available.length);

    for (const influencer of available.slice(0, projectedTasks)) {
      claimed.add(influencer.id);
    }

    breakdown.push({
      type,
      costPerTask,
      eligiblePoolSize: available.length,
      maxTasksFromBudget,
      projectedTasks,
      projectedInfluencers: projectedTasks,
      budgetUsed: round2(projectedTasks * costPerTask),
    });
  }

  const budgetUsed = round2(breakdown.reduce((sum, b) => sum + b.budgetUsed, 0));

  return Response.json({
    mode: modeName(mode),
    amount,
    engagementRate: tier,
    types: selectedTypes,
    budgetPerType: round2(budgetPerType),
    breakdown,
    totals: {
      projectedTasks: claimed.size,
      projectedInfluencers: claimed.size,
      budgetUsed,
      budgetRemaining: round2(amount - budgetUsed),
    },
  });
}
