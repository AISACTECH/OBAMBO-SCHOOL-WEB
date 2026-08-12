import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStudent, isResponse } from "@/lib/guards";
import SchoolLogo from "@/components/site/SchoolLogo";
import NotificationBell from "@/components/site/NotificationBell";
import PortalNav from "../PortalNav";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await requireStudent();
  if (isResponse(session)) redirect("/portal/login");

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="container-shell flex h-16 items-center justify-between">
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <SchoolLogo size={32} />
            <span className="font-display text-sm font-bold">Student Portal</span>
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link href="/" className="text-xs font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)]">Exit to public site</Link>
          </div>
        </div>
      </header>
      <div className="container-shell grid gap-6 py-6 lg:grid-cols-[220px_1fr]">
        <PortalNav studentName={session.name} form={String(session.form || "")} />
        <main>{children}</main>
      </div>
    </div>
  );
}
