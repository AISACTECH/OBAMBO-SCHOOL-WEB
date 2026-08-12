"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/portal/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/portal/results", label: "My Results", icon: "📊" },
  { href: "/portal/resources", label: "My Resources", icon: "📚" },
  { href: "/portal/announcements", label: "My Announcements", icon: "📣" },
  { href: "/portal/notifications", label: "Notifications", icon: "🔔" },
  { href: "/portal/profile", label: "Profile", icon: "👤" },
];

export default function PortalNav({ studentName, form }: { studentName: string; form: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/student/logout", { method: "POST" });
    router.push("/portal/login");
    router.refresh();
  }

  return (
    <aside className="card-surface h-fit p-4">
      <div className="border-b border-[var(--color-border)] pb-3">
        <p className="font-display text-sm font-semibold">Welcome back,</p>
        <p className="text-sm text-[var(--color-primary)]">{studentName.split(" ")[0]}</p>
        <p className="text-xs text-[var(--color-muted)]">{form}</p>
      </div>
      <nav className="mt-3 space-y-1">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${pathname === l.href ? "bg-[var(--color-primary)] text-white" : "hover:bg-[var(--color-bg)]"}`}>
            <span aria-hidden>{l.icon}</span>{l.label}
          </Link>
        ))}
        <button onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-bg)]">
          <span aria-hidden>🚪</span>Sign Out
        </button>
      </nav>
    </aside>
  );
}
