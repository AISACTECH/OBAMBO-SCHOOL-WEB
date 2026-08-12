"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SchoolLogo from "@/components/site/SchoolLogo";

export default function StudentLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ admissionNumber: "", password: "", birthCertificateNumber: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/student/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const next = searchParams.get("next");
        router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/portal/dashboard");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-md">
        <div className="card-surface p-8">
          <div className="flex flex-col items-center text-center">
            <SchoolLogo size={48} />
            <h1 className="font-display mt-3 text-xl font-bold">Student Portal</h1>
            <p className="mt-1 text-sm text-[var(--color-muted)]">St Mark&apos;s Secondary School – Obambo</p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium" htmlFor="admissionNumber">Admission Number</label>
              <input
                required
                id="admissionNumber"
                value={form.admissionNumber}
                onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="password">Password</label>
              <input
                required
                type="password"
                id="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium" htmlFor="birthCertificateNumber">Birth Certificate Number</label>
              <input
                required
                id="birthCertificateNumber"
                value={form.birthCertificateNumber}
                onChange={(e) => setForm({ ...form, birthCertificateNumber: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
                autoComplete="off"
              />
              <p className="mt-1 text-[11px] text-[var(--color-muted)]">Used only to verify your identity. Never shared or displayed publicly.</p>
            </div>
            {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
            <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
          </form>

          <div className="mt-4 flex justify-between text-xs">
            <Link href="/portal/forgot-password" className="font-medium text-[var(--color-primary)]">Forgot Password?</Link>
            <Link href="/contact" className="font-medium text-[var(--color-muted)]">Need Help?</Link>
          </div>

          <div className="mt-6 rounded-lg bg-[var(--color-bg)] p-3 text-[11px] text-[var(--color-muted)]">
            Demo account for testing: Admission <strong>DEMO-0001</strong>, Password <strong>Student123!</strong>, Birth Certificate <strong>DEMO123456</strong>.
          </div>
        </div>
        <Link href="/" className="mt-4 block text-center text-xs font-medium text-white/80">← Back to school website</Link>
      </div>
    </div>
  );
}
