"use client";

import { useEffect, useState } from "react";

type Group = { id: number; name: string; slug: string; category: string; visibility: string };

export default function AdminCommunityPage() {
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [form, setForm] = useState({ name: "", description: "", category: "community", visibility: "school_only" });
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/community/groups");
    const data = await res.json();
    setGroups(data.groups || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/community/groups", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load groups");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setGroups(data.groups || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setGroups([]);
      });
    return () => controller.abort();
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/community/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setMessage("Group created successfully.");
      setForm({ name: "", description: "", category: "community", visibility: "school_only" });
      load();
    } else {
      const data = await res.json();
      setMessage(data.error || "Something went wrong.");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Community Groups</h1>

      <form onSubmit={createGroup} className="card-surface grid gap-3 p-5 sm:grid-cols-2">
        <input required placeholder="Group name (e.g. Science Club)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm sm:col-span-2" />
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm sm:col-span-2" />
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
          {["academic", "student-life", "clubs", "sports", "alumni", "parents", "community", "suggestions", "school-development"].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
          {["public", "school_only", "approved_members", "private"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        {message && <p className="text-sm text-[var(--color-muted)] sm:col-span-2">{message}</p>}
        <button className="btn btn-primary sm:col-span-2">Create Group</button>
      </form>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
              <th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Visibility</th>
            </tr>
          </thead>
          <tbody>
            {groups === null && <tr><td className="p-4" colSpan={3}>Loading…</td></tr>}
            {groups?.length === 0 && <tr><td className="p-4 text-[var(--color-muted)]" colSpan={3}>No groups yet.</td></tr>}
            {groups?.map((g) => (
              <tr key={g.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3">{g.name}</td>
                <td className="px-4 py-3 capitalize">{g.category}</td>
                <td className="px-4 py-3 capitalize">{g.visibility.replace(/_/g, " ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
