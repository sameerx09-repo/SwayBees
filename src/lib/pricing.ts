// Mirrors WIP.md "Plans" pricing table. Single source of truth for both
// the signup form's live estimate and the server-side campaign creation.
export const UGC_COST = 40;
export const BLENDED_COMMENT_COST = 1.5;
export const PRO_UGC_ALLOCATION = 0.6;
export const PRO_ENGAGEMENT_ALLOCATION = 0.4;

// Base cost for a reach-oriented task (e.g. SHARE) — matches the
// existing default in AdhocCollabForm's per-type payout presets, now
// centralized here so GET /api/v1/tasks/preview shares one number with
// the rest of the app instead of a second hardcoded copy.
export const REACH_COST = 1;

// GET /api/v1/tasks/preview: a creator's actual engagementRate buckets
// into one of these tiers, and the tier scales the base cost-per-task —
// higher-engagement creators command a higher rate, mirroring how real
// influencer pricing works. Thresholds are set from this app's real
// seeded data (median ER ~2.8, p75 ~6.1), not arbitrary round numbers.
export const ENGAGEMENT_TIER_RANGE: Record<"low" | "medium" | "high", { gte: number; lt?: number }> = {
  low: { gte: 0, lt: 2 },
  medium: { gte: 2, lt: 5 },
  high: { gte: 5 },
};
export const ENGAGEMENT_TIER_MULTIPLIER: Record<"low" | "medium" | "high", number> = {
  low: 0.8,
  medium: 1.0,
  high: 1.5,
};
