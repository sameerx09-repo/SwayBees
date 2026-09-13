"use client";

import { useActionState } from "react";
import { updateInstagramHandle, type InstagramHandleFormState } from "./actions";

const initialState: InstagramHandleFormState = {};

export function InstagramHandleForm({ instagramHandle }: { instagramHandle: string }) {
  const [state, formAction, isPending] = useActionState(updateInstagramHandle, initialState);

  return (
    <form action={formAction} className="flex items-end gap-3">
      <label className="flex flex-col gap-1.5 flex-1">
        <span className="text-[11px] text-faint">
          Instagram handle (public — no login needed)
        </span>
        <div className="flex items-baseline gap-1 border-b border-border pb-1.5">
          <span className="text-sm text-muted">@</span>
          <input
            type="text"
            name="instagramHandle"
            defaultValue={instagramHandle}
            placeholder="yourbrand"
            className="text-sm bg-transparent outline-none flex-1"
          />
        </div>
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="text-xs font-medium underline pb-2 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      {state.saved && <span className="text-xs text-success pb-2">Saved</span>}
      {state.error && <span className="text-xs text-red-600 pb-2">{state.error}</span>}
    </form>
  );
}
