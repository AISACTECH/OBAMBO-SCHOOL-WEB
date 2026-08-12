"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import SchoolLogo from "./SchoolLogo";
import DataSaverToggle from "../ui/DataSaverToggle";

const NAV = [
  { href: "/about", label: "About" },
  { href: "/academics", label: "Academics" },
  { href: "/school-life", label: "Student Life" },
  { href: "/news", label: "News" },
  { href: "/resources", label: "Resources" },
  { href: "/community", label: "Community" },
  { href: "/alumni", label: "Alumni" },
  { href: "/admissions", label: "Admissions" },
  { href: "/contact", label: "Contact" },
];

export default function Header({ schoolName }: { schoolName: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/portal")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <SchoolLogo size={36} />
          <div className="leading-tight">
            <div className="font-display text-sm font-bold text-[var(--color-text)] md:text-base">St Mark&apos;s – Obambo</div>
            <div className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">Digital Campus</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition hover:text-[var(--color-primary)] ${
                pathname?.startsWith(item.href) ? "text-[var(--color-primary)]" : "text-[var(--color-text)]/80"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/search" className="btn btn-outline !px-3 !py-2" aria-label="Search the site">
            🔍
          </Link>
          <DataSaverToggle compact />
          <Link href="/portal/login" className="btn btn-outline">
            Student Portal
          </Link>
          <Link href="/alumni" className="btn btn-primary">
            Alumni
          </Link>
        </div>

        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--color-border)] lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          <span aria-hidden>{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] lg:hidden">
          <nav className="container-shell flex flex-col gap-1 py-3" aria-label="Mobile">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-[var(--color-bg)]"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 px-3">
              <Link href="/portal/login" className="btn btn-outline flex-1" onClick={() => setOpen(false)}>
                Student Portal
              </Link>
              <Link href="/alumni" className="btn btn-primary flex-1" onClick={() => setOpen(false)}>
                Alumni
              </Link>
            </div>
            <div className="px-3 pt-2">
              <DataSaverToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
