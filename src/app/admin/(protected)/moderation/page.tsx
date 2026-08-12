"use client";

import { useEffect, useState } from "react";

type Report = { id: number; targetType: string; targetId: number; reason: string; details: string; status: string; createdAt: string };

export default function ModerationCenterPage() {
  const [reports, setReports] = useState<Report[] | null>(null);

  async function load() {
    const res = await fetch("/api/admin/reports");
    const data = await res.json();
    setReports(data.reports || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/reports", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load reports");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setReports(data.reports || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setReports([]);
      });
    return () => controller.abort();
  }, []);

  async function act(id: number, action: string) {
    await fetch(`/api/admin/reports/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    load();
  }

  const pending = reports?.filter((r) => r.status === "pending") || [];
  const resolved = reports?.filter((r) => r.status !== "pending") || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Moderation Center</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Reported posts, comments and community content awaiting review.</p>
      </div>

      <div className="card-surface p-5">
        <h2 className="font-display font-semibold">Reported Content ({pending.length})</h2>
        <div className="mt-3 space-y-3">
          {reports === null && <p className="text-sm text-[var(--color-muted)]">Loading…</p>}
          {pending.length === 0 && reports !== null && <p className="text-sm text-[var(--color-muted)]">No pending reports. The community is healthy.</p>}
          {pending.map((r) => (
            <div key={r.id} className="rounded-lg border border-[var(--color-border)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold capitalize">{r.targetType} #{r.targetId}</p>
                <span className="text-xs text-[var(--color-muted)]">{new Date(r.createdAt).toLocaleString("en-KE")}</span>
              </div>
              <p className="mt-1 text-sm">Reason: {r.reason}</p>
              {r.details && <p className="text-xs text-[var(--color-muted)]">{r.details}</p>}
              <div className="mt-2 flex gap-2">
                <button onClick={() => act(r.id, "hide_content")} className="btn btn-outline !py-1 text-xs">Hide Content</button>
                <button onClick={() => act(r.id, "remove_content")} className="btn btn-outline !py-1 text-xs text-[var(--color-danger)]">Remove Content</button>
                <button onClick={() => act(r.id, "dismiss")} className="btn btn-outline !py-1 text-xs">Dismiss</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card-surface p-5">
        <h2 className="font-display font-semibold">Actions History</h2>
        <div className="mt-3 space-y-2">
          {resolved.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-lg bg-[var(--color-bg)] p-3 text-xs">
              <span>{r.targetType} #{r.targetId} — {r.reason}</span>
              <span className="badge badge-normal capitalize">{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
