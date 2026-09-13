import { redirect } from "next/navigation";
import { requireInfluencerSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { TabNav } from "./TabNav";

export const dynamic = "force-dynamic";

export default async function CollabsLayout({ children }: { children: React.ReactNode }) {
  const influencer = await requireInfluencerSession();
  if (!influencer) {
    redirect("/creator/login");
  }

  return (
    <div className="flex flex-col gap-8 px-18 py-10">
      <header className="flex items-center justify-between pb-6 border-b border-border">
        <Logo />
        <div className="flex items-center gap-7">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-gradient-social flex items-center justify-center text-[10px] font-bold text-white">
              {influencer.handle.replace(/^@/, "").charAt(0).toUpperCase()}
            </div>
            <div className="text-sm font-medium">{influencer.handle}</div>
            {influencer.instagramConnected ? (
              <span className="text-[11px] text-success">Instagram connected</span>
            ) : (
              <a
                href="/api/instagram/authorize"
                className="text-[11px] font-medium underline"
              >
                Connect Instagram
              </a>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5 pl-6 border-l border-border">
            <div className="text-[11px] text-muted">Wallet balance</div>
            <div className="font-mono text-lg font-medium">
              ${influencer.walletBalance.toFixed(2)}
            </div>
            <div className="text-[11px] text-muted">Next payout Sep 1</div>
          </div>
          <a
            href="/logout"
            className="text-[11px] text-muted pl-6 border-l border-border"
          >
            Log out
          </a>
        </div>
      </header>

      <TabNav />

      {children}
    </div>
  );
}
