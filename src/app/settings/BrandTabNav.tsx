"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/settings", label: "Overview" },
  { href: "/settings/collabs", label: "Collabs" },
];

export function BrandTabNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`text-sm px-4 py-1.5 rounded-full transition-colors ${
              active ? "font-semibold bg-gradient-social text-white" : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
