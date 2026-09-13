import { db } from "@/lib/db";
import { requireInfluencerSession } from "@/lib/auth";
import { ProfileForm } from "./ProfileForm";
import { SocialAccountsForm } from "./SocialAccountsForm";

export default async function ProfilePage() {
  const influencer = (await requireInfluencerSession())!;

  const totalEarned = await db.walletLedgerEntry.aggregate({
    where: { influencerId: influencer.id, status: { in: ["CREDITED", "PAID"] } },
    _sum: { amount: true },
  });

  const completedCount = await db.taskInvitation.count({
    where: { influencerId: influencer.id, status: "CREDITED" },
  });

  const niches = await db.influencerNiche.findMany({
    where: { influencerId: influencer.id },
    include: { niche: true },
  });

  const socialAccounts = await db.socialAccount.findMany({
    where: { influencerId: influencer.id },
  });
  const twitterHandle = socialAccounts.find((s) => s.platform === "TWITTER")?.handle ?? "";
  const redditHandle = socialAccounts.find((s) => s.platform === "REDDIT")?.handle ?? "";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold tracking-tight">Profile</h1>

      <div className="grid grid-cols-2 border border-border">
        <div className="p-6.5 flex flex-col gap-4 border-r border-border">
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
              <span className="font-mono">{influencer.followerCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Engagement rate</span>
              <span className="font-mono">{influencer.engagementRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Last synced</span>
              <span>
                {influencer.instagramLastSyncedAt
                  ? influencer.instagramLastSyncedAt.toLocaleDateString()
                  : "Never"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6.5 flex flex-col gap-4">
          <div className="text-sm text-muted">Earnings</div>
          <div className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Wallet balance</span>
              <span className="font-mono">${influencer.walletBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Total earned</span>
              <span className="font-mono">
                ${(totalEarned._sum.amount ?? 0).toFixed(2)}
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
