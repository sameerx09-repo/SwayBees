export function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-3 mb-10">
      <Step n="01" label="Account" active={step === 1} done={step > 1} />
      <Rule />
      <Step n="02" label="Campaign" active={step === 2} done={step > 2} />
    </div>
  );
}

function Step({
  n,
  label,
  active,
  done,
}: {
  n: string;
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`font-mono text-xs ${active || done ? "text-accent" : "text-faint"}`}>
        {n}
      </div>
      <div className={`text-sm ${active ? "font-semibold" : done ? "text-ink" : "text-faint"}`}>
        {label}
      </div>
    </div>
  );
}

function Rule() {
  return <div className="w-8 h-px bg-border" />;
}
