"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Result = { type: string; title: string; href: string };

function readRecentSearches() {
  try {
    const value: unknown = JSON.parse(localStorage.getItem("stmarks-recent-search") || "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 6) : [];
  } catch {
    return [];
  }
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const timer = window.setTimeout(() => setRecent(readRecentSearches()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      void fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error("Search failed");
          return res.json();
        })
        .then((data) => {
          if (!controller.signal.aborted) setResults(data.results || []);
        })
        .catch((error: unknown) => {
          if (!controller.signal.aborted && !(error instanceof DOMException && error.name === "AbortError")) {
            setResults([]);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [q]);

  function saveRecent(term: string) {
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    setRecent(next);
    localStorage.setItem("stmarks-recent-search", JSON.stringify(next));
  }

  return (
    <div className="container-shell max-w-2xl py-12">
      <h1 className="font-display text-3xl font-bold">Search St Mark&apos;s Digital Campus</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">Search news, announcements, resources, pages, events, alumni and community groups.</p>

      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && q.trim() && saveRecent(q.trim())}
        placeholder="Try “Form 2 Mathematics” or “admissions”"
        className="mt-6 w-full rounded-xl border border-[var(--color-border)] px-4 py-3 text-sm shadow-sm"
      />

      {q.trim().length < 2 && recent.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase text-[var(--color-muted)]">Recent searches</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {recent.map((r) => (
              <button key={r} onClick={() => setQ(r)} className="btn btn-outline !py-1 text-xs">{r}</button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 space-y-2">
        {loading && <p className="text-sm text-[var(--color-muted)]">Searching…</p>}
        {!loading && q.trim().length >= 2 && results.length === 0 && (
          <div className="card-surface p-5 text-sm text-[var(--color-muted)]">
            No results for “{q}”. Try different keywords, or use{" "}
            <Link href="/ask" className="font-semibold text-[var(--color-primary)]">Ask St Mark&apos;s</Link>.
          </div>
        )}
        {!loading && results.map((r, i) => (
          <Link key={i} href={r.href} onClick={() => saveRecent(q.trim())} className="card-surface flex items-center justify-between p-4 text-sm hover:border-[var(--color-primary)]">
            <span>{r.title}</span>
            <span className="badge badge-normal">{r.type}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
