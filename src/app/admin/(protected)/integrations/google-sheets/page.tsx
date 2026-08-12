"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Connection = {
  id: number;
  googleAccountEmail: string | null;
  spreadsheetId: string;
  spreadsheetName: string | null;
  worksheetTitle: string;
  dataRange: string;
  status: string;
  lastSyncAt: string | null;
  lastError: string | null;
};

type Status = { enabled: boolean; configured: boolean; connection: Connection | null };
type Preview = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errorReport: { row: number; field: string; value: string; error: string; suggestedFix: string }[];
  data: Record<string, unknown>[];
};

export default function GoogleSheetsPlayground() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [worksheetTitle, setWorksheetTitle] = useState("Performance");
  const [dataRange, setDataRange] = useState("A1:M");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/google-sheets/status", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load Google Sheets status");
        return response.json();
      })
      .then((data: Status) => {
        if (!controller.signal.aborted) {
          setStatus(data);
          if (data.connection) {
            setWorksheetTitle(data.connection.worksheetTitle);
            setDataRange(data.connection.dataRange);
          }
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setMessage("Could not load the Google Sheets integration status.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const error = searchParams.get("error");
      if (error) setMessage(error);
      if (searchParams.get("connected")) setMessage("Google account connected. Configure the Performance worksheet below.");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  async function connectGoogle() {
    setBusy(true);
    const response = await fetch("/api/admin/google-sheets/connect");
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.url) window.location.assign(data.url);
    else {
      setMessage(data.error || "Could not start Google authorization.");
      setBusy(false);
    }
  }

  async function configureSheet(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/google-sheets/configure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spreadsheetUrl, worksheetTitle, dataRange }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.ok) {
      setStatus((current) => current ? { ...current, connection: data.connection } : current);
      setMessage("Spreadsheet configured successfully. Run a preview before publishing anything.");
    } else setMessage(data.error || "Could not configure the spreadsheet.");
  }

  async function previewSheet() {
    setBusy(true);
    const response = await fetch("/api/admin/google-sheets/preview", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.ok) setPreview(data);
    else setMessage(data.error || "Could not preview the spreadsheet.");
  }

  async function syncSheet() {
    if (!preview || preview.validRows === 0) return;
    if (!window.confirm("Publish the valid rows to the student portal? Existing matching results will be updated and this operation will be recorded for rollback.")) return;
    setBusy(true);
    const response = await fetch("/api/admin/google-sheets/sync", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.ok) {
      setMessage(`Published ${data.imported} rows: ${data.inserted} new, ${data.updated} updated, ${data.unchanged} unchanged.`);
      setPreview(data.preview);
      refreshStatus();
    } else setMessage(data.error || "The spreadsheet sync failed.");
  }

  async function disconnect() {
    if (!window.confirm("Disconnect Google Sheets? Existing published results will remain in the database.")) return;
    setBusy(true);
    const response = await fetch("/api/admin/google-sheets/disconnect", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (response.ok) {
      setStatus((current) => current ? { ...current, connection: null } : current);
      setPreview(null);
      setMessage("Google Sheets disconnected. Existing results were not deleted.");
    } else setMessage(data.error || "Could not disconnect Google Sheets.");
  }

  async function refreshStatus() {
    const response = await fetch("/api/admin/google-sheets/status");
    if (response.ok) setStatus(await response.json());
  }

  const connection = status?.connection;
  const canConfigure = Boolean(connection && ["authorized", "configured", "error"].includes(connection.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Google Sheets Playground</h1>
        <p className="mt-1 max-w-3xl text-sm text-[var(--color-muted)]">Connect the official school Performance worksheet, preview validation results, then approve a transactional sync into the student portal. Existing results are never deleted when the connection is removed.</p>
      </div>

      {message && <p className="rounded-lg bg-[var(--color-bg)] p-3 text-sm">{message}</p>}
      {status && !status.enabled && <p className="rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-sm">This feature is installed but disabled. Set GOOGLE_SHEETS_SYNC_ENABLED=true on the server when Google OAuth credentials are ready.</p>}

      <section className="card-surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold">1. Connect Google</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">Only the server stores encrypted refresh credentials. They are never sent to the browser.</p>
          </div>
          <button onClick={connectGoogle} disabled={busy || !status?.enabled || !status?.configured} className="btn btn-primary">{connection?.googleAccountEmail ? "Reconnect Google" : "Connect Google"}</button>
        </div>
        {connection?.googleAccountEmail && <p className="text-sm">Connected account: <strong>{connection.googleAccountEmail}</strong> · Status: <span className="badge badge-normal capitalize">{connection.status.replace(/_/g, " ")}</span></p>}
      </section>

      <section className="card-surface space-y-4 p-5">
        <div>
          <h2 className="font-display font-semibold">2. Configure the Performance worksheet</h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">Required headers: Admission Number, Term, Year, Exam, Subject, Marks and Grade. Student Name, Form, Stream, Points and Comment are supported optional columns.</p>
        </div>
        <form onSubmit={configureSheet} className="grid gap-3 sm:grid-cols-2">
          <input required value={spreadsheetUrl} onChange={(event) => setSpreadsheetUrl(event.target.value)} placeholder="Google Sheets URL or spreadsheet ID" disabled={!canConfigure || busy} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm sm:col-span-2" />
          <input required value={worksheetTitle} onChange={(event) => setWorksheetTitle(event.target.value)} placeholder="Worksheet title" disabled={!canConfigure || busy} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input required value={dataRange} onChange={(event) => setDataRange(event.target.value)} placeholder="A1:M" disabled={!canConfigure || busy} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <button disabled={!canConfigure || busy} className="btn btn-outline sm:col-span-2">Verify and Save Worksheet</button>
        </form>
        {connection?.spreadsheetName && <p className="text-xs text-[var(--color-muted)]">Configured: {connection.spreadsheetName} · {connection.worksheetTitle} · {connection.dataRange}</p>}
      </section>

      <section className="card-surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-semibold">3. Preview and publish</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">Preview is read-only. Publishing writes only validated rows and creates an audit/rollback record.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={previewSheet} disabled={busy || !connection?.spreadsheetId} className="btn btn-outline">Preview Sheet</button>
            <button onClick={syncSheet} disabled={busy || !preview || preview.validRows === 0} className="btn btn-primary">Approve and Sync</button>
          </div>
        </div>
        {preview && (
          <>
            <div className="grid gap-3 sm:grid-cols-4">
              <Metric label="Rows" value={preview.totalRows} />
              <Metric label="Valid" value={preview.validRows} />
              <Metric label="Invalid" value={preview.invalidRows} />
              <Metric label="Ready" value={preview.validRows > 0 ? "Yes" : "No"} />
            </div>
            {preview.errorReport.length > 0 && <div className="max-h-72 overflow-auto rounded-lg border border-[var(--color-border)]"><table className="w-full text-left text-xs"><thead><tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]"><th className="p-2">Row</th><th className="p-2">Field</th><th className="p-2">Error</th><th className="p-2">Fix</th></tr></thead><tbody>{preview.errorReport.map((item, index) => <tr key={`${item.row}-${item.field}-${index}`} className="border-b border-[var(--color-border)]"><td className="p-2">{item.row}</td><td className="p-2">{item.field}</td><td className="p-2 text-[var(--color-danger)]">{item.error}</td><td className="p-2">{item.suggestedFix}</td></tr>)}</tbody></table></div>}
          </>
        )}
      </section>

      <section className="card-surface flex flex-wrap items-center justify-between gap-3 p-5">
        <div><h2 className="font-display font-semibold">Connection safety</h2><p className="mt-1 text-xs text-[var(--color-muted)]">Disconnecting stops future reads. It does not delete student results already published.</p></div>
        <button onClick={disconnect} disabled={busy || !connection} className="btn btn-outline text-[var(--color-danger)]">Disconnect Google Sheets</button>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-lg bg-[var(--color-bg)] p-3"><p className="text-xl font-bold text-[var(--color-primary)]">{value}</p><p className="text-xs text-[var(--color-muted)]">{label}</p></div>;
}
