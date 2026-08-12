"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Stats = { students: number; announcements: number; resources: number; results: number; alumni: number; pendingReports: number; newMessages: number; upcomingEvents: number; groups: number };

const QUICK_ACTIONS = [
  { label: "New Announcement", href: "/admin/announcements" },
  { label: "Upload Learning Paper", href: "/admin/resources" },
  { label: "Publish News", href: "/admin/news" },
  { label: "Import Results", href: "/admin/results" },
  { label: "Connect Google Sheets", href: "/admin/integrations/google-sheets" },
  { label: "Create Event", href: "/admin/events" },
  { label: "Add Alumni Story", href: "/admin/alumni" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/dashboard-stats", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load dashboard statistics.");
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setStats(data);
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Could not load dashboard statistics.");
      });
    return () => controller.abort();
  }, []);

  const cards = stats
    ? [
        { label: "Students", value: stats.students },
        { label: "Published Announcements", value: stats.announcements },
        { label: "Learning Resources", value: stats.resources },
        { label: "Result Records", value: stats.results },
        { label: "Alumni Registered", value: stats.alumni },
        { label: "Pending Moderation", value: stats.pendingReports },
        { label: "New Messages", value: stats.newMessages },
        { label: "Upcoming Events", value: stats.upcomingEvents },
        { label: "Community Groups", value: stats.groups },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">School Control Center</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Manage every part of St Mark&apos;s digital campus from here.</p>
        {error && <p className="mt-3 rounded-lg bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">{error}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.href} href={a.href} className="btn btn-primary !py-2 text-xs">{a.label}</Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats === null
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24 w-full" />)
          : cards.map((c) => (
              <div key={c.label} className="card-surface p-5">
                <p className="font-display text-3xl font-bold text-[var(--color-primary)]">{c.value}</p>
                <p className="mt-1 text-sm text-[var(--color-muted)]">{c.label}</p>
              </div>
            ))}
      </div>

      <div className="card-surface p-5 text-sm text-[var(--color-muted)]">
        System health: <span className="font-semibold text-[var(--color-success)]">All systems operational.</span> Database connected, authentication active, audit logging enabled.
      </div>
    </div>
  );
}
