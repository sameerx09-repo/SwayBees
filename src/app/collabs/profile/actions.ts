"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireInfluencerSession } from "@/lib/auth";
import { Platform } from "@prisma/client";

export type ProfileFormState = { error?: string; saved?: boolean };

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const influencer = await requireInfluencerSession();
  if (!influencer) return { error: "Not signed in." };

  const gender = String(formData.get("gender") ?? "");
  const age = Number(formData.get("age") ?? 0);
  const location = String(formData.get("location") ?? "").trim();
  const niches = formData.getAll("niches").map(String);

  if (!gender || !location || niches.length === 0 || !Number.isFinite(age) || age < 13) {
    return { error: "Fill in every field and pick at least one niche." };
  }

  const nicheRows = await db.niche.findMany({ where: { name: { in: niches } } });

  await db.$transaction([
    db.influencer.update({
      where: { id: influencer.id },
      data: { gender, age, location },
    }),
    db.influencerNiche.deleteMany({ where: { influencerId: influencer.id } }),
    db.influencerNiche.createMany({
      data: nicheRows.map((n) => ({ influencerId: influencer.id, nicheId: n.id })),
    }),
  ]);

  revalidatePath("/collabs/profile");
  return { saved: true };
}

export type SocialAccountFormState = { error?: string; saved?: boolean };

export async function updateSocialAccount(
  _prevState: SocialAccountFormState,
  formData: FormData
): Promise<SocialAccountFormState> {
  const influencer = await requireInfluencerSession();
  if (!influencer) return { error: "Not signed in." };

  const platformRaw = String(formData.get("platform") ?? "");
  const handle = String(formData.get("handle") ?? "").trim();

  if (platformRaw !== "TWITTER" && platformRaw !== "REDDIT") {
    return { error: "Invalid platform." };
  }
  const platform = platformRaw as Platform;

  if (!handle) {
    // Empty handle = remove the account rather than error, so a
    // creator can un-declare a platform they no longer use.
    await db.socialAccount.deleteMany({ where: { influencerId: influencer.id, platform } });
    revalidatePath("/collabs/profile");
    return { saved: true };
  }

  await db.socialAccount.upsert({
    where: { influencerId_platform: { influencerId: influencer.id, platform } },
    update: { handle },
    create: { influencerId: influencer.id, platform, handle },
  });

  revalidatePath("/collabs/profile");
  return { saved: true };
}
