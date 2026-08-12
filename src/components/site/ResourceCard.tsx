"use client";

import { useState } from "react";

type Resource = {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  form: string;
  term: string;
  year: number;
  category: string;
  fileUrl: string;
  fileType: string;
  downloadCount: number;
  viewCount: number;
  tags: string[] | null;
};

export default function ResourceCard({ resource }: { resource: Resource }) {
  const [preview, setPreview] = useState(false);

  async function track(action: "view" | "download") {
    fetch(`/api/resources/${resource.id}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => {});
  }

  const isPdf = resource.fileType === "pdf";

  return (
    <div className="card-surface flex flex-col p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="badge badge-normal capitalize">{resource.category.replace(/-/g, " ")}</span>
        <span className="text-xs uppercase text-[var(--color-muted)]">{resource.fileType}</span>
      </div>
      <h3 className="font-display mt-3 line-clamp-2 text-base font-semibold">{resource.title}</h3>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{resource.subject} · {resource.form} · {resource.term} {resource.year}</p>
      {resource.description && <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{resource.description}</p>}

      <div className="mt-3 flex flex-wrap gap-1">
        {(resource.tags || []).slice(0, 4).map((t) => (
          <span key={t} className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-muted)]">#{t}</span>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-[var(--color-muted)]">{resource.viewCount} views · {resource.downloadCount} downloads</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {isPdf && (
          <button className="btn btn-outline !py-1.5 text-xs" onClick={() => { setPreview((v) => !v); track("view"); }}>
            {preview ? "Hide Preview" : "Preview PDF"}
          </button>
        )}
        <a href={resource.fileUrl} download onClick={() => track("download")} className="btn btn-primary !py-1.5 text-xs">
          Download
        </a>
        <button
          className="btn btn-outline !py-1.5 text-xs"
          onClick={async () => {
            await navigator.clipboard.writeText(new URL(resource.fileUrl, window.location.origin).toString());
          }}
        >
          Share
        </button>
        <button
          className="btn btn-outline !py-1.5 text-xs"
          onClick={async () => {
            const res = await fetch("/api/student/saved-resources", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ resourceId: resource.id }),
            });
            alert(res.ok ? "Saved to your student portal." : "Please sign in to the Student Portal to save resources.");
          }}
        >
          Save
        </button>
      </div>

      {preview && isPdf && (
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)]">
          <iframe src={`${resource.fileUrl}#toolbar=1`} className="h-96 w-full" title={resource.title} loading="lazy" />
        </div>
      )}
    </div>
  );
}
