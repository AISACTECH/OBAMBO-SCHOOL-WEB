"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { hasPermission } from "@/lib/permissions";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: "🏠", permission: undefined },
  { href: "/admin/announcements", label: "Announcements", icon: "📣", permission: "manage_content" as const },
  { href: "/admin/news", label: "News", icon: "📰", permission: "manage_content" as const },
  { href: "/admin/events", label: "Events", icon: "📅", permission: "manage_content" as const },
  { href: "/admin/resources", label: "Learning Hub", icon: "📚", permission: "manage_content" as const },
  { href: "/admin/results", label: "Results Import", icon: "📊", permission: "manage_results" as const },
  { href: "/admin/integrations/google-sheets", label: "Google Sheets", icon: "🔗", permission: "manage_results" as const },
  { href: "/admin/students", label: "Students", icon: "🎓", permission: "manage_users" as const },
  { href: "/admin/alumni", label: "Alumni", icon: "🤝", permission: "manage_alumni" as const },
  { href: "/admin/community", label: "Community", icon: "💬", permission: "moderate_community" as const },
  { href: "/admin/moderation", label: "Moderation Center", icon: "🛡️", permission: "moderate_community" as const },
  { href: "/admin/leadership", label: "Leadership", icon: "🧑‍💼", permission: "manage_content" as const },
  { href: "/admin/pages", label: "Pages", icon: "📄", permission: "manage_content" as const },
  { href: "/admin/media", label: "Media Library", icon: "🖼️", permission: "manage_content" as const },
  { href: "/admin/messages", label: "Messages & Feedback", icon: "✉️", permission: "manage_content" as const },
  { href: "/admin/settings", label: "Settings", icon: "⚙️", permission: "manage_settings" as const },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: "🧾", permission: "view_audit_logs" as const },
];

export default function AdminSidebar({ role, name }: { role: string; name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="card-surface h-fit p-4">
      <div className="border-b border-[var(--color-border)] pb-3">
        <p className="text-sm font-semibold">{name}</p>
      </div>
      <nav className="mt-3 space-y-1">
        {LINKS.filter((l) => !l.permission || hasPermission(role, l.permission)).map((l) => (
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
