"use server";

import { redirect } from "next/navigation";
import { db, isUniqueConstraintError } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export type SignupState = { error?: string };

export async function signupInfluencer(
  _prevState: SignupState,
  formData: FormData
): Promise<SignupState> {
  let handle = String(formData.get("handle") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!handle || !email || !password) {
    return { error: "Fill in every field." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!handle.startsWith("@")) handle = `@${handle}`;

  const existing = await db.influencer.findFirst({
    where: { OR: [{ email }, { handle }] },
  });
  if (existing) {
    return { error: "An account with that email or handle already exists." };
  }

  const passwordHash = await hashPassword(password);
  let influencer;
  try {
    influencer = await db.influencer.create({
      data: { handle, email, passwordHash },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "An account with that email or handle already exists." };
    }
    throw err;
  }

  await setSessionCookie({ kind: "influencer", id: influencer.id });
  redirect("/collabs");
}
