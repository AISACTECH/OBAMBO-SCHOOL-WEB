"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = { id: number; title: string; body: string; link: string; read: boolean; createdAt: string; type: string };

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[] | null>(null);

  async function load() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.notifications || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/notifications", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load notifications");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setItems(data.notifications || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      });
    return () => controller.abort();
  }, []);

  async function markAll() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Notifications</h1>
        <button onClick={markAll} className="btn btn-outline">Mark all read</button>
      </div>
      <div className="mt-6 space-y-2">
        {items === null && <div className="skeleton h-24 w-full" />}
        {items?.length === 0 && <p className="text-sm text-[var(--color-muted)]">You&apos;re all caught up.</p>}
        {items?.map((n) => (
          <Link key={n.id} href={n.link || "#"} className={`card-surface block p-4 ${n.read ? "" : "border-[var(--color-primary)]"}`}>
            <div className="flex items-center justify-between">
              <p className="font-medium">{n.title}</p>
              <span className="badge badge-normal capitalize">{n.type.replace(/-/g, " ")}</span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{n.body}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{new Date(n.createdAt).toLocaleString("en-KE")}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
