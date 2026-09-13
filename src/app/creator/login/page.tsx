"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { loginInfluencer, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function CreatorLoginPage() {
  const [state, formAction, isPending] = useActionState(
    loginInfluencer,
    initialState
  );

  return (
    <div className="flex flex-col items-center pt-20 pb-20 min-h-screen bg-[radial-gradient(circle_at_top,_var(--color-accent-soft),_var(--color-paper)_55%)]">
      <div className="mb-9">
        <Logo size="sm" />
      </div>

      <div className="w-[420px] bg-surface border border-border rounded-3xl p-11 flex flex-col gap-7 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.15)]">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Creator log in</h1>
          <p className="text-sm text-muted mt-1.5">Welcome back.</p>
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

        <p className="text-xs text-muted text-center">
          New creator?{" "}
          <Link href="/creator/signup" className="font-medium text-ink">
            Join here
          </Link>
        </p>
        <p className="text-xs text-muted text-center">
          Brand?{" "}
          <Link href="/login" className="font-medium text-ink">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
}
