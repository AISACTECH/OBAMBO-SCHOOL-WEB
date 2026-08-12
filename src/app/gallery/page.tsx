import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { media } from "@/db/schema";
import { and, eq, desc, or } from "drizzle-orm";

/* Gallery URLs are stored in the database and can be external to this app. */
/* eslint-disable @next/next/no-img-element */

export const metadata: Metadata = { title: "School Life Gallery" };
export const dynamic = "force-dynamic";

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "all" } = await searchParams;
  const CATEGORIES = ["all", "campus", "classrooms", "sports", "academics", "clubs", "events", "students", "staff", "community", "alumni"];
  const rows = await db
    .select()
    .from(media)
    .where(and(
      eq(media.visibility, "public"),
      eq(media.type, "image"),
      or(eq(media.consentStatus, "not_required"), eq(media.consentStatus, "consent_confirmed")),
    ))
    .orderBy(desc(media.createdAt));
  const filtered = category === "all" ? rows : rows.filter((m) => m.category === category);

  return (
    <div>
      <PageHero eyebrow="School Life" title="School Gallery" description="A visual look at campus, classrooms, sports, clubs, events and community life." />
      <div className="container-shell py-10">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <a key={c} href={c === "all" ? "/gallery" : `/gallery?category=${c}`} className={`btn !px-3 !py-1.5 text-xs capitalize ${category === c ? "btn-primary" : "btn-outline"}`}>{c}</a>
          ))}
        </div>
        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-[var(--color-muted)]">No photos in this category yet. Consented photographs will be published here by the school.</p>
        ) : (
          <div className="mt-6 columns-2 gap-3 md:columns-3 lg:columns-4 [&>*]:mb-3">
            {filtered.map((m) => (
              <figure key={m.id} className="overflow-hidden rounded-xl">
                <img src={m.url} alt={m.caption || ""} loading="lazy" className="w-full" />
                {m.caption && <figcaption className="p-2 text-xs text-[var(--color-muted)]">{m.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
