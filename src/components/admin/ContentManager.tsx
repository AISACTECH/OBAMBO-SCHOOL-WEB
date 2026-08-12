"use client";

import { useEffect, useState } from "react";

export type FieldDef = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox" | "date" | "file";
  options?: string[];
  uploadCategory?: string;
  accept?: string;
};

type Item = Record<string, unknown>;

export default function ContentManager({
  table,
  title,
  fields,
  columns,
}: {
  table: string;
  title: string;
  fields: FieldDef[];
  columns: string[];
}) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [editing, setEditing] = useState<Item | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  async function load() {
    const res = await fetch(`/api/admin/content/${table}`);
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/admin/content/${table}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load content");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setItems(data.items || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setItems([]);
      });
    return () => controller.abort();
  }, [table]);

  function startCreate() {
    const blank: Item = {};
    fields.forEach((f) => {
      blank[f.name] = f.type === "checkbox" ? false : f.type === "select" ? f.options?.[0] || "" : "";
    });
    setEditing(blank);
    setShowForm(true);
  }

  function startEdit(item: Item) {
    setEditing({ ...item });
    setShowForm(true);
  }

  async function save() {
    if (!editing) return;
    const isNew = !editing.id;
    const payload: Item = { ...editing };
    fields.filter((field) => field.type === "date").forEach((field) => {
      const value = payload[field.name];
      if (typeof value === "string" && value) payload[field.name] = new Date(value).toISOString();
    });
    const url = isNew ? `/api/admin/content/${table}` : `/api/admin/content/${table}/${editing.id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setMessage(isNew ? "Created successfully." : "Updated successfully.");
      setShowForm(false);
      setEditing(null);
      load();
      setTimeout(() => setMessage(""), 2500);
    } else {
      const data = await res.json().catch(() => ({}));
      setMessage(data.error || "Something went wrong.");
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    await fetch(`/api/admin/content/${table}/${id}`, { method: "DELETE" });
    load();
  }

  async function uploadFile(field: FieldDef, file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("category", field.uploadCategory || table);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (res.ok && editing) {
      setEditing({ ...editing, [field.name]: data.url, ...(field.name === "fileUrl" ? { fileType: data.fileType, fileSize: data.fileSize } : {}) });
    } else {
      alert(data.error || "Upload failed.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">{title}</h1>
        <button onClick={startCreate} className="btn btn-primary">+ Add New</button>
      </div>
      {message && <p className="mt-3 rounded-lg bg-[var(--color-bg)] p-2 text-sm">{message}</p>}

      {showForm && editing && (
        <div className="card-surface mt-4 space-y-3 p-5">
          <h2 className="font-display font-semibold">{editing.id ? "Edit" : "Create"} {title}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.name} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className="text-xs font-semibold uppercase text-[var(--color-muted)]">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea rows={4} value={String(editing[f.name] ?? "")} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
                ) : f.type === "select" ? (
                  <select value={String(editing[f.name] ?? "")} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
                    {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "checkbox" ? (
                  <div className="mt-2"><input type="checkbox" checked={Boolean(editing[f.name])} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.checked })} /></div>
                ) : f.type === "file" ? (
                  <div className="mt-1 space-y-1">
                    <input type="file" accept={f.accept} onChange={(e) => e.target.files?.[0] && uploadFile(f, e.target.files[0])} className="text-xs" />
                    {typeof editing[f.name] === "string" && editing[f.name] ? <p className="truncate text-[10px] text-[var(--color-muted)]">{String(editing[f.name])}</p> : null}
                    {uploading && <p className="text-[10px] text-[var(--color-muted)]">Uploading…</p>}
                  </div>
                ) : f.type === "number" ? (
                  <input type="number" value={String(editing[f.name] ?? "")} onChange={(e) => setEditing({ ...editing, [f.name]: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
                ) : f.type === "date" ? (
                  <input type="datetime-local" value={toDateTimeLocal(editing[f.name])} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
                ) : (
                  <input value={String(editing[f.name] ?? "")} onChange={(e) => setEditing({ ...editing, [f.name]: e.target.value })} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={save} className="btn btn-primary">Save</button>
            <button onClick={() => { setShowForm(false); setEditing(null); }} className="btn btn-outline">Cancel</button>
          </div>
        </div>
      )}

      <div className="card-surface mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
              {columns.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items === null && <tr><td className="p-4" colSpan={columns.length + 1}>Loading…</td></tr>}
            {items?.length === 0 && <tr><td className="p-4 text-[var(--color-muted)]" colSpan={columns.length + 1}>No records yet. Use &quot;Add New&quot; to create the first one.</td></tr>}
            {items?.map((item) => (
              <tr key={String(item.id)} className="border-b border-[var(--color-border)] last:border-0">
                {columns.map((c) => (
                  <td key={c} className="max-w-[220px] truncate px-4 py-3">{formatCell(item[c])}</td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(item)} className="text-xs font-semibold text-[var(--color-primary)]">Edit</button>
                    <button onClick={() => remove(Number(item.id))} className="text-xs font-semibold text-[var(--color-danger)]">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function toDateTimeLocal(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatCell(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString();
  if (typeof value === "string" && value.length > 60) return value.slice(0, 60) + "…";
  return String(value);
}
