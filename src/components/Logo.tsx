export function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const mark = size === "sm" ? "text-[11px]" : "text-xs";
  const word = size === "sm" ? "text-sm" : "text-base";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${box} flex items-center justify-center rounded-full bg-gradient-social text-white`}
      >
        <span className={`${mark} font-bold`}>S</span>
      </div>
      <div className={`${word} font-bold tracking-tight`}>SwayFam</div>
    </div>
  );
}
