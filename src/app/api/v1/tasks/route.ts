import { parseTaskMode, modeName } from "@/lib/task-mode";
import { db } from "@/lib/db";
import { authenticateExternalRequest } from "@/lib/api-request-auth";
import { findEligibleInfluencers, selectDiversified } from "@/lib/matching-engine";
import { Platform, TaskType } from "@prisma/client";

const VALID_PLATFORMS = new Set(Object.values(Platform));
const VALID_TYPES = new Set(Object.values(TaskType));
const VALID_GENDERS = new Set(["any", "women", "men"]);

function badRequest(message: string) {
  return Response.json({ error: message }, { status: 400 });
}

/**
 * External integration endpoint — lets a partner system (e.g. a UGC-
 * creation app that already made the content) dispatch an engagement
 * task against one of its brands' real posts, with creators chosen by
 * the same persona-gate + follower-tier-diversified selection the
 * brand-triggered matching engine uses (see lib/matching-engine.ts),
 * just driven by caller-supplied criteria instead of a stored
 * AudienceCriteria row. Auth is a per-integration API key (see
 * lib/api-auth.ts) rather than a session cookie, since the caller has
 * no browser session — see app/admin/(dashboard)/api-keys for issuing
 * and revoking keys. Callers must also send an X-Client-Name header
 * naming themselves from a fixed allowlist (see lib/api-request-auth)
 * — a second, independent check on top of the key, not a replacement
 * for it. See also GET /api/v1/tasks/preview for a dry-run of this.
 */
export async function POST(request: Request) {
  const auth = await authenticateExternalRequest(request);
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) return badRequest("Request body must be a JSON object.");
  const mode = parseTaskMode(body.mode);
  if (!mode) return badRequest('mode must be "test" or "live".');

  const brandId = typeof body.brandId === "string" ? body.brandId : undefined;
  const brandEmail = typeof body.brandEmail === "string" ? body.brandEmail : undefined;
  if (!brandId && !brandEmail) {
    return badRequest("Provide either brandId or brandEmail to identify the brand.");
  }

  const brand = await db.brand.findUnique({
    where: brandId ? { id: brandId } : { email: brandEmail! },
  });
  if (!brand) {
    return Response.json({ error: "No brand found for the given brandId/brandEmail." }, { status: 404 });
  }

  const typeRaw = body.type;
  if (typeof typeRaw !== "string" || !VALID_TYPES.has(typeRaw as TaskType)) {
    return badRequest(`type must be one of: ${Array.from(VALID_TYPES).join(", ")}`);
  }
  const type = typeRaw as TaskType;

  const platformRaw = body.platform;
  if (typeof platformRaw !== "string" || !VALID_PLATFORMS.has(platformRaw as Platform)) {
    return badRequest(`platform must be one of: ${Array.from(VALID_PLATFORMS).join(", ")}`);
  }
  const platform = platformRaw as Platform;

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description) {
    return badRequest("description is required.");
  }

  const payoutAmount = Number(body.payoutAmount);
  if (!Number.isFinite(payoutAmount) || payoutAmount <= 0) {
    return badRequest("payoutAmount must be a positive number.");
  }

  const maxBudget = Number(body.maxBudget);
  if (!Number.isFinite(maxBudget) || maxBudget <= 0) {
    return badRequest("maxBudget must be a positive number.");
  }
  const maxCreators = Math.floor(maxBudget / payoutAmount);
  if (maxCreators < 1) {
    return badRequest(
      `maxBudget ($${maxBudget}) can't afford even one creator at payoutAmount ($${payoutAmount}).`
    );
  }

  const targetPostUrl = typeof body.targetPostUrl === "string" ? body.targetPostUrl.trim() || null : null;
  const verificationTag = typeof body.verificationTag === "string" ? body.verificationTag.trim() || null : null;
  if (type !== TaskType.UGC_VIDEO && !targetPostUrl) {
    return badRequest("targetPostUrl is required for every type except UGC_VIDEO.");
  }

  const criteriaRaw = body.criteria;
  if (typeof criteriaRaw !== "object" || criteriaRaw === null) {
    return badRequest("criteria is required (gender, ageMin, ageMax, location, niche).");
  }
  const criteria = criteriaRaw as Record<string, unknown>;
  const gender = typeof criteria.gender === "string" ? criteria.gender : "any";
  if (!VALID_GENDERS.has(gender)) {
    return badRequest('criteria.gender must be "any", "women", or "men".');
  }
  const ageMin = Number(criteria.ageMin);
  const ageMax = Number(criteria.ageMax);
  if (!Number.isFinite(ageMin) || !Number.isFinite(ageMax) || ageMin > ageMax) {
    return badRequest("criteria.ageMin/ageMax must be numbers with ageMin <= ageMax.");
  }
  const location = typeof criteria.location === "string" ? criteria.location : "";
  if (!location) {
    return badRequest("criteria.location is required (comma-separated cities match any-of).");
  }
  const niche = typeof criteria.niche === "string" ? criteria.niche : "";
  if (!niche) {
    return badRequest("criteria.niche is required.");
  }

  const eligible = await findEligibleInfluencers({ gender, ageMin, ageMax, location, niche, platform }, mode);
  const recipients = selectDiversified(eligible, maxCreators);

  if (recipients.length === 0) {
    return Response.json(
      {
        error: "No creators match the given criteria — task was not created.",
        eligiblePoolSize: eligible.length,
      },
      { status: 422 }
    );
  }

  const task = await db.task.create({
    data: {
      brandId: brand.id,
      mode,
      type,
      platform,
      description,
      payoutAmount,
      targetPostUrl: type === TaskType.UGC_VIDEO ? null : targetPostUrl,
      verificationTag: type === TaskType.UGC_VIDEO ? verificationTag : null,
    },
  });

  await db.taskInvitation.createMany({
    data: recipients.map((r) => ({ taskId: task.id, influencerId: r.id })),
  });

  return Response.json(
    {
      taskId: task.id,
      mode: modeName(mode),
      invitationsCreated: recipients.length,
      eligiblePoolSize: eligible.length,
      creators: recipients.map((r) => ({
        id: r.id,
        handle: r.handle,
        followerCount: r.followerCount,
      })),
    },
    { status: 201 }
  );
}

/** Mode-filtered task listing for integrations; mode is explicit in every task. */
export async function GET(request: Request) {
  const auth = await authenticateExternalRequest(request);
  if (!auth.ok) return auth.response;
  const params = new URL(request.url).searchParams;
  const mode = parseTaskMode(params.get("mode") ?? undefined);
  if (!mode) return badRequest('mode must be "test" or "live".');
  const limit = Number(params.get("limit") ?? 25);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) return badRequest("limit must be an integer from 1 to 100.");
  const cursor = params.get("cursor");
  const tasks = await db.task.findMany({
    where: { mode, ...(params.get("brandId") ? { brandId: params.get("brandId")! } : {}) },
    select: {
      id: true, mode: true, brandId: true, type: true, platform: true, description: true,
      payoutAmount: true, targetPostUrl: true, verificationTag: true, createdAt: true,
      invitations: { select: { id: true, status: true, influencerId: true } },
    },
    relationLoadStrategy: "join",
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
  const more = tasks.length > limit;
  const page = tasks.slice(0, limit);
  return Response.json({ mode: modeName(mode), tasks: page.map(task => ({ ...task, mode: modeName(task.mode) })), nextCursor: more ? page.at(-1)!.id : null });
}
