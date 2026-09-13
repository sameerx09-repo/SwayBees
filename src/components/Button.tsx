import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const base =
  "text-sm font-semibold px-6 py-3.5 rounded-full transition-all hover:-translate-y-px active:translate-y-0";
const variants: Record<Variant, string> = {
  primary: "bg-gradient-social text-white shadow-[0_6px_20px_-6px_var(--color-accent)] hover:shadow-[0_8px_24px_-6px_var(--color-accent)] hover:opacity-95",
  secondary: "border border-border text-ink hover:border-accent hover:text-accent",
  ghost: "text-muted hover:text-ink",
};

export function Button({
  variant = "primary",
  href,
  className = "",
  children,
  ...rest
}: {
  variant?: Variant;
  href?: string;
  className?: string;
  children: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={`inline-block ${classes}`}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
