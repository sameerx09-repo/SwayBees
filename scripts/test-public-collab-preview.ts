import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { publicInstagramLabel, toPublicCollabPreview } from "../src/lib/public-collab-preview";
import { getPublicCollabPreviews } from "../src/lib/public-collabs";
import { PublicCollabCards } from "../src/components/PublicCollabCards";
loadEnvConfig(process.cwd());
const db = new PrismaClient();
const rollback = new Error("ROLLBACK_PREVIEW_TEST");
async function main() {
  assert.equal(publicInstagramLabel("https://www.instagram.com/reel/ABC_123/?utm_source=private-brand#secret"), "instagram.com/reel/ABC_123/");
  assert.equal(publicInstagramLabel("https://instagram.com/private.brand/"), "instagram.com/••••••");
  for (const input of [null, "javascript:alert(1)", "https://instagram.com.evil.invalid/p/abc/", "https://example.com/private-brand", "https://private-brand@instagram.com/p/abc/", "not-a-url"]) assert.equal(publicInstagramLabel(input), null);
  const privateTask = { type: "COMMENT" as const, targetPostUrl: "https://instagram.com/p/SAFE_CODE/?brand=PRIVATE_BRAND_SENTINEL", brand: { companyName: "PRIVATE_BRAND_SENTINEL" }, description: "PRIVATE_BRIEF_SENTINEL", payoutAmount: 98765.43, id: "PRIVATE_ID_SENTINEL" };
  const preview = toPublicCollabPreview(privateTask);
  const rendered = renderToStaticMarkup(createElement(PublicCollabCards, { previews: [preview] }));
  for (const secret of ["PRIVATE_BRAND_SENTINEL", "PRIVATE_BRIEF_SENTINEL", "98765.43", "PRIVATE_ID_SENTINEL"]) {
    assert.ok(!JSON.stringify(preview).includes(secret)); assert.ok(!rendered.includes(secret));
  }
  assert.ok(rendered.includes('href="/creator/signup"'));
  assert.ok(!/href="https?:\/\//.test(rendered));
  assert.ok(rendered.includes("instagram.com/p/SAFE_CODE/"));
  assert.ok(rendered.includes("Brand name hidden")); assert.ok(rendered.includes("Payout amount hidden"));
  try {
    await db.$transaction(async tx => {
      const tag = randomUUID().replaceAll("-", "");
      const creator = await tx.influencer.create({ data: { handle: `preview-${tag}`, email: `preview-${tag}@example.invalid`, passwordHash: "fixture-only" } });
      for (const [mode, status, shortcode] of [["LIVE", "PENDING", `LIVE_${tag}`], ["TEST", "PENDING", `TEST_${tag}`], ["LIVE", "SUBMITTED", `DONE_${tag}`]] as const) {
        await tx.task.create({ data: { type: "COMMENT", mode, platform: "INSTAGRAM", description: "PRIVATE_BRIEF_SENTINEL", payoutAmount: 98765.43, targetPostUrl: `https://www.instagram.com/p/${shortcode}/`, invitations: { create: { influencerId: creator.id, status } } } });
      }
      await tx.task.create({ data: { type: "LIKE", mode: "LIVE", description: "NO_INVITATION_SENTINEL", payoutAmount: 98765.43, targetPostUrl: `https://instagram.com/p/NO_INVITATION_${tag}/` } });
      await tx.task.create({ data: { type: "UGC_VIDEO", mode: "LIVE", description: "PRIVATE_UGC_BRIEF", payoutAmount: 98765.43, invitations: { create: { influencerId: creator.id, status: "PENDING" } } } });
      const previews = await getPublicCollabPreviews(tx);
      assert.ok(previews.length <= 6);
      assert.ok(previews.some(preview => preview.type === "UGC_VIDEO" && preview.instagramLabel === null));
      assert.ok(previews.some(p => p.instagramLabel?.includes(`LIVE_${tag}`)));
      assert.ok(!JSON.stringify(previews).includes(`TEST_${tag}`));
      assert.ok(!JSON.stringify(previews).includes(`DONE_${tag}`));
      assert.ok(!JSON.stringify(previews).includes(`NO_INVITATION_${tag}`));
      assert.ok(!JSON.stringify(previews).includes("PRIVATE_BRIEF_SENTINEL"));
      throw rollback;
    }, { timeout: 60000 });
  } catch (error) { if (error !== rollback) throw error; }
  finally { await db.$disconnect(); }
  console.log("PASS: private fields excluded, Instagram links sanitized and non-clickable, cards lead to signup, only pending Live collabs shown, test records rolled back.");
}
main().catch(async error => { console.error(error); await db.$disconnect(); process.exitCode = 1; });
