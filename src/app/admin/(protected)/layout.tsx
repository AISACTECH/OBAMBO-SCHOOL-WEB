import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireStaff, isResponse } from "@/lib/guards";
import { roleLabel } from "@/lib/permissions";
import SchoolLogo from "@/components/site/SchoolLogo";
import NotificationBell from "@/components/site/NotificationBell";
import AdminSidebar from "../AdminSidebar";
import CommandPalette from "../CommandPalette";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireStaff();
  if (isResponse(session)) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <SchoolLogo size={30} />
            <span className="font-display text-sm font-bold">School Control Center</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[var(--color-muted)] md:inline">Press Ctrl+K for quick actions</span>
            <NotificationBell />
            <span className="rounded-full bg-[var(--color-bg)] px-3 py-1 text-xs font-semibold">{roleLabel(session.role)}</span>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1400px] gap-6 p-4 md:grid-cols-[220px_1fr] md:p-6">
        <AdminSidebar role={session.role} name={session.name} />
        <main>{children}</main>
      </div>
      <CommandPalette />
    </div>
  );
}
