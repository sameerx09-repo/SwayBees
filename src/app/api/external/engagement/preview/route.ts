import { parseTaskMode, modeName } from "@/lib/task-mode";
import { NextResponse } from "next/server";
import { checkIntegrationKey } from "@/lib/trendcraft-auth";
import { computeEngagementPlan, type Scope, type Goal } from "@/lib/trendcraft-pricing";

const VALID_SCOPES: Scope[] = ["low", "medium", "high"];
const VALID_GOALS: Goal[] = ["reach", "engagement", "ugc"];

/**
 * Pure preview — same computeEngagementPlan() the real task-creation route
 * uses, so what a brand sees before submitting always matches what
 * actually gets created. No DB writes.
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

  if (!Number.isFinite(budget) || budget <= 0) {
    return NextResponse.json({ error: "budget must be a positive number" }, { status: 400 });
  }
  if (!VALID_SCOPES.includes(scope)) {
    return NextResponse.json({ error: `scope must be one of ${VALID_SCOPES.join(", ")}` }, { status: 400 });
  }
  if (goals.length === 0 || !goals.every((g) => VALID_GOALS.includes(g))) {
    return NextResponse.json({ error: `goals must be a non-empty subset of ${VALID_GOALS.join(", ")}` }, { status: 400 });
  }

  const plan = computeEngagementPlan(budget, scope, goals);
  return NextResponse.json({ mode: modeName(mode), plan });
}
