import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { SignJWT } from "jose";
import { writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
loadEnvConfig(process.cwd());
const db = new PrismaClient();
const baseUrl = process.argv[2] ?? "http://localhost:5100";
const outputPath = process.argv[3];
const sampleCount = Number(process.argv[4] ?? 4);
async function main() {
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(new URL(baseUrl).hostname), "Only benchmark a local server; session credentials must remain local.");
  assert.ok(Number.isInteger(sampleCount) && sampleCount >= 2 && sampleCount <= 20, "Use 2–20 samples per route.");
  const [creator, admin, brand, counts] = await Promise.all([
    db.influencer.findFirst({ where: { email: "mia@example.com" }, select: { id: true } }),
    db.admin.findFirst({ select: { id: true } }),
    db.brand.findFirst({ where: { subscription: { isNot: null } }, select: { id: true } }),
    Promise.all([db.influencer.count(), db.taskInvitation.count(), db.task.count()]),
  ]);
  const routes: Array<{ route: string; kind?: string; id?: string }> = [
    { route: "/" }, { route: "/creator/login" },
    ...["/collabs", "/collabs/history", "/collabs/profile"].map(route => ({ route, kind: "influencer", id: creator?.id })),
    ...["/settings", "/settings/collabs"].map(route => ({ route, kind: "brand", id: brand?.id })),
    ...["/admin", "/admin/tasks", "/admin/tasks?status=review", "/admin/insights"].map(route => ({ route, kind: "admin", id: admin?.id })),
  ];
  const results = [];
  for (const { route, kind, id } of routes) {
    if (kind && !id) continue;
    const token = kind ? await new SignJWT({ kind, id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("10m").sign(new TextEncoder().encode(process.env.SESSION_SECRET)) : undefined;
    const samples = [];
    for (let i = 0; i < sampleCount; i++) {
      const start = performance.now();
      const response = await fetch(baseUrl + route, { headers: token ? { Cookie: `cc_session=${token}` } : {}, redirect: "manual" });
      const ttfbMs = Math.round(performance.now() - start);
      const body = await response.text();
      const totalMs = Math.round(performance.now() - start);
      assert.equal(response.status, 200, route);
      assert.ok(!/"digest":"\d+"/.test(body), `Server error in stream: ${route}`);
      samples.push({ ttfbMs, totalMs, bytes: Buffer.byteLength(body) });
    }
    const warm = samples.slice(1).map(s => s.totalMs).sort((a, b) => a - b);
    const warmMedianMs = warm[Math.floor(warm.length / 2)];
    const result = { route, firstMs: samples[0].totalMs, warmMedianMs, maxMs: Math.max(...samples.map(s => s.totalMs)), bytes: samples.at(-1)!.bytes, samples };
    results.push(result);
    console.log(JSON.stringify({ route, firstMs: result.firstMs, warmMedianMs, bytes: result.bytes }));
  }
  const report = { capturedAt: new Date().toISOString(), baseUrl, sampleCount, data: { creators: counts[0], invitations: counts[1], tasks: counts[2] }, results };
  if (outputPath) await writeFile(outputPath, JSON.stringify(report, null, 2));
  await db.$disconnect();
}
main().catch(async err => { console.error(err); await db.$disconnect(); process.exitCode = 1; });
