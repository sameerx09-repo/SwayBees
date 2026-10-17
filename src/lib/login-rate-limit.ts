import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { Prisma } from "@prisma/client";

export type LoginKind = "admin" | "brand" | "influencer";
export const LOGIN_WINDOW_SECONDS = 15 * 60;
export const ACCOUNT_ATTEMPT_LIMIT = 5;
export const IP_ATTEMPT_LIMIT = 30;

type HeaderReader = Pick<Headers, "get">;

/** Trust only the deployment's sanitized header, never arbitrary forwarded headers. */
export function trustedLoginIp(headers: HeaderReader, configuration: { vercel?: string; trustedHeader?: string } = {}): string | null {
  const header = configuration.trustedHeader || (configuration.vercel === "1" ? "x-vercel-forwarded-for" : undefined);
  if (!header || !/^[a-z0-9-]+$/i.test(header)) return null;
  const value = headers.get(header)?.trim();
  if (!value || value.includes(",") || !isIP(value)) return null;
  // URL canonicalization ensures equivalent IPv6 spellings share a bucket.
  return isIP(value) === 6 ? new URL(`http://[${value}]/`).hostname.slice(1, -1) : value;
}

export function loginBuckets(kind: LoginKind, email: string, ip: string | null, secret: string) {
  if (!secret) throw new Error("Login rate limiting requires the session signing secret.");
  const digest = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
  return [
    { key: digest(`login:account:${kind}:${email.trim().toLowerCase()}`), limit: ACCOUNT_ATTEMPT_LIMIT },
    ...(ip ? [{ key: digest(`login:ip:${ip}`), limit: IP_ATTEMPT_LIMIT }] : []),
  ];
}

/** Atomic database counters work across processes and serverless instances. */
export async function consumeLoginAttempt(
  client: Pick<Prisma.TransactionClient, "$queryRaw">,
  buckets: Array<{ key: string; limit: number }>,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  if (!buckets.length) throw new Error("At least one rate-limit bucket is required.");
  const keys = buckets.map(bucket => bucket.key);
  const values = buckets.map(bucket => Prisma.sql`(${bucket.key}, 1, NOW() + INTERVAL '15 minutes')`);
  const rows = await client.$queryRaw<Array<{ key: string; attempts: number; retryAfterSeconds: number }>>(Prisma.sql`
    WITH stale AS (
      SELECT "key" FROM "LoginRateLimit"
      WHERE "expiresAt" < NOW() - INTERVAL '1 day' AND "key" NOT IN (${Prisma.join(keys)})
      ORDER BY "expiresAt" LIMIT 100
    ), cleaned AS (
      DELETE FROM "LoginRateLimit" WHERE "key" IN (SELECT "key" FROM stale)
    ), counted AS (
      INSERT INTO "LoginRateLimit" ("key", "attempts", "expiresAt")
      VALUES ${Prisma.join(values)}
      ON CONFLICT ("key") DO UPDATE SET
        "attempts" = CASE WHEN "LoginRateLimit"."expiresAt" <= NOW() THEN 1 ELSE LEAST("LoginRateLimit"."attempts" + 1, 1000000) END,
        "expiresAt" = CASE WHEN "LoginRateLimit"."expiresAt" <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE "LoginRateLimit"."expiresAt" END
      RETURNING "key", "attempts", "expiresAt"
    )
    SELECT "key", "attempts", LEAST(900, GREATEST(1, CEIL(EXTRACT(EPOCH FROM ("expiresAt" - NOW())))))::int AS "retryAfterSeconds" FROM counted
  `);
  if (rows.length !== buckets.length) throw new Error("Login counter update was incomplete.");
  const blocked = rows.filter(row => row.attempts > buckets.find(bucket => bucket.key === row.key)!.limit);
  return { allowed: blocked.length === 0, retryAfterSeconds: Math.max(0, ...blocked.map(row => row.retryAfterSeconds)) };
}
