"use client";

import { useEffect, useState } from "react";

type ContactMessage = { id: number; name: string; email: string; phone: string | null; subject: string | null; message: string; status: string; createdAt: string };
type Feedback = { id: number; category: string; message: string; submitterName: string | null; anonymous: boolean; status: string; createdAt: string };

type Inbox = { messages: ContactMessage[]; feedback: Feedback[] };

export default function AdminMessagesPage() {
  const [inbox, setInbox] = useState<Inbox | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/contact-messages", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load messages");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setInbox({ messages: data.messages || [], feedback: data.feedback || [] });
      })
      .catch(() => {
        if (!controller.signal.aborted) setInbox({ messages: [], feedback: [] });
      });
    return () => controller.abort();
  }, []);

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`/api/admin/contact-messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setInbox((current) => current ? { ...current, messages: current.messages.map((message) => message.id === id ? { ...message, status } : message) } : current);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Messages &amp; Feedback</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Contact enquiries and community feedback submitted through the public site.</p>
      </div>

      <section className="card-surface overflow-x-auto p-5">
        <h2 className="font-display font-semibold">Contact Messages</h2>
        <table className="mt-3 w-full min-w-[720px] text-left text-sm">
          <thead><tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]"><th className="px-3 py-2">Date</th><th className="px-3 py-2">From</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Message</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Action</th></tr></thead>
          <tbody>
            {inbox === null && <tr><td className="p-3" colSpan={6}>Loading…</td></tr>}
            {inbox?.messages.length === 0 && <tr><td className="p-3 text-[var(--color-muted)]" colSpan={6}>No contact messages yet.</td></tr>}
            {inbox?.messages.map((message) => (
              <tr key={message.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-xs">{new Date(message.createdAt).toLocaleString("en-KE")}</td>
                <td className="px-3 py-2">{message.name}<br /><span className="text-xs text-[var(--color-muted)]">{message.email}</span></td>
                <td className="px-3 py-2">{message.subject || "General Enquiry"}</td>
                <td className="max-w-[280px] px-3 py-2">{message.message}</td>
                <td className="px-3 py-2"><span className="badge badge-normal capitalize">{message.status}</span></td>
                <td className="px-3 py-2">
                  {message.status === "new" && <button onClick={() => updateStatus(message.id, "read")} className="text-xs font-semibold text-[var(--color-primary)]">Mark read</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card-surface overflow-x-auto p-5">
        <h2 className="font-display font-semibold">Community Feedback</h2>
        <table className="mt-3 w-full min-w-[620px] text-left text-sm">
          <thead><tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]"><th className="px-3 py-2">Date</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">From</th><th className="px-3 py-2">Feedback</th><th className="px-3 py-2">Status</th></tr></thead>
          <tbody>
            {inbox?.feedback.length === 0 && inbox !== null && <tr><td className="p-3 text-[var(--color-muted)]" colSpan={5}>No feedback yet.</td></tr>}
            {inbox?.feedback.map((item) => (
              <tr key={item.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="whitespace-nowrap px-3 py-2 text-xs">{new Date(item.createdAt).toLocaleString("en-KE")}</td>
                <td className="px-3 py-2 capitalize">{item.category.replace(/-/g, " ")}</td>
                <td className="px-3 py-2">{item.anonymous ? "Anonymous" : item.submitterName || "Named"}</td>
                <td className="max-w-[360px] px-3 py-2">{item.message}</td>
                <td className="px-3 py-2"><span className="badge badge-normal capitalize">{item.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
