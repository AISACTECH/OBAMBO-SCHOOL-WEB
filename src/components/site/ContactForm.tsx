"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setStatus("success");
        e.currentTarget.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setError("We could not reach the school server. Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="card-surface p-6 text-center">
        <p className="font-display text-lg font-semibold text-[var(--color-primary)]">Message sent successfully.</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">The school administration will get back to you as soon as possible.</p>
        <button className="btn btn-outline mt-4" onClick={() => setStatus("idle")}>Send another message</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card-surface space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="name">Full name</label>
          <input required id="name" name="name" className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <input required type="email" id="email" name="email" className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium" htmlFor="phone">Phone (optional)</label>
          <input id="phone" name="phone" className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="subject">Subject</label>
          <select id="subject" name="subject" className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
            <option>General Enquiry</option>
            <option>Admissions</option>
            <option>Academic</option>
            <option>Student Support</option>
            <option>Alumni</option>
            <option>Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium" htmlFor="message">Message</label>
        <textarea required id="message" name="message" rows={5} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
      </div>
      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      <button className="btn btn-primary w-full" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
