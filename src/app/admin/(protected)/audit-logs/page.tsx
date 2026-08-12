"use client";

import { useEffect, useState } from "react";

type AuditLog = {
  id: number;
  actorType: string;
  actorName: string;
  action: string;
  targetType: string | null;
  targetId: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/audit-logs", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load audit logs");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setLogs(data.logs || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setLogs([]);
      });
    return () => controller.abort();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Audit Logs</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Recent authentication, content and administration activity.</p>
      <div className="card-surface mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
              <th className="px-4 py-3">When</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">IP</th><th className="px-4 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs === null && <tr><td className="p-4" colSpan={6}>Loading…</td></tr>}
            {logs?.length === 0 && <tr><td className="p-4 text-[var(--color-muted)]" colSpan={6}>No audit activity yet.</td></tr>}
            {logs?.map((log) => (
              <tr key={log.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="whitespace-nowrap px-4 py-3 text-xs">{new Date(log.createdAt).toLocaleString("en-KE")}</td>
                <td className="px-4 py-3">{log.actorName} <span className="text-xs text-[var(--color-muted)]">({log.actorType})</span></td>
                <td className="px-4 py-3 font-medium">{log.action}</td>
                <td className="px-4 py-3">{log.targetType || "—"}{log.targetId ? ` #${log.targetId}` : ""}</td>
                <td className="px-4 py-3 text-xs">{log.ipAddress || "—"}</td>
                <td className="max-w-[240px] truncate px-4 py-3 text-xs">{log.details ? JSON.stringify(log.details) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
