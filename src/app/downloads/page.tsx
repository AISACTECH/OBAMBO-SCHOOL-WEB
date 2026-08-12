import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Download Centre" };
export const dynamic = "force-dynamic";

export default async function DownloadsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "all" } = await searchParams;
  const CATEGORIES = ["all", "admission", "policies", "academic", "forms", "circulars", "examination", "newsletters", "meetings", "publications"];
  const rows = await db.select().from(documents).where(eq(documents.visibility, "public")).orderBy(desc(documents.createdAt)).limit(100);
  const filtered = category === "all" ? rows : rows.filter((d) => d.category === category);

  return (
    <div>
      <PageHero eyebrow="Download Centre" title="Official School Documents" description="Admission forms, policies, circulars, examination information and publications in one place." />
      <div className="container-shell py-10">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <a key={c} href={c === "all" ? "/downloads" : `/downloads?category=${c}`} className={`btn !px-3 !py-1.5 text-xs capitalize ${category === c ? "btn-primary" : "btn-outline"}`}>{c}</a>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-[var(--color-muted)]">Documents will appear here once uploaded by the school administration.</p>
        ) : (
          <ul className="mt-6 space-y-2">
            {filtered.map((d) => (
              <li key={d.id} className="card-surface flex items-center justify-between p-4 text-sm">
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs uppercase text-[var(--color-muted)]">{d.category} · {d.fileType}</p>
                </div>
                <a href={d.fileUrl} download className="btn btn-outline !py-1.5">Download</a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
