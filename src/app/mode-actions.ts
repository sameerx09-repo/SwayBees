"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { MODE_COOKIE } from "@/lib/application-mode";
import { parseTaskMode, modeName } from "@/lib/task-mode";

export async function setApplicationMode(value: "test" | "live"): Promise<{ error?: string }> {
  if (!(await getSession())) return { error: "Please sign in again." };
  if (value !== "test" && value !== "live") return { error: "Choose Test or Live mode." };
  const mode = parseTaskMode(value);
  if (!mode) return { error: "Choose Test or Live mode." };
  (await cookies()).set(MODE_COOKIE, modeName(mode), { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
  return {};
}
