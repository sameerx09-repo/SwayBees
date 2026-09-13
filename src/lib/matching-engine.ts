// Task auto-generation & matching engine — see WIP.md "Task
// auto-generation & matching engine" and "Plans". This is the batch-job
// stand-in WIP.md explicitly allows for MVP ("doesn't need to be
// real-time — a scheduled cron job is a reasonable substitute"); no
// scheduler is wired up, so it's triggered manually from the brand
// dashboard rather than running on a timer.

import { db } from "@/lib/db";
import { TaskType, Platform, type Influencer } from "@prisma/client";
import {
  UGC_COST,
  BLENDED_COMMENT_COST,
  PRO_UGC_ALLOCATION,
  PRO_ENGAGEMENT_ALLOCATION,
} from "@/lib/pricing";
import { scrapeRecentPosts, profileUrlForHandle } from "@/lib/apify";

const RECENCY_PENALTY_DAYS = 7;
const RECENCY_PENALTY_SCORE = 5;

type Candidate = Influencer & { lastTaskedAt: Date | null };

function withinAgeRange(age: number | null, min: number, max: number): boolean {
  return age !== null && age >= min && age <= max;
}

function locationMatches(influencerLocation: string | null, criteriaLocation: string): boolean {
  if (!influencerLocation) return false;
  const wanted = criteriaLocation.split(",").map((s) => s.trim().toLowerCase());
  return wanted.some((city) => influencerLocation.toLowerCase().includes(city));
}

type CriteriaInput = {
  gender: string;
  ageMin: number;
  ageMax: number;
  location: string;
  niche: string;
  platform: Platform;
};

/** Persona gate — hard-filters the influencer pool against the brand's audience criteria. */
async function findEligibleInfluencers(criteria: CriteriaInput): Promise<Candidate[]> {
  const all = await db.influencer.findMany({
    include: {
      invitations: { orderBy: { createdAt: "desc" }, take: 1 },
      niches: { include: { niche: true } },
      socialAccounts: true,
    },
  });

  return all
    .filter((inf) => {
      if (criteria.gender !== "any" && inf.gender !== criteria.gender) return false;
      if (!withinAgeRange(inf.age, criteria.ageMin, criteria.ageMax)) return false;
      if (!locationMatches(inf.location, criteria.location)) return false;
      if (!inf.niches.some((n) => n.niche.name === criteria.niche)) return false;
      // Instagram has no separate presence check (matches prior behavior —
      // connection status is a verification-time concern, not eligibility).
      // Twitter/Reddit have no OAuth, so having declared a handle for that
      // platform IS the eligibility signal.
      if (
        criteria.platform !== Platform.INSTAGRAM &&
        !inf.socialAccounts.some((s) => s.platform === criteria.platform)
      ) {
        return false;
      }
      return true;
    })
    .map((inf) => ({
      ...inf,
      lastTaskedAt: inf.invitations[0]?.createdAt ?? null,
    }));
}

