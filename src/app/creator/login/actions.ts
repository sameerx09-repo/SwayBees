"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginInfluencer(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const influencer = await db.influencer.findUnique({ where: { email } });
  if (!influencer || !(await verifyPassword(password, influencer.passwordHash))) {
    return { error: "That email/password combination doesn't match an account." };
  }

  await setSessionCookie({ kind: "influencer", id: influencer.id });
  redirect("/collabs");
}
