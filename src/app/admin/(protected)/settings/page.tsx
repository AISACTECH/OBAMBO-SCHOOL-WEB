"use client";

import { useEffect, useState } from "react";

type Settings = {
  schoolName: string;
  motto: string | null;
  vision: string | null;
  mission: string | null;
  coreValues: string | null;
  history: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  mapEmbedUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/settings", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load settings");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setSettings(data.settings);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMessage("Could not load school settings.");
      });
    return () => controller.abort();
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json().catch(() => ({}));
    setMessage(res.ok ? "Settings saved successfully." : data.error || "Could not save settings.");
  }

  function update(field: keyof Settings, value: string) {
    setSettings((current) => current ? { ...current, [field]: value } : current);
  }

  if (!settings) return <div className="skeleton h-96 w-full" />;

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">School Settings</h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Update verified school identity, contact details and theme colours.</p>
      {message && <p className="mt-4 rounded-lg bg-[var(--color-bg)] p-3 text-sm">{message}</p>}
      <form onSubmit={save} className="card-surface mt-5 grid gap-4 p-5 sm:grid-cols-2">
        <Field label="School name" value={settings.schoolName} onChange={(value) => update("schoolName", value)} />
        <Field label="Phone" value={settings.phone || ""} onChange={(value) => update("phone", value)} />
        <Field label="Email" type="email" value={settings.email || ""} onChange={(value) => update("email", value)} />
        <Field label="Address" value={settings.address || ""} onChange={(value) => update("address", value)} />
        <Field label="Map embed URL" value={settings.mapEmbedUrl || ""} onChange={(value) => update("mapEmbedUrl", value)} />
        <Field label="Motto" value={settings.motto || ""} onChange={(value) => update("motto", value)} />
        <TextArea label="Vision" value={settings.vision || ""} onChange={(value) => update("vision", value)} />
        <TextArea label="Mission" value={settings.mission || ""} onChange={(value) => update("mission", value)} />
        <TextArea label="Core values" value={settings.coreValues || ""} onChange={(value) => update("coreValues", value)} />
        <TextArea label="History" value={settings.history || ""} onChange={(value) => update("history", value)} />
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase text-[var(--color-muted)]">Theme colours</p>
          <div className="mt-2 flex flex-wrap gap-4">
            {(["primaryColor", "secondaryColor", "accentColor"] as const).map((field) => (
              <label key={field} className="flex items-center gap-2 text-sm capitalize">
                <input type="color" value={settings[field]} onChange={(event) => update(field, event.target.value)} />
                {field.replace("Color", "")}
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primary sm:col-span-2">Save Settings</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-normal" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium sm:col-span-2">
      {label}
      <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-normal" />
    </label>
  );
}
