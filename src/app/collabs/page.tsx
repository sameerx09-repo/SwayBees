import { getTaskMode } from "@/lib/application-mode";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession, requireInfluencerSession } from "@/lib/auth";
import { CollabsClient, type CreatorTaskRow } from "./CollabsClient";
import { OnboardingChecklist } from "./OnboardingChecklist";

async function requestTime() { return Date.now(); }

export default async function CollabsPage({ searchParams }: {
  searchParams: Promise<{ instagram?: string; instagram_error?: string }>;
}) {
  const now = await requestTime();
  const { instagram, instagram_error } = await searchParams;
  const mode = await getTaskMode();
  const session = await getSession();
  if (!session || session.kind !== "influencer") redirect("/creator/login");
  const [influencer, invitations] = await Promise.all([
    requireInfluencerSession(),
    db.taskInvitation.findMany({
      where: { influencerId: session.id, task: { mode }, status: { not: "DECLINED" } },
      select: {
        id: true, status: true, createdAt: true,
        task: { select: { description: true, type: true, platform: true, payoutAmount: true,
          targetPostUrl: true, createdAt: true, brand: { select: { companyName: true } } } },
      },
      relationLoadStrategy: "join",
      orderBy: { createdAt: "desc" },
    }),
  ]);
  if (!influencer) redirect("/creator/login");
  const tasks: CreatorTaskRow[] = invitations.map((inv) => ({
    id: inv.id, brand: inv.task.brand?.companyName ?? "SwayBees", type: inv.task.type,
    platform: inv.task.platform, description: inv.task.description, status: inv.status,
    payoutAmount: inv.task.payoutAmount, targetPostUrl: inv.task.targetPostUrl,
    createdAt: inv.task.createdAt.toISOString(), assignedAt: inv.createdAt.toISOString(),
  }));
  return <div className="flex flex-col gap-6">
    <OnboardingChecklist needsProfile={!influencer.gender || !influencer.age || !influencer.location || influencer._count.niches === 0} needsInstagram={!influencer.instagramConnected} />
    {instagram === "connected" && <div className="text-sm bg-accent-soft px-5 py-3 border border-accent/30">Instagram connected.</div>}
    {instagram === "error" && <div className="text-sm bg-red-50 text-red-700 px-5 py-3 border border-red-200">Couldn&rsquo;t connect Instagram{instagram_error ? `: ${instagram_error}` : "."}</div>}
    <CollabsClient tasks={tasks} now={now} mode={mode} />
  </div>;
}
