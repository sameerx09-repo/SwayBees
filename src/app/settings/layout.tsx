import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { BrandTabNav } from "./BrandTabNav";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.kind !== "brand") {
    redirect("/login");
  }

  const brand = await db.brand.findUniqueOrThrow({
    where: { id: session.id },
    include: { subscription: true },
  });

  if (!brand.subscription) {
    redirect("/signup");
  }

  return (
    <div className="flex flex-col gap-7 px-18 py-10">
      <header className="flex items-center justify-between pb-6 border-b border-border">
        <Logo />
        <div className="flex items-center gap-5">
          <div className="text-xs font-semibold text-accent bg-accent-soft rounded-full px-3 py-1.5">
            {brand.subscription.plan} PLAN
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-gradient-social flex items-center justify-center text-[10px] font-bold text-white">
              {brand.companyName.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm font-medium">{brand.companyName}</div>
          </div>
          <a
            href="/logout"
            className="text-xs text-muted pl-5 border-l border-border"
          >
            Log out
          </a>
        </div>
      </header>

      <BrandTabNav />

      {children}
    </div>
  );
}
