"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import { generateApiKey } from "@/lib/api-keys";

export type CreateApiKeyState = { error?: string; rawKey?: string; keyName?: string };

/**
 * Issues a new ApiKey for an external integration (see
 * app/api/v1/tasks). The raw secret is returned here and only here —
 * CreateApiKeyForm is responsible for actually showing it to the admin,
 * since it can never be recovered again once this response is gone.
 */
export async function createApiKey(
  _prevState: CreateApiKeyState,
  formData: FormData
): Promise<CreateApiKeyState> {
  const admin = await requireAdminSession();
  if (!admin) return { error: "Not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the key a name (e.g. the integration it's for)." };

  const { raw, keyHash, keyPrefix } = generateApiKey();
  await db.apiKey.create({ data: { name, keyHash, keyPrefix } });

  revalidatePath("/admin/api-keys");
  return { rawKey: raw, keyName: name };
}

/** Revokes a key — it stops authenticating immediately, but stays listed for audit history. */
export async function revokeApiKey(formData: FormData) {
  const admin = await requireAdminSession();
  if (!admin) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  revalidatePath("/admin/api-keys");
}
