import { db } from "@/lib/db";
import { hashApiKey } from "@/lib/api-keys";

/**
 * Authenticates an external request via `Authorization: Bearer <key>`.
 * Returns the ApiKey record on success (so callers can log/attribute by
 * `name`), or null for a missing, unknown, or revoked key — the route
 * handler is responsible for turning that into a 401.
 */
export async function requireApiKey(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return null;

  const key = await db.apiKey.findUnique({ where: { keyHash: hashApiKey(match[1]) } });
  if (!key || key.revokedAt) return null;

  await db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } });
  return key;
}
