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
    <div className="flex flex-col gap-6 sm:gap-7 px-4 sm:px-8 lg:px-18 py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4 flex-wrap pb-6 border-b border-border">
        <Logo />
        <div className="flex items-center gap-4 sm:gap-5 flex-wrap">
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
            className="text-xs text-muted sm:pl-5 sm:border-l sm:border-border"
          >
            Log out
          </a>
        </div>
      </header>

      <div className="overflow-x-auto">
        <BrandTabNav />
      </div>

      {children}
    </div>
  );
}
