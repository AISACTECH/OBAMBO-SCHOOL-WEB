import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import ResourceCard from "@/components/site/ResourceCard";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Learning Hub",
  description: "Revision papers, past papers, marking schemes, notes and study guides for St Mark's Secondary School – Obambo students.",
};
export const dynamic = "force-dynamic";

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ form?: string; subject?: string; term?: string; category?: string }>;
}) {
  const { form = "all", subject = "all", term = "all", category = "all" } = await searchParams;

  const conditions = [eq(resources.status, "published")];
  if (form !== "all") conditions.push(eq(resources.form, form));
  if (subject !== "all") conditions.push(eq(resources.subject, subject));
  if (term !== "all") conditions.push(eq(resources.term, term));
  if (category !== "all") conditions.push(eq(resources.category, category));

  const rows = await db.select().from(resources).where(and(...conditions)).orderBy(desc(resources.createdAt)).limit(100);

  const forms = ["all", "Form 1", "Form 2", "Form 3", "Form 4"];
  const terms = ["all", "Term 1", "Term 2", "Term 3"];
  const categories = ["all", "notes", "revision-papers", "past-papers", "marking-schemes", "assignments", "study-guides", "school-documents"];

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams({ form, subject, term, category, ...overrides });
    for (const [k, v] of [...params.entries()]) if (v === "all") params.delete(k);
    const qs = params.toString();
    return qs ? `/resources?${qs}` : "/resources";
  }

  return (
    <div>
      <PageHero eyebrow="Digital Learning Library" title="Learning Hub" description="Find revision papers, past papers, marking schemes, notes and study guides — filtered by form, subject and term." />
      <div className="container-shell py-10">
        <div className="card-surface flex flex-wrap gap-4 p-4">
          <FilterGroup label="Form" options={forms} active={form} onHref={(v) => buildHref({ form: v })} />
          <FilterGroup label="Term" options={terms} active={term} onHref={(v) => buildHref({ term: v })} />
          <FilterGroup label="Category" options={categories} active={category} onHref={(v) => buildHref({ category: v })} />
        </div>

        <p className="mt-4 text-sm text-[var(--color-muted)]">{rows.length} resource{rows.length === 1 ? "" : "s"} found</p>

        {rows.length === 0 ? (
          <p className="mt-8 text-sm text-[var(--color-muted)]">Learning resources will appear here when published by teachers and the administration.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <ResourceCard key={r.id} resource={{ ...r, tags: r.tags || [] }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ label, options, active, onHref }: { label: string; options: string[]; active: string; onHref: (v: string) => string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <a key={o} href={onHref(o)} className={`rounded-full px-2.5 py-1 text-xs font-medium ${active === o ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-bg)] text-[var(--color-muted)]"}`}>
            {o}
          </a>
        ))}
      </div>
    </div>
  );
}
