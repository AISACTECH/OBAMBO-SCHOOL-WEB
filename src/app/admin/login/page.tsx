"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SchoolLogo from "@/components/site/SchoolLogo";

export default function AdminLoginPage() {
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
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        const next = searchParams.get("next");
        router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/admin");
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
    <div className="grid min-h-screen place-items-center bg-[#08120e] px-4">
      <div className="card-surface w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <SchoolLogo size={44} />
          <h1 className="font-display mt-3 text-xl font-bold">School Control Center</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Staff & administrator sign in</p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Signing in…" : "Sign In"}</button>
        </form>
        <div className="mt-6 rounded-lg bg-[var(--color-bg)] p-3 text-[11px] text-[var(--color-muted)]">
          Use the staff account configured by the school administrator. If this is a new installation, run the seed script with a secure ADMIN_EMAIL and ADMIN_PASSWORD.
        </div>
      </div>
    </div>
  );
}
