import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { developmentProjects } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Our Progress" };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { ongoing: "Ongoing", completed: "Completed", planned: "Future Project" };

export default async function ProgressPage() {
  const rows = await db.select().from(developmentProjects).where(eq(developmentProjects.published, true)).limit(100);

  return (
    <div>
      <PageHero eyebrow="School Development" title="Our Progress" description="Approved development projects — completed, ongoing and future initiatives supported by our community." />
      <div className="container-shell py-12">
        {rows.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Development project updates will be published here once verified by the school administration.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {rows.map((p) => (
              <div key={p.id} className="card-surface p-5">
                <span className="badge badge-normal">{STATUS_LABEL[p.status] || p.status}</span>
                <h3 className="font-display mt-3 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{p.description}</p>
                {p.timeline && <p className="mt-2 text-xs text-[var(--color-muted)]">Timeline: {p.timeline}</p>}
                {p.target && <p className="mt-1 text-xs text-[var(--color-muted)]">Target: {p.target}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
