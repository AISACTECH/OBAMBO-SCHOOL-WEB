"use client";

import { useState } from "react";
import Link from "next/link";

const SUGGESTIONS = [
  "What documents are required for admission?",
  "Where can I find Form 2 Mathematics papers?",
  "How do I access my results?",
  "When is the next examination?",
];

type Answer = { question: string; answer: string; sources: { title: string; href: string }[] };

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Answer[]>([]);

  async function ask(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setQuestion("");
    try {
      const res = await fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: q }) });
      const data = await res.json().catch(() => ({}));
      setHistory((h) => [{ question: q, answer: data.answer || data.error || "The assistant is temporarily unavailable.", sources: data.sources || [] }, ...h]);
    } catch {
      setHistory((h) => [{ question: q, answer: "The assistant is temporarily unavailable. Please try again.", sources: [] }, ...h]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-shell max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold">Ask St Mark&apos;s</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        An assistant that only answers from official, published school information. It will never invent facts or reveal private student data.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)} className="btn btn-outline !py-1.5 text-xs">{s}</button>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); ask(question); }}
        className="mt-4 flex gap-2"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about St Mark's..."
          className="flex-1 rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm"
        />
        <button className="btn btn-primary" disabled={loading}>{loading ? "Thinking…" : "Ask"}</button>
      </form>

      <div className="mt-8 space-y-4">
        {history.map((h, i) => (
          <div key={i} className="card-surface p-5">
            <p className="text-sm font-semibold">{h.question}</p>
            <p className="mt-2 whitespace-pre-line text-sm text-[var(--color-muted)]">{h.answer}</p>
            {h.sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {h.sources.map((s, j) => (
                  <Link key={j} href={s.href} className="rounded-full bg-[var(--color-bg)] px-2.5 py-1 text-xs text-[var(--color-primary)]">{s.title}</Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
