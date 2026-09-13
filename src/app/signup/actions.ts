"use server";

import { redirect } from "next/navigation";
import { db, isUniqueConstraintError } from "@/lib/db";
import { hashPassword, setSessionCookie, requireBrandSession } from "@/lib/auth";
import { UGC_COST } from "@/lib/pricing";
import { Plan, Platform } from "@prisma/client";

const VALID_PLATFORMS = new Set(Object.values(Platform));

export type FormState = { error?: string };

export async function signupBrandAccount(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const companyName = String(formData.get("companyName") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!companyName || !category || !email || !password) {
    return { error: "Fill in every field." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await db.brand.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);
  let brand;
  try {
    brand = await db.brand.create({
      data: { companyName, category, email, passwordHash },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "An account with that email already exists." };
    }
    throw err;
  }

  await setSessionCookie({ kind: "brand", id: brand.id });
  redirect("/signup");
}

export async function createCampaign(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const brand = await requireBrandSession();
  if (!brand) {
    return { error: "Your session expired — log in again." };
  }

  const plan = String(formData.get("plan") ?? "") === "starter" ? Plan.STARTER : Plan.PRO;
  const platformRaw = String(formData.get("platform") ?? "INSTAGRAM");
  const platform = VALID_PLATFORMS.has(platformRaw as Platform)
    ? (platformRaw as Platform)
    : Platform.INSTAGRAM;
  const monthlyBudget = Number(formData.get("budget") ?? 0);
  const gender = String(formData.get("gender") ?? "any");
  const ageMin = Number(formData.get("ageMin") ?? 18);
  const ageMax = Number(formData.get("ageMax") ?? 65);
  const location = String(formData.get("location") ?? "").trim();
  const niche = String(formData.get("niche") ?? "").trim();

  if (!Number.isFinite(monthlyBudget) || monthlyBudget < UGC_COST) {
    return { error: `Budget must be at least $${UGC_COST} — that's one UGC collab.` };
  }
  if (!location || !niche) {
    return { error: "Fill in location and niche." };
  }

  const nextBillingAt = new Date();
  nextBillingAt.setMonth(nextBillingAt.getMonth() + 1);

  await db.subscription.create({
    data: { brandId: brand.id, plan, monthlyBudget, nextBillingAt },
  });
  await db.audienceCriteria.create({
    data: { brandId: brand.id, gender, ageMin, ageMax, location, niche, platform },
  });

  redirect("/settings");
}
