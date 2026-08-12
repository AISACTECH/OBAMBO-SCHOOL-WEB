"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [admissionNumber, setAdmissionNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/student/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ admissionNumber }) });
      const data = await res.json().catch(() => ({}));
      setMessage(data.message || "Your request could not be submitted. Please contact the school office.");
    } catch {
      setMessage("We could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="card-surface w-full max-w-md p-8">
        <h1 className="font-display text-xl font-bold">Reset Your Password</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Enter your admission number. The school administration will assist you securely.</p>
        {message ? (
          <p className="mt-4 rounded-lg bg-[var(--color-bg)] p-3 text-sm">{message}</p>
        ) : (
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <input required value={admissionNumber} onChange={(e) => setAdmissionNumber(e.target.value)} placeholder="Admission Number" className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
            <button className="btn btn-primary w-full" disabled={loading}>{loading ? "Submitting…" : "Request Password Reset"}</button>
          </form>
        )}
        <Link href="/portal/login" className="mt-4 block text-center text-xs font-medium text-[var(--color-primary)]">← Back to Sign In</Link>
      </div>
    </div>
  );
}
