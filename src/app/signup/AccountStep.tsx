"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";
import { StepIndicator } from "./StepIndicator";
import { signupBrandAccount, type FormState } from "./actions";

const initialState: FormState = {};

export function AccountStep() {
  const [state, formAction, isPending] = useActionState(
    signupBrandAccount,
    initialState
  );

  return (
    <div className="flex flex-col items-center">
      <StepIndicator step={1} />

      <div className="w-[500px] bg-surface border border-border p-11 flex flex-col gap-7">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted mt-1.5">
            Campaign setup — plan, budget, targeting — comes next.
          </p>
        </div>

        <form action={formAction} className="flex flex-col gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Company name</span>
            <input
              type="text"
              name="companyName"
              required
              className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-muted">Category</span>
            <input
              type="text"
              name="category"
              placeholder="e.g. Beauty & skincare"
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
            {isPending ? "Creating account…" : "Continue"}
          </Button>
        </form>

        <p className="text-xs text-muted text-center">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
