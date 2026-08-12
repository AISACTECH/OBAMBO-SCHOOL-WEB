"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SchoolLogo from "@/components/site/SchoolLogo";

export default function AlumniRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", graduationYear: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/alumni/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) {
        router.push("/alumni/dashboard");
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
    <div className="grid min-h-screen place-items-center px-4 py-10" style={{ background: "var(--gradient-hero)" }}>
      <div className="card-surface w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <SchoolLogo size={44} />
          <h1 className="font-display mt-3 text-xl font-bold">Join the Alumni Network</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Registration currently uses secure email & password. Google/Facebook sign-in can be enabled by the school later.</p>
        </div>
        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input required type="email" placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input placeholder="Graduation year (optional)" value={form.graduationYear} onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input required type="password" minLength={8} placeholder="Password (min 8 characters)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
          <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Creating account…" : "Create Alumni Account"}</button>
        </form>
        <p className="mt-4 text-center text-xs text-[var(--color-muted)]">Already have an account? <Link href="/alumni/login" className="font-semibold text-[var(--color-primary)]">Sign in</Link></p>
      </div>
    </div>
  );
}
