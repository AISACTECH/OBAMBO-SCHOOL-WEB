"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Notification = { id: number; title: string; body: string; link: string; read: boolean; createdAt: string };

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setItems(data.notifications || []);
  }

  useEffect(() => {
    const refresh = () => {
      void fetch("/api/notifications")
        .then(async (res) => {
          if (!res.ok) throw new Error("Could not load notifications");
          return res.json();
        })
        .then((data) => setItems(data.notifications || []))
        .catch(() => setItems([]));
    };

    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAll: true }) });
    load();
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="relative grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border)]" aria-label="Notifications">
        🔔
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] card-surface p-3 shadow-xl">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-semibold">Notifications</p>
            <button onClick={markAllRead} className="text-xs font-medium text-[var(--color-primary)]">Mark all read</button>
          </div>
          <div className="mt-2 max-h-80 space-y-1 overflow-y-auto">
            {items.length === 0 && <p className="p-3 text-xs text-[var(--color-muted)]">You&apos;re all caught up.</p>}
            {items.map((n) => (
              <Link
                key={n.id}
                href={n.link || "#"}
                onClick={() => setOpen(false)}
                className={`block rounded-lg p-2 text-xs ${n.read ? "text-[var(--color-muted)]" : "bg-[var(--color-bg)] font-medium"}`}
              >
                <p className="line-clamp-1">{n.title}</p>
                <p className="text-[10px] text-[var(--color-muted)]">{new Date(n.createdAt).toLocaleDateString("en-KE")}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
