import { parseTaskMode, modeName } from "@/lib/task-mode";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Platform, TaskType } from "@prisma/client";
import { checkIntegrationKey } from "@/lib/trendcraft-auth";
import { computeEngagementPlan, type Scope, type Goal } from "@/lib/trendcraft-pricing";
import { findEligibleInfluencers, selectDiversified } from "@/lib/matching-engine";

const VALID_SCOPES: Scope[] = ["low", "medium", "high"];
const VALID_GOALS: Goal[] = ["reach", "engagement", "ugc"];

/**
 * Real seed data is 100% US-based influencers (confirmed live, 2026-10-04
 * — zero India-based rows exist yet). A brand.criteria.location of actual
 * Indian cities would make findEligibleInfluencers return an empty pool
 * every time, so this integration targets the real city list that
 * actually exists until India-based influencers are added — matches real
 * rows instead of silently matching nobody. Revisit once real India
 * coverage exists.
 */
const AVAILABLE_LOCATIONS = [
  "Los Angeles", "Chicago", "New York", "Portland", "San Francisco", "Dallas",
  "Philadelphia", "Boston", "San Antonio", "Phoenix", "Austin", "Denver",
  "Miami", "Atlanta", "Charlotte", "Seattle", "Minneapolis", "Houston", "San Diego",
].join(", ");

/** trendCraft brand categories -> a real Niche.name row (confirmed live
 * list: Beauty, Wellness, Fitness, Fashion, Skincare, Makeup, Haircare,
 * Jewelry & Accessories, Clothing & Apparel, Footwear, Working Women,
 * Homemaking, Parenting, Food & Cooking, Home Decor, Travel). Falls back
 * to "Beauty" for anything unmapped rather than a niche string that
 * matches zero real rows. */
function resolveNiche(category: string | undefined): string {
  const map: Record<string, string> = {
    skincare: "Skincare",
    beauty: "Beauty",
    wellness: "Wellness",
    fitness: "Fitness",
    fashion: "Fashion",
    makeup: "Makeup",
    haircare: "Haircare",
  };
  const key = (category ?? "").toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v;
  }
  return "Beauty";
}

function brandTag(companyName: string): string {
  return `@${companyName.toLowerCase().replace(/\s+/g, "")}`;
}

function taskCopy(
  type: "SHARE" | "COMMENT" | "LIKE" | "UGC_VIDEO",
  companyName: string,
  reelUrl: string
): { description: string; verificationTag: string | null; targetPostUrl: string | null } {
  const tag = brandTag(companyName);
  switch (type) {
    case "UGC_VIDEO":
      return {
        description: `Create a UGC video inspired by ${companyName}'s reel. Tag ${tag} in your caption. Reference: ${reelUrl}`,
        verificationTag: tag,
        targetPostUrl: null,
      };
    case "COMMENT":
      return {
        description: `Comment on ${companyName}'s reel: ${reelUrl}`,
        verificationTag: null,
        targetPostUrl: reelUrl,
      };
    case "LIKE":
      return {
        description: `Like ${companyName}'s reel: ${reelUrl}`,
        verificationTag: null,
        targetPostUrl: reelUrl,
      };
    case "SHARE":
      return {
        description: `Share ${companyName}'s reel to your story: ${reelUrl}`,
        verificationTag: null,
        targetPostUrl: reelUrl,
      };
  }
}

/**
 * Creates a real engagement campaign from a trendCraft "Drive Engagement"
 * submission: upserts a lightweight Brand + AudienceCriteria (no real
 * brand signup/login flow exists for this path yet — see
 * trendcraft-auth.ts), runs the SAME real matching engine
 * (findEligibleInfluencers + selectDiversified) brand-dashboard campaigns
 * use, and creates one real Task + TaskInvitation per influencer per
 * selected goal's task type. Every invited influencer gets ALL of the
 * selected goals' task types (not a split pool) — e.g. Engagement goal
 * means every recipient gets both a COMMENT and a LIKE task.
 */
