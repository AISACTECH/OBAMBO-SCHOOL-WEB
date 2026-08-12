"use client";

import { useState } from "react";

export default function FeedbackForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [anonymous, setAnonymous] = useState(true);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    const payload = {
      category: form.get("category"),
      message: form.get("message"),
      submitterName: anonymous ? "" : form.get("submitterName"),
      anonymous,
    };
    const res = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setStatus(res.ok ? "success" : "error");
    if (res.ok) e.currentTarget.reset();
  }

  if (status === "success") {
    return (
      <div className="card-surface p-6 text-center">
        <p className="font-display text-lg font-semibold text-[var(--color-primary)]">Thank you for your feedback.</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">The school administration reviews all submissions.</p>
        <button className="btn btn-outline mt-4" onClick={() => setStatus("idle")}>Submit more feedback</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-surface space-y-4 p-6">
      <div>
        <label className="text-sm font-medium" htmlFor="category">Category</label>
        <select id="category" name="category" className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
          {["academic", "facilities", "student-life", "technology", "sports", "clubs", "community", "other"].map((c) => (
            <option key={c} value={c}>{c.replace(/-/g, " ")}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="message">Your feedback</label>
        <textarea required id="message" name="message" rows={5} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} />
        Submit anonymously
      </label>
      {!anonymous && (
        <div>
          <label className="text-sm font-medium" htmlFor="submitterName">Your name</label>
          <input id="submitterName" name="submitterName" className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
        </div>
      )}
      <button className="btn btn-primary w-full" disabled={status === "loading"}>{status === "loading" ? "Submitting…" : "Submit Feedback"}</button>
      {status === "error" && <p className="text-sm text-[var(--color-danger)]">Something went wrong. Please try again.</p>}
    </form>
  );
}
