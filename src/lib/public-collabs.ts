import type { PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { toPublicCollabPreview } from "@/lib/public-collab-preview";

/** The anonymous feed is always Live, independent of any browser's Test/Live preference. */
export async function getPublicCollabPreviews(client: Pick<PrismaClient, "task"> = db) {
  const tasks = await client.task.findMany({
    where: { mode: "LIVE", platform: "INSTAGRAM", invitations: { some: { status: "PENDING" } } },
    select: { type: true, targetPostUrl: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 24,
  });
  const varied = tasks.filter((task, index) => tasks.findIndex(candidate => candidate.type === task.type) === index);
  const selected = [...varied, ...tasks.filter(task => !varied.includes(task))].slice(0, 6);
  return selected.map(toPublicCollabPreview);
}
