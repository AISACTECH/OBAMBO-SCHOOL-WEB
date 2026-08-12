"use client";

import { useEffect, useState } from "react";
import { SubjectBarChart, TrendLineChart } from "@/components/portal/PerformanceChart";

type ExamResult = {
  examName: string;
  term: string;
  year: number;
  subjects: { subject: string; marks: number; grade: string; points: number; comment: string }[];
  averageMarks: number;
  totalPoints: number;
};

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function ResultsPage() {
  const [exams, setExams] = useState<ExamResult[] | null>(null);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/student/results", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load your results.");
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setExams(data.exams || []);
      })
      .catch((caught: unknown) => {
        if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : "Could not load your results.");
      });
    return () => controller.abort();
  }, []);

  if (error) return <div className="card-surface p-8 text-center text-sm text-[var(--color-danger)]">{error}</div>;

  if (exams === null) {
    return <div className="skeleton h-64 w-full" />;
  }

  if (exams.length === 0) {
    return (
      <div className="card-surface p-8 text-center text-sm text-[var(--color-muted)]">
        Your results will appear here once published by the examination office.
      </div>
    );
  }

  const current = exams[active];
  const trend = exams
    .slice()
    .reverse()
    .map((e) => ({ label: `${e.term} ${e.year}`, value: e.averageMarks }));

  function downloadReport() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Academic Report</title></head>
      <body style="font-family: sans-serif; padding: 40px;">
        <h1>St Mark's Secondary School – Obambo</h1>
        <h2>Academic Report — ${escapeHtml(current.examName)} (${escapeHtml(current.term)} ${escapeHtml(current.year)})</h2>
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%;">
          <tr><th>Subject</th><th>Marks</th><th>Grade</th><th>Points</th><th>Comment</th></tr>
          ${current.subjects.map((s) => `<tr><td>${escapeHtml(s.subject)}</td><td>${escapeHtml(s.marks)}</td><td>${escapeHtml(s.grade)}</td><td>${escapeHtml(s.points)}</td><td>${escapeHtml(s.comment)}</td></tr>`).join("")}
        </table>
        <p><strong>Average Marks:</strong> ${escapeHtml(current.averageMarks)}% &nbsp; <strong>Total Points:</strong> ${escapeHtml(current.totalPoints)}</p>
        <script>window.print()</script>
      </body></html>
    `);
    win.document.close();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">My Results</h1>
        <button onClick={downloadReport} className="btn btn-primary">Download PDF Academic Report</button>
      </div>

      <div className="scrollbar-thin flex gap-2 overflow-x-auto">
        {exams.map((e, i) => (
          <button key={i} onClick={() => setActive(i)} className={`btn !py-1.5 text-xs ${active === i ? "btn-primary" : "btn-outline"}`}>
            {e.examName} · {e.term} {e.year}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="font-display font-semibold">Subject Performance</h2>
          <div className="mt-4">
            <SubjectBarChart data={current.subjects.map((s) => ({ subject: s.subject, marks: s.marks }))} />
          </div>
        </div>
        <div className="card-surface p-5">
          <h2 className="font-display font-semibold">Summary</h2>
          <p className="mt-3 text-3xl font-bold text-[var(--color-primary)]">{current.averageMarks}%</p>
          <p className="text-xs text-[var(--color-muted)]">Average marks</p>
          <p className="mt-3 text-xl font-semibold">{current.totalPoints} pts</p>
          <p className="text-xs text-[var(--color-muted)]">Total points</p>
        </div>
      </div>

      <div className="card-surface p-5">
        <h2 className="font-display font-semibold">Performance Over Time</h2>
        <div className="mt-4">
          <TrendLineChart points={trend} />
        </div>
      </div>

      <div className="card-surface overflow-x-auto p-5">
        <h2 className="font-display font-semibold">Detailed Results — {current.examName}</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted)]">
              <th className="py-2">Subject</th><th>Marks</th><th>Grade</th><th>Points</th><th>Teacher Comment</th>
            </tr>
          </thead>
          <tbody>
            {current.subjects.map((s) => (
              <tr key={s.subject} className="border-b border-[var(--color-border)] last:border-0">
                <td className="py-2 font-medium">{s.subject}</td>
                <td>{s.marks}</td>
                <td>{s.grade}</td>
                <td>{s.points}</td>
                <td className="text-[var(--color-muted)]">{s.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[var(--color-muted)]">Your results are private and only visible to you. Comparative student rankings are never published.</p>
    </div>
  );
}
