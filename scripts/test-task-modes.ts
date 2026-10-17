import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { generateApiKey } from "../src/lib/api-keys";
import { parseTaskMode } from "../src/lib/task-mode";
loadEnvConfig(process.cwd());
const db = new PrismaClient();
const baseUrl = "http://localhost:5100";
async function tokenFor(kind: string, id: string) {
  return new SignJWT({ kind, id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("5m").sign(new TextEncoder().encode(process.env.SESSION_SECRET));
}
async function main() {
  const tag = randomUUID();
  let creatorId: string | undefined, brandId: string | undefined, nicheId: string | undefined, keyId: string | undefined;
  try {
    assert.equal(parseTaskMode(undefined), "LIVE");
    assert.equal(parseTaskMode("test"), "TEST");
    assert.equal(parseTaskMode("live"), "LIVE");
    for (const invalid of [null, true, 1, {}, "TEST", "sandbox", ""]) assert.equal(parseTaskMode(invalid), null);
    const niche = await db.niche.create({ data: { name: `Mode test ${tag}` } }); nicheId = niche.id;
    const creator = await db.influencer.create({ data: { email: `mode-${tag}@example.invalid`, handle: `mode-${tag}`, passwordHash: "fixture-no-login", gender: "women", age: 25, location: `ModeCity-${tag}`, followerCount: 4000, engagementRate: 3, niches: { create: { nicheId } } } }); creatorId = creator.id;
    const brand = await db.brand.create({ data: { email: `mode-brand-${tag}@example.invalid`, companyName: `Mode test ${tag}`, passwordHash: "fixture-no-login", category: "Testing", subscription: { create: { plan: "STARTER", monthlyBudget: 100, nextBillingAt: new Date() } }, criteria: { create: { gender: "any", ageMin: 18, ageMax: 45, location: `ModeCity-${tag}`, niche: niche.name } } } }); brandId = brand.id;
    const key = generateApiKey();
    const savedKey = await db.apiKey.create({ data: { name: `Mode test ${tag}`, keyHash: key.keyHash, keyPrefix: key.keyPrefix } }); keyId = savedKey.id;
    const headers = { Authorization: `Bearer ${key.raw}`, "X-Client-Name": "Admin", "Content-Type": "application/json" };
    const body = { brandId, type: "COMMENT", platform: "INSTAGRAM", payoutAmount: 30, maxBudget: 30, targetPostUrl: "https://www.instagram.com/p/mode-test-fixture/", criteria: { gender: "any", ageMin: 18, ageMax: 45, location: `ModeCity-${tag}`, niche: niche.name } };
    const descriptions = { test: `TEST-ONLY-${tag}`, live: `LIVE-ONLY-${tag}`, default: `DEFAULT-LIVE-${tag}` };
    for (const mode of ["test", "live", undefined]) {
      const response: Response = await fetch(`${baseUrl}/api/v1/tasks`, { method: "POST", headers: { ...headers, Cookie: "swaybees_mode=test" }, body: JSON.stringify({ ...body, ...(mode ? { mode } : {}), description: mode ? descriptions[mode as "test" | "live"] : descriptions.default }) });
      const payload = await response.json();
      assert.equal(response.status, 201, JSON.stringify(payload));
      assert.equal(payload.mode, mode ?? "live");
      assert.equal(payload.invitationsCreated, 1);
      assert.equal(payload.creators[0].id, creatorId, "Fixtures must never dispatch to a real creator.");
    }
    for (const mode of ["test", "live", undefined]) {
      const response: Response = await fetch(`${baseUrl}/api/v1/tasks?brandId=${brandId}${mode ? `&mode=${mode}` : ""}`, { headers });
      const payload = await response.json();
      assert.equal(response.status, 200);
      assert.equal(payload.mode, mode ?? "live");
      assert.equal(payload.tasks.length, mode === "test" ? 1 : 2);
      assert.ok(payload.tasks.every((task: { mode: string }) => task.mode === (mode ?? "live")));
    }
    for (const mode of ["test", "live"]) {
      const preview = await fetch(`${baseUrl}/api/v1/tasks/preview?mode=${mode}&amount=100&engagementRate=medium&type=Engagement`, { headers });
      assert.equal(preview.status, 200); assert.equal((await preview.json()).mode, mode);
    }
    assert.equal((await fetch(`${baseUrl}/api/v1/tasks?mode=invalid`, { headers })).status, 400);
    assert.equal((await fetch(`${baseUrl}/api/v1/tasks?limit=101`, { headers })).status, 400);
    assert.equal((await fetch(`${baseUrl}/api/v1/tasks`, { method: "POST", headers, body: JSON.stringify({ ...body, mode: false }) })).status, 400);
    assert.equal((await fetch(`${baseUrl}/api/v1/tasks?mode=test`)).status, 401);
    const pageCases = [
      { kind: "influencer", id: creatorId, routes: ["/collabs"] },
      { kind: "brand", id: brandId, routes: ["/settings/collabs"] },
    ];
    const admin = await db.admin.findFirst({ select: { id: true } });
    if (admin) pageCases.push({ kind: "admin", id: admin.id, routes: ["/admin/tasks", "/admin/insights", "/admin/export/verification"] });
    for (const { kind, id, routes } of pageCases) {
      const token = await tokenFor(kind, id!);
      for (const mode of ["test", "live"]) for (const route of routes) {
        const response: Response = await fetch(baseUrl + route, { headers: { Cookie: `cc_session=${token}; swaybees_mode=${mode}` } });
        const text = await response.text(); assert.equal(response.status, 200, route);
        if (route !== "/admin/insights") {
          assert.ok(text.includes(descriptions[mode as "test" | "live"]), `${route}: selected-mode task missing`);
          assert.ok(!text.includes(descriptions[mode === "test" ? "live" : "test"]), `${route}: other-mode task leaked`);
        }
      }
    }
    if (admin) {
      const token = await tokenFor("admin", admin.id);
      assert.equal((await fetch(`${baseUrl}/admin/export/payouts`, { headers: { Cookie: `cc_session=${token}; swaybees_mode=test` } })).status, 403);
    }
    if (process.env.TRENDCRAFT_INTEGRATION_KEY) {
      for (const mode of ["test", "live", undefined]) {
        const response: Response = await fetch(`${baseUrl}/api/external/engagement/preview`, { method: "POST", headers: { "x-api-key": process.env.TRENDCRAFT_INTEGRATION_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ budget: 1000, scope: "low", goals: ["engagement"], ...(mode ? { mode } : {}) }) });
        assert.equal(response.status, 200); assert.equal((await response.json()).mode, mode ?? "live");
      }
      const response: Response = await fetch(`${baseUrl}/api/external/engagement/tasks`, { method: "POST", headers: { "x-api-key": process.env.TRENDCRAFT_INTEGRATION_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ mode: "invalid" }) });
      assert.equal(response.status, 400);
    } else { console.log("SKIP: legacy integration HTTP checks (integration key not configured)."); }
    console.log("PASS: API creation/listing/previews, backwards-compatible default, invalid modes, authentication, creator/brand/admin/export isolation, and blocked test payouts.");
  } finally {
    if (brandId) {
      await db.walletLedgerEntry.deleteMany({ where: { invitation: { task: { brandId } } } });
      await db.taskInvitation.deleteMany({ where: { task: { brandId } } });
      await db.task.deleteMany({ where: { brandId } });
      await db.audienceCriteria.deleteMany({ where: { brandId } });
      await db.subscription.deleteMany({ where: { brandId } });
      await db.brand.delete({ where: { id: brandId } });
    }
    if (creatorId) { await db.influencerNiche.deleteMany({ where: { influencerId: creatorId } }); await db.influencer.delete({ where: { id: creatorId } }); }
    if (nicheId) await db.niche.delete({ where: { id: nicheId } });
    if (keyId) await db.apiKey.delete({ where: { id: keyId } });
    await db.$disconnect();
    console.log("Temporary mode-test records removed.");
  }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
