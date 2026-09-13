"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/Button";
import { NICHES } from "@/lib/niches";
import { updateProfile, type ProfileFormState } from "./actions";

const initialState: ProfileFormState = {};

export function ProfileForm({
  gender,
  age,
  location,
  niches,
}: {
  gender: string | null;
  age: number | null;
  location: string | null;
  niches: string[];
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState);
  const [selectedNiches, setSelectedNiches] = useState<string[]>(niches);

  function toggleNiche(n: string) {
    setSelectedNiches((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {selectedNiches.map((n) => (
        <input key={n} type="hidden" name="niches" value={n} />
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Gender</span>
          <select
            name="gender"
            defaultValue={gender ?? ""}
            required
            className="text-sm border-b border-border pb-2 bg-transparent outline-none"
          >
            <option value="" disabled>
              Select
            </option>
            <option value="women">Women</option>
            <option value="men">Men</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-muted">Age</span>
          <input
            type="number"
            name="age"
            min={13}
            defaultValue={age ?? ""}
            required
            className="text-sm border-b border-border pb-2 bg-transparent outline-none font-mono"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-muted">Location (city)</span>
        <input
          type="text"
          name="location"
          defaultValue={location ?? ""}
          required
          className="text-sm border-b border-border pb-2 bg-transparent outline-none"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted">
          Niches — pick as many as apply, brands match on any of them
        </span>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {NICHES.map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => toggleNiche(n)}
              className={`text-sm px-3 py-1.5 border ${
                selectedNiches.includes(n)
                  ? "bg-ink text-paper border-ink font-medium"
                  : "border-border text-muted"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.saved && <p className="text-xs text-success">Saved.</p>}

      <Button type="submit" disabled={isPending} className="text-center w-fit">
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
