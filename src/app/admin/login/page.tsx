"use client";

import { useActionState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { loginAdmin, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState(loginAdmin, initialState);

  return (
    <div className="flex flex-col items-center px-4 pt-14 sm:pt-20 pb-20 min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-accent-soft),_var(--color-paper)_55%)]">
      <div className="mb-9">
        <Logo size="sm" />
      </div>

      <div className="w-full max-w-[420px] bg-surface border border-border rounded-3xl p-7 sm:p-11 flex flex-col gap-7 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.15)]">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Admin log in</h1>
          <p className="text-sm text-muted mt-1.5">
            Internal only — no public signup. See prisma/seed-admin.ts.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Email</span>
            <input
              type="email"
              name="email"
              required
              className="text-sm border border-border rounded-xl px-4 py-3 bg-transparent outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Password</span>
            <input
              type="password"
              name="password"
              required
              className="text-sm border border-border rounded-xl px-4 py-3 bg-transparent outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-shadow"
            />
          </label>

          {state.error && <p className="text-xs text-red-600">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="text-center mt-2">
            {isPending ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
