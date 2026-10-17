import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync, unlinkSync, statSync } from "node:fs";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { consumeLoginAttempt, loginBuckets, trustedLoginIp, ACCOUNT_ATTEMPT_LIMIT, IP_ATTEMPT_LIMIT } from "../src/lib/login-rate-limit";
import { saveCredentialExport, generateAccountPassword } from "./lib/credential-vault";
loadEnvConfig(process.cwd());
const db = new PrismaClient();
const rollback = new Error("ROLLBACK_SECURITY_TEST");
let stage = "pure checks";
async function main() {
  const tag = randomUUID();
  const secret = randomUUID();
  const account = loginBuckets("admin", `${tag}@example.invalid`, null, secret);
  const headers = new Headers({ "x-forwarded-for": "198.51.100.1", "x-vercel-forwarded-for": "198.51.100.2" });
  assert.equal(trustedLoginIp(headers), null);
  assert.equal(trustedLoginIp(headers, { vercel: "1" }), "198.51.100.2");
  assert.equal(trustedLoginIp(headers, { trustedHeader: "x-forwarded-for" }), "198.51.100.1");
  assert.equal(trustedLoginIp(new Headers({ "x-real-ip": "198.51.100.1, 127.0.0.1" }), { trustedHeader: "x-real-ip" }), null);
  assert.equal(trustedLoginIp(new Headers({ "x-real-ip": "0:0:0:0:0:0:0:1" }), { trustedHeader: "x-real-ip" }), "::1");
  assert.equal(loginBuckets("admin", ` ${tag.toUpperCase()}@EXAMPLE.INVALID `, null, secret)[0].key, account[0].key);
  assert.notEqual(loginBuckets("brand", `${tag}@example.invalid`, null, secret)[0].key, account[0].key);
  assert.ok(!account[0].key.includes(tag));
  try {
    await db.$transaction(async tx => {
      for (let i = 0; i < ACCOUNT_ATTEMPT_LIMIT; i++) assert.equal((await consumeLoginAttempt(tx, account)).allowed, true);
      const blocked = await consumeLoginAttempt(tx, account);
      assert.equal(blocked.allowed, false);
      assert.ok(blocked.retryAfterSeconds > 0 && blocked.retryAfterSeconds <= 900);
      await tx.$executeRaw`UPDATE "LoginRateLimit" SET "expiresAt" = NOW() - INTERVAL '1 second' WHERE "key" = ${account[0].key}`;
      assert.equal((await consumeLoginAttempt(tx, account)).allowed, true);
      const ipBucket = loginBuckets("admin", `${tag}@example.invalid`, "198.51.100.9", secret)[1];
      await tx.$executeRaw`INSERT INTO "LoginRateLimit" ("key", "attempts", "expiresAt") VALUES (${ipBucket.key}, ${IP_ATTEMPT_LIMIT - 1}, NOW() + INTERVAL '15 minutes')`;
      assert.equal((await consumeLoginAttempt(tx, loginBuckets("brand", `last-${tag}@example.invalid`, "198.51.100.9", secret))).allowed, true);
      assert.equal((await consumeLoginAttempt(tx, loginBuckets("influencer", `new-${tag}@example.invalid`, "198.51.100.9", secret))).allowed, false);
      throw rollback;
    }, { timeout: 45000 });
  } catch (error) { if (error !== rollback) throw error; }
  // Independent clients contend for the same row; an in-memory limiter would fail this test.
  stage = "concurrent clients";
  const keys = loginBuckets("influencer", `concurrent-${tag}@example.invalid`, "198.51.100.7", secret);
  const other = new PrismaClient();
  try {
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => consumeLoginAttempt(i % 2 ? db : other, keys)));
    assert.equal(results.filter(r => r.allowed).length, ACCOUNT_ATTEMPT_LIMIT);
  } finally {
    await db.$executeRaw`DELETE FROM "LoginRateLimit" WHERE "key" IN (${keys[0].key}, ${keys[1].key})`;
    await other.$disconnect();
  }
  stage = "password randomness";
  const passwords = new Set(Array.from({ length: 1000 }, generateAccountPassword));
  assert.equal(passwords.size, 1000);
  assert.ok([...passwords].every(password => password.length === 43 && /^[A-Za-z0-9_-]+$/.test(password)));
  stage = "portable plaintext export";
  const fixture = [{ role: "admin" as const, email: "fixture@example.invalid", password: generateAccountPassword() }];
  const fixturePath = saveCredentialExport(fixture);
  try {
    const text = readFileSync(fixturePath, "utf8");
    const parsed = JSON.parse(text);
    assert.equal(parsed.format, "swaybees-passwords-v2");
    assert.deepEqual(parsed.credentials, fixture);
    assert.ok(!text.includes("passwordHash"));
    if (process.platform !== "win32") assert.equal(statSync(fixturePath).mode & 0o777, 0o600);
  } finally { unlinkSync(fixturePath); }
  console.log("PASS: account/IP limits, role separation, normalization, untrusted-header rejection, window expiry, atomic concurrency across clients, random password generation and portable plaintext credential export. Test counters removed; no account passwords changed.");
}
main().catch((error: unknown) => { console.error({ stage, location: error instanceof Error ? error.stack?.split("\n").filter(line => line.trim().startsWith("at ")).slice(0, 2) : undefined, errorType: error instanceof Error ? error.constructor.name : "unknown", code: (error as { code?: string }).code, message: "Login security checks failed; no credentials printed." }); process.exitCode = 1; }).finally(() => db.$disconnect());
