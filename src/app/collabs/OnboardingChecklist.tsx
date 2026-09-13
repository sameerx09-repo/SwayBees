import Link from "next/link";

export function OnboardingChecklist({
  needsProfile,
  needsInstagram,
}: {
  needsProfile: boolean;
  needsInstagram: boolean;
}) {
  if (!needsProfile && !needsInstagram) return null;

  return (
    <div className="border border-accent/30 bg-accent-soft px-5 py-4 flex flex-col gap-2">
      <div className="text-sm font-semibold">Finish setting up to get matched</div>
      <p className="text-xs text-muted-strong max-w-lg">
        Brands only see creators who match their audience criteria — an
        incomplete profile means the matching engine has nothing to match you
        on, which is why there&rsquo;s nothing here yet.
      </p>
      <div className="flex gap-5 mt-1">
        {needsProfile && (
          <Link href="/collabs/profile" className="text-xs font-medium underline">
            Add gender, age, location &amp; niche
          </Link>
        )}
        {needsInstagram && (
          <a href="/api/instagram/authorize" className="text-xs font-medium underline">
            Connect Instagram
          </a>
        )}
      </div>
    </div>
  );
}
