"use client";

import { useState } from "react";
import { Logo } from "@/components/Logo";
import { BrandLoginForm } from "./BrandLoginForm";
import { CreatorLoginForm } from "./CreatorLoginForm";

export default function LoginPage() {
  const [role, setRole] = useState<"brand" | "creator" | null>(null);

  return (
    <div className="flex flex-col items-center px-4 pt-14 sm:pt-20 pb-20 min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-accent-soft),_var(--color-paper)_55%)]">
      <div className="mb-9">
        <Logo size="sm" />
      </div>

      <div className="w-full max-w-[420px] bg-surface border border-border rounded-3xl p-7 sm:p-11 flex flex-col gap-7 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.15)]">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{role === "brand" ? "Brand log in" : role === "creator" ? "Creator log in" : "Log in"}</h1>
          <p className="text-sm text-muted mt-1.5">{role ? "Welcome back." : "Choose your account type to continue."}</p>
        </div>

        <div className="flex border border-border rounded-full p-1 w-fit">
          <button
            type="button"
            onClick={() => setRole("brand")}
            aria-pressed={role === "brand"}
            className={`text-sm px-5 py-2 rounded-full transition-colors ${
              role === "brand" ? "bg-gradient-social text-white font-semibold" : "text-muted"
            }`}
          >
            Brand
          </button>
          <button
            type="button"
            onClick={() => setRole("creator")}
            aria-pressed={role === "creator"}
            className={`text-sm px-5 py-2 rounded-full transition-colors ${
              role === "creator" ? "bg-gradient-social text-white font-semibold" : "text-muted"
            }`}
          >
            Creator
          </button>
        </div>

        {role === "brand" ? <BrandLoginForm /> : role === "creator" ? <CreatorLoginForm /> : null}
      </div>
    </div>
  );
}
