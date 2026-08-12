"use client";

import { useEffect, useState } from "react";
import ContentManager from "@/components/admin/ContentManager";

type AlumniRecord = { id: number; name: string; email: string; graduationYear: number; verified: boolean; active: boolean };

export default function AdminAlumniPage() {
  const [alumni, setAlumni] = useState<AlumniRecord[] | null>(null);

  async function load() {
    const res = await fetch("/api/admin/alumni");
    const data = await res.json();
    setAlumni(data.alumni || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/alumni", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load alumni");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setAlumni(data.alumni || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setAlumni([]);
      });
    return () => controller.abort();
  }, []);

  async function setVerified(id: number, verified: boolean) {
    await fetch(`/api/admin/alumni/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ verified }) });
    load();
  }

  async function setActive(id: number, active: boolean) {
    await fetch(`/api/admin/alumni/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Alumni Verification</h1>
        <div className="card-surface mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
                <th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alumni === null && <tr><td className="p-4" colSpan={5}>Loading…</td></tr>}
              {alumni?.length === 0 && <tr><td className="p-4 text-[var(--color-muted)]" colSpan={5}>No alumni have registered yet.</td></tr>}
              {alumni?.map((a) => (
                <tr key={a.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3">{a.name}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">{a.graduationYear || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${a.verified ? "badge-normal" : "badge-important"}`}>{a.verified ? "Verified" : "Pending"}</span>
                    {!a.active && <span className="badge badge-emergency ml-1">Suspended</span>}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    {!a.verified && <button onClick={() => setVerified(a.id, true)} className="text-xs font-semibold text-[var(--color-success)]">Verify</button>}
                    {a.active ? (
                      <button onClick={() => setActive(a.id, false)} className="text-xs font-semibold text-[var(--color-danger)]">Suspend</button>
                    ) : (
                      <button onClick={() => setActive(a.id, true)} className="text-xs font-semibold text-[var(--color-success)]">Reactivate</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ContentManager
        table="alumni-stories"
        title="Alumni Success Stories"
        columns={["name", "graduationYear", "title", "published"]}
        fields={[
          { name: "name", label: "Alumni Name", type: "text" },
          { name: "graduationYear", label: "Graduation Year", type: "number" },
          { name: "photoUrl", label: "Photo", type: "file", uploadCategory: "alumni", accept: "image/*" },
          { name: "title", label: "Story Title", type: "text" },
          { name: "currentRole", label: "Current Role", type: "text" },
          { name: "journey", label: "Journey", type: "textarea" },
          { name: "quote", label: "Quote", type: "text" },
          { name: "published", label: "Published", type: "checkbox" },
        ]}
      />
    </div>
  );
}
