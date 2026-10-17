"use server";

import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth";
import { authenticatePasswordLogin } from "@/lib/password-login";

export type LoginState = { error?: string };

export async function loginBrand(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const result = await authenticatePasswordLogin("brand", formData);
  if ("error" in result) return result;
  await setSessionCookie({ kind: "brand", id: result.id });
  redirect("/settings");
}
