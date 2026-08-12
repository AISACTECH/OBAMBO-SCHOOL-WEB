import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { getPage } from "@/lib/data";
import { db } from "@/db";
import { media } from "@/db/schema";
import { and, eq, or } from "drizzle-orm";

/* Gallery URLs are stored in the database and can be external to this app. */
/* eslint-disable @next/next/no-img-element */

export const metadata: Metadata = { title: "Student Life" };
export const dynamic = "force-dynamic";

export default async function SchoolLifePage() {
  const [page, gallerySample] = await Promise.all([
    getPage("student-life"),
    db.select().from(media).where(and(
      eq(media.visibility, "public"),
      eq(media.type, "image"),
      or(eq(media.consentStatus, "not_required"), eq(media.consentStatus, "consent_confirmed")),
    )).limit(6),
  ]);

  return (
    <div>
      <PageHero eyebrow="Student Life" title="Life at St Mark's" description="Clubs, sports, community engagement and everyday school culture." />
      <div className="container-shell py-12">
        <p className="max-w-3xl whitespace-pre-line text-[var(--color-text)]/85">{page?.content}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {["Clubs & Societies", "Sports", "Community Engagement"].map((title) => (
            <div key={title} className="card-surface p-5">
              <h3 className="font-display font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-[var(--color-muted)]">Information awaiting school verification.</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">School Life Gallery</h2>
          <Link href="/gallery" className="text-sm font-semibold text-[var(--color-primary)]">View full gallery →</Link>
        </div>
        {gallerySample.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">Photos will appear here once published with appropriate consent by the school.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
            {gallerySample.map((m) => (
              <img key={m.id} src={m.url} alt={m.caption || ""} className="aspect-square rounded-xl object-cover" loading="lazy" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
