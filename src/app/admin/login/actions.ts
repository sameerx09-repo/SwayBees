"use server";

import { redirect } from "next/navigation";
import { setSessionCookie } from "@/lib/auth";
import { authenticatePasswordLogin } from "@/lib/password-login";

export type LoginState = { error?: string };

export async function loginAdmin(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const result = await authenticatePasswordLogin("admin", formData);
  if ("error" in result) return result;
  await setSessionCookie({ kind: "admin", id: result.id });
  redirect("/admin");
}
