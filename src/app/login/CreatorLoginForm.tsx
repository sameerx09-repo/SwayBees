"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { loginInfluencer, type LoginState } from "@/app/creator/login/actions";

const initialState: LoginState = {};

export function CreatorLoginForm() {
  const [state, formAction, isPending] = useActionState(loginInfluencer, initialState);

  return (
    <div className="flex flex-col gap-7">
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
    </div>
  );
}
