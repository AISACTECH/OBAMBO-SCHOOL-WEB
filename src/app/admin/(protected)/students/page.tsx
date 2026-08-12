"use client";

import { useEffect, useState } from "react";

type Student = { id: number; admissionNumber: string; name: string; form: string; stream: string; status: string; admittedYear: number };

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[] | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ admissionNumber: "", name: "", form_: "Form 1", stream: "", password: "", birthCertificateNumber: "" });
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/students");
    const data = await res.json();
    setStudents(data.students || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/students", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load students");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setStudents(data.students || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setStudents([]);
      });
    return () => controller.abort();
  }, []);

  async function createStudent(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ admissionNumber: form.admissionNumber, name: form.name, form: form.form_, stream: form.stream, password: form.password, birthCertificateNumber: form.birthCertificateNumber }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ admissionNumber: "", name: "", form_: "Form 1", stream: "", password: "", birthCertificateNumber: "" });
      load();
    } else {
      const data = await res.json();
      setError(data.error);
    }
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/admin/students/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    load();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-display text-2xl font-bold">Students</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn btn-primary">+ Add Student</button>
      </div>

      {showForm && (
        <form onSubmit={createStudent} className="card-surface mt-4 grid gap-3 p-5 sm:grid-cols-2">
          <input required placeholder="Admission Number" value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input required placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <select value={form.form_} onChange={(e) => setForm({ ...form, form_: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm">
            {["Form 1", "Form 2", "Form 3", "Form 4"].map((f) => <option key={f}>{f}</option>)}
          </select>
          <input placeholder="Stream (optional)" value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input required type="password" placeholder="Temporary Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input required placeholder="Birth Certificate Number" value={form.birthCertificateNumber} onChange={(e) => setForm({ ...form, birthCertificateNumber: e.target.value })} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          {error && <p className="text-sm text-[var(--color-danger)] sm:col-span-2">{error}</p>}
          <button className="btn btn-primary sm:col-span-2">Create Student Account</button>
        </form>
      )}

      <div className="card-surface mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
              <th className="px-4 py-3">Admission No.</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Form</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students === null && <tr><td className="p-4" colSpan={5}>Loading…</td></tr>}
            {students?.map((s) => (
              <tr key={s.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-4 py-3">{s.admissionNumber}</td>
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3">{s.form}</td>
                <td className="px-4 py-3"><span className="badge badge-normal capitalize">{s.status}</span></td>
                <td className="px-4 py-3">
                  {s.status === "active" ? (
                    <button onClick={() => updateStatus(s.id, "suspended")} className="text-xs font-semibold text-[var(--color-danger)]">Suspend</button>
                  ) : (
                    <button onClick={() => updateStatus(s.id, "active")} className="text-xs font-semibold text-[var(--color-success)]">Reactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
