"use client";

import { useActionState } from "react";
import { updateSocialAccount, type SocialAccountFormState } from "./actions";

const initialState: SocialAccountFormState = {};

function PlatformRow({
  platform,
  label,
  defaultHandle,
}: {
  platform: "TWITTER" | "REDDIT";
  label: string;
  defaultHandle: string;
}) {
  const [state, formAction, isPending] = useActionState(updateSocialAccount, initialState);

  return (
    <form action={formAction} className="flex items-end gap-3">
      <input type="hidden" name="platform" value={platform} />
      <label className="flex flex-col gap-1.5 flex-1">
        <span className="text-xs text-muted">{label} handle</span>
        <input
          type="text"
          name="handle"
          defaultValue={defaultHandle}
          placeholder="Leave blank to remove"
          className="text-sm border-b border-border pb-2 bg-transparent outline-none focus:border-ink"
        />
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

export function SocialAccountsForm({
  twitterHandle,
  redditHandle,
}: {
  twitterHandle: string;
  redditHandle: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <PlatformRow platform="TWITTER" label="Twitter / X" defaultHandle={twitterHandle} />
      <PlatformRow platform="REDDIT" label="Reddit" defaultHandle={redditHandle} />
    </div>
  );
}
