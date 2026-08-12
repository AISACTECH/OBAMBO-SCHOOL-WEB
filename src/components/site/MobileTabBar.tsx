"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/news", label: "Discover", icon: "🧭" },
  { href: "/resources", label: "Resources", icon: "📚" },
  { href: "/community", label: "Community", icon: "💬" },
  { href: "/portal/login", label: "Portal", icon: "🎓" },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/portal")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur lg:hidden"
      aria-label="Mobile navigation"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = tab.href === "/" ? pathname === "/" : pathname?.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                active ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"
              }`}
            >
              <span aria-hidden className="text-lg">{tab.icon}</span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
