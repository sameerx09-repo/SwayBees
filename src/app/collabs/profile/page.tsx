import { getTaskMode } from "@/lib/application-mode";
import { redirect } from "next/navigation";
import { formatINR } from "@/lib/currency";
import { db } from "@/lib/db";
import { getSession, requireInfluencerSession } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";
import { SocialAccountsForm } from "./SocialAccountsForm";

export default async function ProfilePage() {
  const mode = await getTaskMode();
  const session = await getSession();
  if (!session || session.kind !== "influencer") redirect("/creator/login");
  const [influencer, totalEarned] = await Promise.all([
    requireInfluencerSession(),
    db.walletLedgerEntry.aggregate({
      where: { influencerId: session.id, invitation: { task: { mode } }, status: { in: ["CREDITED", "PAID"] } },
      _sum: { amount: true },
    }),
  ]);
  if (!influencer) redirect("/creator/login");
  const completedCount = influencer._count.invitations;
  const { niches, socialAccounts } = influencer;
  const twitterHandle = socialAccounts.find((s) => s.platform === "TWITTER")?.handle ?? "";
  const redditHandle = socialAccounts.find((s) => s.platform === "REDDIT")?.handle ?? "";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Profile</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 border border-border">
        <div className="p-6.5 flex flex-col gap-4 sm:border-r border-b sm:border-b-0 border-border">
          <div className="text-sm text-muted">Instagram</div>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">{influencer.handle}</div>
            {influencer.instagramConnected ? (
              <span className="text-xs text-success">Connected</span>
            ) : (
              <a
                href="/api/instagram/authorize"
                className="text-xs font-medium underline"
              >
                Connect Instagram
              </a>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm pt-3 border-t border-border-light">
            <div className="flex justify-between">
              <span className="text-muted">Followers</span>
              <span className="font-mono">{influencer.followerCount.toLocaleString("en-US")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Engagement rate</span>
              <span className="font-mono">{influencer.engagementRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Last synced</span>
              <span>
                {influencer.instagramLastSyncedAt
                  ? influencer.instagramLastSyncedAt.toLocaleDateString("en-US")
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6.5 flex flex-col gap-4">
          <div className="text-sm text-muted">Earnings</div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{mode === "TEST" ? "Test balance" : "Wallet balance"}</span>
              <span className="font-mono">{formatINR(mode === "TEST" ? influencer.testWalletBalance : influencer.walletBalance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{mode === "TEST" ? "Total test earnings" : "Total earned"}</span>
              <span className="font-mono">
                {formatINR(totalEarned._sum.amount ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Collabs completed</span>
              <span className="font-mono">{completedCount}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-border p-6.5 flex flex-col gap-5">
        <div>
          <div className="text-sm font-semibold">Other platforms</div>
          <p className="text-xs text-muted mt-1 max-w-md">
            Self-declared — no OAuth for these yet, so this is how brands
            running Twitter/Reddit campaigns find out you&rsquo;re active
            there.
          </p>
        </div>
        <SocialAccountsForm twitterHandle={twitterHandle} redditHandle={redditHandle} />
      </div>

      <div className="border border-border p-6.5 flex flex-col gap-5">
        <div>
          <div className="text-sm font-semibold">Targeting details</div>
          <p className="text-xs text-muted mt-1 max-w-md">
            Self-reported — brands filter on this to decide who gets matched
            to their collabs. Instagram doesn&rsquo;t reliably expose age or
            gender, so this is how it gets set.
          </p>
        </div>
        <ProfileForm
          gender={influencer.gender}
          age={influencer.age}
          location={influencer.location}
          niches={niches.map((n) => n.niche.name)}
        />
      </div>
    </div>
  );
}