export async function POST(req: Request) {
  if (!checkIntegrationKey(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  const mode = parseTaskMode(body.mode);
  if (!mode) return NextResponse.json({ error: 'mode must be "test" or "live"' }, { status: 400 });
  const budget = Number(body.budget);
  const scope = body.scope as Scope;
  const goals = Array.isArray(body.goals) ? (body.goals as Goal[]) : [];
  const reelUrl = String(body.reelUrl ?? "").trim();
  const companyName = String(body.brand?.companyName ?? "").trim();
  const instagramHandle = body.brand?.instagramHandle ? String(body.brand.instagramHandle).trim() : null;
  const category = body.brand?.category ? String(body.brand.category) : undefined;

  if (!Number.isFinite(budget) || budget <= 0) {
    return NextResponse.json({ error: "budget must be a positive number" }, { status: 400 });
  }
  if (!VALID_SCOPES.includes(scope)) {
    return NextResponse.json({ error: `scope must be one of ${VALID_SCOPES.join(", ")}` }, { status: 400 });
  }
  if (goals.length === 0 || !goals.every((g) => VALID_GOALS.includes(g))) {
    return NextResponse.json({ error: `goals must be a non-empty subset of ${VALID_GOALS.join(", ")}` }, { status: 400 });
  }
  if (!reelUrl) {
    return NextResponse.json({ error: "reelUrl is required" }, { status: 400 });
  }
  if (!companyName) {
    return NextResponse.json({ error: "brand.companyName is required" }, { status: 400 });
  }

  const plan = computeEngagementPlan(budget, scope, goals);
  if (!plan.viable) {
    return NextResponse.json(
      { error: `This budget/scope only covers ${plan.influencerCount} influencer(s) — too few to run. Increase budget or lower scope.`, plan },
      { status: 400 }
    );
  }

  // Deterministic synthetic email — no real brand login exists for this
  // integration path yet, so companyName is the stable identity key.
  const syntheticEmail = `${companyName.toLowerCase().replace(/\s+/g, "-")}@trendcraft${mode === "TEST" ? ".test" : ""}.integration`;

  const brand = await db.brand.upsert({
    where: { email: syntheticEmail },
    update: { instagramHandle: instagramHandle ?? undefined },
    create: {
      companyName,
      email: syntheticEmail,
      passwordHash: "trendcraft-integration-no-login", // not a real login path — see trendcraft-auth.ts
      category: category ?? "Beauty",
      instagramHandle,
    },
  });

  const niche = resolveNiche(category);
  await db.audienceCriteria.upsert({
    where: { brandId: brand.id },
    update: { niche, platform: Platform.INSTAGRAM },
    create: {
      brandId: brand.id,
      gender: "any",
      ageMin: 18,
      ageMax: 65,
      location: AVAILABLE_LOCATIONS,
      niche,
      platform: Platform.INSTAGRAM,
    },
  });

  const criteria = { gender: "any", ageMin: 18, ageMax: 65, location: AVAILABLE_LOCATIONS, niche, platform: Platform.INSTAGRAM };
  const eligibleAll = await findEligibleInfluencers(criteria, mode);
  // CriteriaInput (matching-engine.ts) has no follower-count field — the
  // scope's minFollowers ("High means target more followers") isn't part
  // of the real persona-gate filter, so it has to be applied here.
  // Confirmed live this was a real gap: a Low-scope (min 3,000) run
  // actually invited an influencer with 1,092 followers before this fix.
  const eligible = eligibleAll.filter((inf) => inf.followerCount >= plan.minFollowers);
  const recipients = selectDiversified(eligible, plan.influencerCount);

  let tasksCreated = 0;
  const createdTaskIds: string[] = [];
  for (const influencer of recipients) {
    for (const group of plan.taskGroups) {
      const copy = taskCopy(group.type, companyName, reelUrl);
      const task = await db.task.create({
        data: {
          brandId: brand.id,
          mode,
          type: TaskType[group.type],
          platform: Platform.INSTAGRAM,
          description: copy.description,
          payoutAmount: group.payoutPerTask,
          verificationTag: copy.verificationTag,
          targetPostUrl: copy.targetPostUrl,
        },
      });
      await db.taskInvitation.create({ data: { taskId: task.id, influencerId: influencer.id } });
      createdTaskIds.push(task.id);
      tasksCreated++;
    }
  }

  return NextResponse.json({
    mode: modeName(mode),
    taskIds: createdTaskIds,
    brandId: brand.id,
    eligiblePoolSize: eligible.length,
    influencersEngaged: recipients.length,
    tasksCreated,
    plan,
  });
}
