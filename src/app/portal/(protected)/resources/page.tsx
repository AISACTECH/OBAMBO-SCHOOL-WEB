"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Resource = { id: number; title: string; subject: string; form: string; term: string; year: number; fileUrl: string };

export default function PortalResourcesPage() {
  const [items, setItems] = useState<Resource[] | null>(null);

  useEffect(() => {
    fetch("/api/student/saved-resources").then((r) => r.json()).then((d) => setItems(d.resources || []));
  }, []);

  async function unsave(id: number) {
    await fetch("/api/student/saved-resources", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ resourceId: id }) });
    setItems((prev) => (prev || []).filter((r) => r.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">My Saved Resources</h1>
        <Link href="/resources" className="btn btn-outline">Browse Learning Hub</Link>
      </div>

      {items === null ? (
        <div className="skeleton mt-6 h-40 w-full" />
      ) : items.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--color-muted)]">You haven&apos;t saved any resources yet. Visit the Learning Hub to find revision papers, notes and past papers.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((r) => (
            <div key={r.id} className="card-surface p-4">
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-[var(--color-muted)]">{r.subject} · {r.form} · {r.term} {r.year}</p>
              <div className="mt-3 flex gap-2">
                <a href={r.fileUrl} download className="btn btn-primary !py-1.5 text-xs">Download</a>
                <button onClick={() => unsave(r.id)} className="btn btn-outline !py-1.5 text-xs">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
