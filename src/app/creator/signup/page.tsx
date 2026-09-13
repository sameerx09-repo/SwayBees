"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/Button";
import { signupInfluencer, type SignupState } from "./actions";

const initialState: SignupState = {};

export default function CreatorSignupPage() {
  const [state, formAction, isPending] = useActionState(
    signupInfluencer,
    initialState
  );

  return (
    <div className="flex flex-col items-center pt-20 pb-20">
      <div className="mb-9">
        <Logo size="sm" />
      </div>

      <div className="w-[420px] bg-surface border border-border p-11 flex flex-col gap-7">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Join as a creator</h1>
          <p className="text-sm text-muted mt-1.5">
            Get matched to paid UGC and comment collabs. Connect Instagram after
            you sign up.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Instagram handle</span>
            <input
              type="text"
              name="handle"
              placeholder="@yourhandle"
              required
              className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Email</span>
            <input
              type="email"
              name="email"
              required
              className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Password</span>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink"
            />
          </label>

          {state.error && <p className="text-xs text-red-600">{state.error}</p>}

          <Button type="submit" disabled={isPending} className="text-center mt-2">
            {isPending ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-xs text-muted text-center">
          Already a creator?{" "}
          <Link href="/creator/login" className="font-medium text-ink">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
