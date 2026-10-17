import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { consumeLoginAttempt, loginBuckets, trustedLoginIp, type LoginKind } from "@/lib/login-rate-limit";

// A fixed work factor keeps missing accounts on the same bcrypt path as real accounts.
const DUMMY_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
const INVALID_LOGIN = "That email/password combination doesn't match an account.";

export async function authenticatePasswordLogin(kind: LoginKind, formData: FormData): Promise<{ id: string } | { error: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  if (email.length > 320 || Buffer.byteLength(password) > 1024) return { error: INVALID_LOGIN };

  try {
    const ip = trustedLoginIp(await headers(), { vercel: process.env.VERCEL, trustedHeader: process.env.LOGIN_TRUSTED_IP_HEADER });
    const result = await consumeLoginAttempt(db, loginBuckets(kind, email, ip, process.env.SESSION_SECRET ?? ""));
    if (!result.allowed) {
      const minutes = Math.ceil(result.retryAfterSeconds / 60);
      return { error: `Too many sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` };
    }
  } catch {
    // Fail closed: storage/configuration failures must never bypass the limiter.
    console.error("Login rate limiting unavailable.");
    return { error: "Sign-in is temporarily unavailable. Please try again shortly." };
  }

  const account = kind === "admin" ? await db.admin.findUnique({ where: { email }, select: { id: true, passwordHash: true } })
    : kind === "brand" ? await db.brand.findUnique({ where: { email }, select: { id: true, passwordHash: true } })
      : await db.influencer.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
  const valid = await bcrypt.compare(password, account?.passwordHash ?? DUMMY_HASH);
  if (!account || !valid) return { error: INVALID_LOGIN };
  return { id: account.id };
}
