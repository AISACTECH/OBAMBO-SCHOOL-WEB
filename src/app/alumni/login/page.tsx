"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SchoolLogo from "@/components/site/SchoolLogo";

export default function AlumniLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/alumni/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const next = searchParams.get("next");
        router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/alumni/dashboard");
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong.");
        setLoading(false);
      }
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="card-surface w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <SchoolLogo size={44} />
          <h1 className="font-display mt-3 text-xl font-bold">Alumni Sign In</h1>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">New here? <Link href="/alumni/register" className="font-semibold text-[var(--color-primary)]">Create an account</Link></p>
      </div>
    </div>
  );
}
