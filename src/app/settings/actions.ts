"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireBrandSession } from "@/lib/auth";
import { generateTasksForBrand, type GenerateTasksResult } from "@/lib/matching-engine";

export async function runTaskGeneration(): Promise<
  GenerateTasksResult | { error: string }
> {
  const brand = await requireBrandSession();
  if (!brand) return { error: "Not signed in." };

  try {
    const result = await generateTasksForBrand(brand.id);
    revalidatePath("/settings");
    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to generate collabs." };
  }
}

export type InstagramHandleFormState = { error?: string; saved?: boolean };

/**
 * Self-declared, public Instagram handle — no OAuth. This is what lets
 * comment tasks resolve a real target post to verify against (see
 * lib/matching-engine.ts resolveCommentTargetUrl and lib/apify.ts):
 * the brand's public profile is scraped for its latest post rather than
 * requiring the brand to connect an Instagram account.
 */
export async function updateInstagramHandle(
  _prevState: InstagramHandleFormState,
  formData: FormData
): Promise<InstagramHandleFormState> {
  const brand = await requireBrandSession();
  if (!brand) return { error: "Not signed in." };

  const handle = String(formData.get("instagramHandle") ?? "")
    .trim()
    .replace(/^@/, "");

  await db.brand.update({
    where: { id: brand.id },
    data: { instagramHandle: handle || null },
  });

  revalidatePath("/settings");
  return { saved: true };
}