/** ER-weighted score with a rotation-fairness penalty for recently-tasked creators. */
function scoreCandidate(c: Candidate): number {
  const daysSinceLastTask = c.lastTaskedAt
    ? (Date.now() - c.lastTaskedAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;
  const penalty = daysSinceLastTask < RECENCY_PENALTY_DAYS ? RECENCY_PENALTY_SCORE : 0;
  return c.engagementRate - penalty;
}

type FollowerTier = "nano" | "micro" | "mid" | "macro" | "mega";

function tierOf(followerCount: number): FollowerTier {
  if (followerCount < 10_000) return "nano";
  if (followerCount < 50_000) return "micro";
  if (followerCount < 500_000) return "mid";
  if (followerCount < 1_000_000) return "macro";
  return "mega";
}

/**
 * Selects up to `count` candidates, ranked by score within each follower
 * tier, then round-robined across tiers — spreads picks across the
 * follower-size range rather than concentrating on whoever scores highest
 * overall (see WIP.md "diversify follower tiers in proportion to
 * available budget").
 */
function selectDiversified(candidates: Candidate[], count: number): Candidate[] {
  const byTier = new Map<FollowerTier, Candidate[]>();
  for (const c of candidates) {
    const tier = tierOf(c.followerCount);
    const list = byTier.get(tier) ?? [];
    list.push(c);
    byTier.set(tier, list);
  }
  for (const list of byTier.values()) {
    list.sort((a, b) => scoreCandidate(b) - scoreCandidate(a));
  }

  const tiers = Array.from(byTier.values());
  const selected: Candidate[] = [];
  let i = 0;
  while (selected.length < count && tiers.some((t) => t.length > i)) {
    for (const tier of tiers) {
      if (tier[i]) selected.push(tier[i]);
      if (selected.length >= count) break;
    }
    i++;
  }
  return selected;
}

function brandTag(companyName: string): string {
  return `@${companyName.toLowerCase().replace(/\s+/g, "")}`;
}

/**
 * Resolves the real public post comment tasks get verified against, by
 * scraping the brand's own public Instagram profile (see lib/apify.ts —
 * no OAuth needed). Returns null if the brand hasn't self-declared an
 * Instagram handle yet, or if the scrape fails (e.g. private/invalid
 * handle) — tasks still get created either way, just without a checkable
 * target, and verification reports that plainly rather than guessing.
 */
async function resolveCommentTargetUrl(instagramHandle: string | null): Promise<string | null> {
  if (!instagramHandle) return null;
  try {
    const posts = await scrapeRecentPosts(profileUrlForHandle(instagramHandle), 1);
    return posts[0]?.url ?? null;
  } catch {
    return null;
  }
}

/** Platform-appropriate copy for the two task types. Instagram tasks
 * still carry a verificationTag (see lib/verification.ts); Twitter/Reddit
 * have no automated verification yet, so they don't. */
function ugcTaskCopy(platform: Platform, companyName: string) {
  const tag = brandTag(companyName);
  switch (platform) {
    case Platform.TWITTER:
      return { description: `Post a tweet about ${companyName}. Tag ${tag}.`, verificationTag: null };
    case Platform.REDDIT:
      return {
        description: `Create a Reddit post about ${companyName} in a relevant subreddit. Mention ${companyName} naturally.`,
        verificationTag: null,
      };
    default:
      return {
        description: `Create a UGC video for ${companyName}. Tag ${tag} in your caption.`,
        verificationTag: tag,
      };
  }
}

function commentTaskCopy(platform: Platform, companyName: string, hasNewContent: boolean) {
  const target = hasNewContent ? "the newest post" : `${companyName}'s latest post`;
  switch (platform) {
    case Platform.TWITTER:
      return `Reply to ${target} for ${companyName}. Faster replies pay more — up to $2 within 30 minutes.`;
    case Platform.REDDIT:
      return `Comment on ${target} for ${companyName}. Faster replies pay more — up to $2 within 30 minutes.`;
    default:
      return `Comment on ${target} for ${companyName}. Faster replies pay more — up to $2 within 30 minutes.`;
  }
}

export type GenerateTasksResult = {
  ugcTasksCreated: number;
  commentTasksCreated: number;
  eligiblePoolSize: number;
};

export async function generateTasksForBrand(brandId: string): Promise<GenerateTasksResult> {
  const brand = await db.brand.findUniqueOrThrow({
    where: { id: brandId },
    include: { subscription: true, criteria: true },
  });
  if (!brand.subscription || !brand.criteria) {
    throw new Error("Brand has no active subscription/criteria — finish signup first.");
  }

  const { plan, monthlyBudget } = brand.subscription;
  const { platform } = brand.criteria;
  const ugcBudget = plan === "PRO" ? monthlyBudget * PRO_UGC_ALLOCATION : monthlyBudget;
  const engagementBudget = plan === "PRO" ? monthlyBudget * PRO_ENGAGEMENT_ALLOCATION : 0;
  const ugcTaskCount = Math.floor(ugcBudget / UGC_COST);
  const commentTaskCount = Math.floor(engagementBudget / BLENDED_COMMENT_COST);

  const eligible = await findEligibleInfluencers(brand.criteria);

  const ugcRecipients = selectDiversified(eligible, ugcTaskCount);
  let ugcTasksCreated = 0;
  let hasNewContent = false;

  for (const influencer of ugcRecipients) {
    const { description, verificationTag } = ugcTaskCopy(platform, brand.companyName);
    const task = await db.task.create({
      data: {
        brandId,
        type: TaskType.UGC_VIDEO,
        platform,
        description,
        payoutAmount: UGC_COST,
        verificationTag,
      },
    });
    await db.taskInvitation.create({
      data: { taskId: task.id, influencerId: influencer.id },
    });
    hasNewContent = true;
    ugcTasksCreated++;
  }

  // Pro-plan engagement allocation (Option C — WIP.md "Plans"): seed
  // comments on the freshest UGC created this run when there is one;
  // otherwise fall back to boosting the brand's existing presence.
  // Recipients are drawn from the same eligible pool but exclude
  // whoever already got a UGC task this run, so it's a distinct pool
  // where the pool is large enough to support that.
  const commentPool = eligible.filter((c) => !ugcRecipients.some((u) => u.id === c.id));
  const commentRecipients = selectDiversified(
    commentPool.length > 0 ? commentPool : eligible,
    commentTaskCount
  );

  // Resolved once per run, not per recipient — every comment task this
  // cycle targets the same real post (only Instagram is checkable;
  // Twitter/Reddit have no verification path yet, see BUILD_STATUS.md).
  const targetPostUrl =
    platform === Platform.INSTAGRAM && commentRecipients.length > 0
      ? await resolveCommentTargetUrl(brand.instagramHandle)
      : null;

  let commentTasksCreated = 0;
  for (const influencer of commentRecipients) {
    const task = await db.task.create({
      data: {
        brandId,
        type: TaskType.COMMENT,
        platform,
        description: commentTaskCopy(platform, brand.companyName, hasNewContent),
        payoutAmount: 2, // ceiling of the speed-tiered rate; actual payout set at verification
        targetPostUrl,
      },
    });
    await db.taskInvitation.create({
      data: { taskId: task.id, influencerId: influencer.id },
    });
    commentTasksCreated++;
  }

  return { ugcTasksCreated, commentTasksCreated, eligiblePoolSize: eligible.length };
}
