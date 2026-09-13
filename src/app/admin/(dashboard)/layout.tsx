import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { AdminTabNav } from "./AdminTabNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <div className="flex flex-col gap-8 px-18 py-10">
      <header className="flex items-center justify-between pb-6 border-b border-border">
        <Logo />
        <div className="flex items-center gap-5">
          <div className="text-xs font-semibold text-accent bg-accent-soft rounded-full px-3 py-1.5">
            ADMIN
          </div>
          <div className="text-sm font-medium">{admin.email}</div>
          <a href="/logout" className="text-xs text-muted pl-5 border-l border-border">
            Log out
          </a>
        </div>
      </header>

      <AdminTabNav />

      {children}
    </div>
  );
}
