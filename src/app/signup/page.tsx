import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { AccountStep } from "./AccountStep";
import { CampaignStep } from "./CampaignStep";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const session = await getSession();

  // A signed-in influencer landed here by mistake — this flow is brand-only.
  if (session?.kind === "influencer") {
    redirect("/collabs");
  }

  const brand = session?.kind === "brand"
    ? await db.brand.findUnique({
        where: { id: session.id },
        include: { subscription: true },
      })
    : null;

  // Already fully onboarded — nothing left to do here.
  if (brand?.subscription) {
    redirect("/settings");
  }

  return (
    <div className="flex flex-col items-center pt-13 pb-20 gap-9">
      <Logo size="sm" />
      {brand ? <CampaignStep companyName={brand.companyName} /> : <AccountStep />}
    </div>
  );
}
