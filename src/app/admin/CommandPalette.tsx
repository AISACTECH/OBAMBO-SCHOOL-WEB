"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ACTIONS = [
  { label: "New Announcement", href: "/admin/announcements" },
  { label: "Publish News", href: "/admin/news" },
  { label: "Upload Learning Resource", href: "/admin/resources" },
  { label: "Import Results", href: "/admin/results" },
  { label: "Create Event", href: "/admin/events" },
  { label: "Add Alumni Story", href: "/admin/alumni" },
  { label: "Moderate Community", href: "/admin/moderation" },
  { label: "View Reports", href: "/admin/moderation" },
  { label: "Manage Students", href: "/admin/students" },
  { label: "School Settings", href: "/admin/settings" },
  { label: "Audit Logs", href: "/admin/audit-logs" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  const filtered = ACTIONS.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] grid place-items-start justify-center bg-black/40 pt-24" onClick={() => setOpen(false)}>
      <div className="card-surface w-full max-w-lg p-3" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command… e.g. 'Create announcement'"
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm"
        />
        <div className="mt-2 max-h-72 space-y-1 overflow-y-auto">
          {filtered.map((a) => (
            <button
              key={a.label}
              onClick={() => { setOpen(false); setQuery(""); router.push(a.href); }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--color-bg)]"
            >
              {a.label}
            </button>
          ))}
          {filtered.length === 0 && <p className="p-3 text-sm text-[var(--color-muted)]">No matching actions.</p>}
        </div>
      </div>
    </div>
  );
}
