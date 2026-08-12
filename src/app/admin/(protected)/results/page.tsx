"use client";

import { useEffect, useState } from "react";

type PreviewData = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errorReport: { row: number; field: string; value: string; error: string; suggestedFix: string }[];
  data: Record<string, unknown>[];
  sourceUrl: string;
};

type ImportRecord = { id: number; source: string; importedByName: string; totalRows: number; validRows: number; invalidRows: number; status: string; rolledBack: boolean; createdAt: string };

export default function AdminResultsPage() {
  const [sourceUrl, setSourceUrl] = useState("");
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [message, setMessage] = useState("");

  async function loadHistory() {
    const res = await fetch("/api/admin/results-import");
    const data = await res.json();
    setImports(data.imports || []);
  }

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/admin/results-import", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not load import history");
        return res.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setImports(data.imports || []);
      })
      .catch(() => {
        if (!controller.signal.aborted) setImports([]);
      });
    return () => controller.abort();
  }, []);

  async function runPreview(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPreview(null);
    const res = await fetch("/api/admin/results-import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUrl }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) setError(data.error);
    else setPreview(data);
  }

  async function commit() {
    if (!preview) return;
    const res = await fetch("/api/admin/results-import/commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(preview),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(`Imported ${data.imported} result records. Students have been notified.`);
      setPreview(null);
      setSourceUrl("");
      loadHistory();
    } else {
      setError(data.error);
    }
  }

  async function rollback(id: number) {
    if (!confirm("Roll back this import? All records from this import will be removed.")) return;
    const res = await fetch(`/api/admin/results-import/${id}/rollback`, { method: "POST" });
    if (res.ok) loadHistory();
  }

  function downloadTemplate() {
    const headers = ["Admission Number", "Student Name", "Form", "Term", "Year", "Exam", "Subject", "Marks", "Grade", "Points", "Comment"];
    const sample = ["DEMO-0001", "Demo Student", "Form 3", "Term 2", "2025", "Term 2 Mid-Term Examination", "Mathematics", "72", "B", "9", "Good improvement."];
    const csv = [headers.join(","), sample.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "results-import-template.csv";
    a.click();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Results Import — Google Sheets Engine</h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Publish your results spreadsheet to the web (File → Share → Publish to web → CSV) in Google Sheets, then paste the
          sheet link below. No API keys or credentials are required or transmitted from the browser.
        </p>
      </div>

      <div className="card-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-semibold">1. Prepare Your Spreadsheet</h2>
          <button onClick={downloadTemplate} className="btn btn-outline !py-1.5 text-xs">Download CSV Template</button>
        </div>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Expected columns: Admission Number, Student Name, Form, Term, Year, Exam, Subject, Marks, Grade, Points, Comment.</p>
      </div>

      <form onSubmit={runPreview} className="card-surface space-y-3 p-5">
        <h2 className="font-display font-semibold">2. Connect &amp; Preview</h2>
        <input required value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Paste Google Sheet link (shared/published to web)" className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
        <button className="btn btn-primary" disabled={loading}>{loading ? "Validating…" : "Preview & Validate"}</button>
      </form>

      {preview && (
        <div className="card-surface space-y-4 p-5">
          <h2 className="font-display font-semibold">3. Review Before Publishing</h2>
          <p className="text-sm">
            <strong>{preview.totalRows}</strong> records detected. <strong className="text-[var(--color-success)]">{preview.validRows}</strong> valid. <strong className="text-[var(--color-danger)]">{preview.invalidRows}</strong> require correction.
          </p>

          {preview.errorReport.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)] uppercase text-[var(--color-muted)]">
                    <th className="px-3 py-2">Row</th><th className="px-3 py-2">Field</th><th className="px-3 py-2">Value</th><th className="px-3 py-2">Error</th><th className="px-3 py-2">Suggested Fix</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.errorReport.map((e, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="px-3 py-2">{e.row}</td><td className="px-3 py-2">{e.field}</td><td className="px-3 py-2">{e.value}</td><td className="px-3 py-2 text-[var(--color-danger)]">{e.error}</td><td className="px-3 py-2">{e.suggestedFix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button onClick={commit} disabled={preview.validRows === 0} className="btn btn-primary">
              Import {preview.validRows} Valid Record{preview.validRows === 1 ? "" : "s"} & Publish
            </button>
            <button
              onClick={() => {
                const rows = preview.errorReport.map((e) => `${e.row},${e.field},${e.value},${e.error},${e.suggestedFix}`).join("\n");
                const blob = new Blob([`Row,Field,Value,Error,Suggested Fix\n${rows}`], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "results-import-errors.csv"; a.click();
              }}
              className="btn btn-outline"
              disabled={preview.errorReport.length === 0}
            >
              Download Error Report
            </button>
          </div>
          <p className="text-xs text-[var(--color-muted)]">Invalid rows will be skipped and are never published automatically.</p>
        </div>
      )}

      {message && <p className="rounded-lg bg-[var(--color-bg)] p-3 text-sm text-[var(--color-success)]">{message}</p>}

      <div className="card-surface p-5">
        <h2 className="font-display font-semibold">Import History</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
                <th className="px-3 py-2">Date</th><th className="px-3 py-2">By</th><th className="px-3 py-2">Valid</th><th className="px-3 py-2">Invalid</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {imports.length === 0 && <tr><td className="px-3 py-3 text-[var(--color-muted)]" colSpan={6}>No imports yet.</td></tr>}
              {imports.map((imp) => (
                <tr key={imp.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-3 py-2">{new Date(imp.createdAt).toLocaleString("en-KE")}</td>
                  <td className="px-3 py-2">{imp.importedByName}</td>
                  <td className="px-3 py-2">{imp.validRows}</td>
                  <td className="px-3 py-2">{imp.invalidRows}</td>
                  <td className="px-3 py-2"><span className="badge badge-normal">{imp.status}</span></td>
                  <td className="px-3 py-2">
                    {!imp.rolledBack && <button onClick={() => rollback(imp.id)} className="text-xs font-semibold text-[var(--color-danger)]">Rollback</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
