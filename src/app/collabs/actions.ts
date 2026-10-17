"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getTaskMode } from "@/lib/application-mode";
import { getSession } from "@/lib/auth";
import { acceptTask } from "@/lib/task-workflow";

export async function acceptInvitation(invitationId: string): Promise<{ error?: string }> {
  const mode = await getTaskMode();
  const session = await getSession();
  if (!session || session.kind !== "influencer") return { error: "Please sign in again." };
  const result = await acceptTask(db, invitationId, session.id, mode);
  revalidatePath("/collabs");
  return result;
}

export async function declineInvitation(invitationId: string): Promise<{ error?: string }> {
  const mode = await getTaskMode();
  const session = await getSession();
  if (!session || session.kind !== "influencer") return { error: "Please sign in again." };
  const result = await db.taskInvitation.updateMany({
    where: { id: invitationId, influencerId: session.id, task: { mode }, status: "PENDING" },
    data: { status: "DECLINED", respondedAt: new Date() },
  });
  revalidatePath("/collabs");
  return result.count ? {} : { error: "Only a new task can be declined." };
}

/** Creators submit completion for backend review; no scraping or crediting runs here. */
export async function submitInvitation(invitationId: string): Promise<{ error?: string }> {
  const mode = await getTaskMode();
  const session = await getSession();
  if (!session || session.kind !== "influencer") return { error: "Please sign in again." };
  const result = await db.taskInvitation.updateMany({
    where: { id: invitationId, influencerId: session.id, task: { mode }, status: "ACCEPTED" },
    data: { status: "SUBMITTED" },
  });
  revalidatePath("/collabs");
  revalidatePath("/admin/tasks");
  revalidatePath("/admin");
  return result.count ? {} : { error: "Only an accepted task can be submitted for review." };
}
