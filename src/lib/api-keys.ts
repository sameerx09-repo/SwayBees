import { randomBytes, createHash } from "crypto";

const KEY_PREFIX = "sk_live_";
const PREFIX_DISPLAY_LENGTH = 8;

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

/**
 * Generates a new raw API key plus what gets stored for it. The raw
 * value is only ever returned here, at creation time — callers must
 * show it to the admin immediately and never persist it themselves.
 */
export function generateApiKey(): { raw: string; keyHash: string; keyPrefix: string } {
  const raw = KEY_PREFIX + randomBytes(24).toString("hex");
  return {
    raw,
    keyHash: hashApiKey(raw),
    keyPrefix: raw.slice(0, KEY_PREFIX.length + PREFIX_DISPLAY_LENGTH),
  };
}
