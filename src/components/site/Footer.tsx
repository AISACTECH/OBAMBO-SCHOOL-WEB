import Link from "next/link";
import SchoolLogo from "./SchoolLogo";
import type { SchoolSettings } from "@/lib/settings";

export default function Footer({ settings }: { settings: SchoolSettings }) {
  return (
    <footer className="mt-20 border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-24 pt-12 lg:pb-12">
      <div className="container-shell grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <SchoolLogo size={34} />
            <span className="font-display font-bold">St Mark&apos;s – Obambo</span>
          </div>
          <p className="mt-3 text-sm text-[var(--color-muted)]">
            {settings.address}
          </p>
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            A digital campus built for discipline, education, community, progress, technology and pride.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            <li><Link href="/about" className="hover:text-[var(--color-primary)]">About the School</Link></li>
            <li><Link href="/academics" className="hover:text-[var(--color-primary)]">Academics</Link></li>
            <li><Link href="/admissions" className="hover:text-[var(--color-primary)]">Admissions</Link></li>
            <li><Link href="/school-life" className="hover:text-[var(--color-primary)]">Student Life</Link></li>
            <li><Link href="/downloads" className="hover:text-[var(--color-primary)]">Download Centre</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Community</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            <li><Link href="/alumni" className="hover:text-[var(--color-primary)]">Alumni Network</Link></li>
            <li><Link href="/community" className="hover:text-[var(--color-primary)]">St Mark&apos;s Community</Link></li>
            <li><Link href="/our-progress" className="hover:text-[var(--color-primary)]">Our Progress</Link></li>
            <li><Link href="/gallery" className="hover:text-[var(--color-primary)]">School Life Gallery</Link></li>
            <li><Link href="/feedback" className="hover:text-[var(--color-primary)]">Voice of the Community</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold">Contact</h3>
          <ul className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
            <li>{settings.phone || "Information awaiting school verification."}</li>
            <li>{settings.email || "Information awaiting school verification."}</li>
            <li><Link href="/contact" className="hover:text-[var(--color-primary)]">Contact / Directions</Link></li>
            <li><Link href="/admin/login" className="hover:text-[var(--color-primary)]">Staff Control Center</Link></li>
          </ul>
        </div>
      </div>
      <div className="container-shell mt-10 flex flex-col gap-2 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-muted)] md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} {settings.schoolName}. All rights reserved.</p>
        <p>Obambo, South West Kisumu Ward, Kisumu West Sub-County, Kisumu County, Kenya</p>
      </div>
    </footer>
  );
}
