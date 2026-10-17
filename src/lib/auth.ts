import { getTaskMode } from "@/lib/application-mode";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "cc_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .env — see .env.example."
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionKind = "brand" | "influencer" | "admin";

export type SessionPayload = {
  kind: SessionKind;
  id: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.kind !== "brand" && payload.kind !== "influencer" && payload.kind !== "admin") {
      return null;
    }
    if (typeof payload.id !== "string") return null;
    return { kind: payload.kind, id: payload.id };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_SECONDS,
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export const getSession = cache(async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
});

/** Session + the full Brand record, or null if not signed in as a brand. */
export const requireBrandSession = cache(async function requireBrandSession() {
  const session = await getSession();
  if (!session || session.kind !== "brand") return null;
  return db.brand.findUnique({ where: { id: session.id }, include: { subscription: true, criteria: true }, relationLoadStrategy: "join" });
});

/** Request-scoped creator record and joined profile data; never shared between users. */
export const requireInfluencerSession = cache(async function requireInfluencerSession() {
  const session = await getSession();
  if (!session || session.kind !== "influencer") return null;
  const mode = await getTaskMode();
  return db.influencer.findUnique({
    where: { id: session.id },
    include: {
      niches: { select: { niche: { select: { name: true } } } },
      socialAccounts: { select: { platform: true, handle: true } },
      _count: { select: { niches: true, invitations: { where: { status: "CREDITED", task: { mode } } } } },
    },
    relationLoadStrategy: "join",
  });
});

/** Request-scoped admin identity, or null if the session/account is invalid. */
export const requireAdminSession = cache(async function requireAdminSession() {
  const session = await getSession();
  if (!session || session.kind !== "admin") return null;
  return db.admin.findUnique({ where: { id: session.id }, select: { id: true, email: true } });
});
