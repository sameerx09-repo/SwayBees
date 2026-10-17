import { randomBytes, randomUUID } from "node:crypto";
import { mkdirSync, openSync, writeFileSync, fsyncSync, closeSync } from "node:fs";
import path from "node:path";

export type CredentialRecord = { role: "admin" | "brand" | "influencer"; email: string; password: string };

export function generateAccountPassword(): string {
  // 256 random bits; 43 ASCII characters fit within bcrypt's 72-byte limit.
  return randomBytes(32).toString("base64url");
}

/** Owner-requested plaintext handoff for their password vault; never a public asset. */
export function saveCredentialExport(credentials: CredentialRecord[], directory = path.resolve(".credentials")): string {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const filename = path.join(directory, `passwords-${Date.now()}-${randomUUID()}.json`);
  const descriptor = openSync(filename, "wx", 0o600);
  try {
    writeFileSync(descriptor, JSON.stringify({ format: "swaybees-passwords-v2", createdAt: new Date().toISOString(), credentials }, null, 2) + "\n", "utf8");
    // Finish saving the recovery file before any password update is committed.
    fsyncSync(descriptor);
  } finally { closeSync(descriptor); }
  return filename;
}
