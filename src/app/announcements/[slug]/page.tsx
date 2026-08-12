import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PriorityBadge from "@/components/site/PriorityBadge";
import ShareBar from "@/components/site/ShareBar";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { and, eq, gte, isNull, lte, or } from "drizzle-orm";

/* External image URLs are managed by school staff and may not be known at build time. */
/* eslint-disable @next/next/no-img-element */

export const dynamic = "force-dynamic";

async function getAnnouncement(slug: string) {
  const now = new Date();
  const rows = await db
    .select()
    .from(announcements)
    .where(and(
      eq(announcements.slug, slug),
      eq(announcements.status, "published"),
      eq(announcements.targetAudience, "everyone"),
      or(isNull(announcements.publishAt), lte(announcements.publishAt, now)),
      or(isNull(announcements.expiryAt), gte(announcements.expiryAt, now)),
    ))
    .limit(1);
  return rows[0] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnnouncement(slug);
  if (!a) return {};
  return {
    title: a.title,
    description: a.summary,
    openGraph: { title: a.title, description: a.summary, images: a.imageUrl ? [a.imageUrl] : undefined },
  };
}

export default async function AnnouncementDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getAnnouncement(slug);
  if (!a) notFound();

  return (
    <article className="container-shell max-w-3xl py-12">
      <div className="flex flex-wrap items-center gap-2">
        <span className="badge badge-normal capitalize">{a.category}</span>
        <PriorityBadge priority={a.priority} />
        {a.pinned && <span className="badge bg-[var(--color-secondary)]/20 text-[#8a5b06]">📌 Pinned</span>}
      </div>
      <h1 className="font-display mt-4 text-3xl font-bold md:text-4xl">{a.title}</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        By {a.authorName} · {new Date(a.publishAt ?? a.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      {a.imageUrl && <img src={a.imageUrl} alt="" className="mt-6 w-full rounded-2xl" />}
      <div className="prose prose-slate mt-6 max-w-none whitespace-pre-line text-[var(--color-text)]/90">{a.content}</div>

      {Array.isArray(a.attachments) && a.attachments.length > 0 && (
        <div className="mt-6">
          <h3 className="font-display font-semibold">Attachments</h3>
          <ul className="mt-2 space-y-2">
            {a.attachments.map((att, i) => (
              <li key={i}><a href={att.url} className="text-sm font-medium text-[var(--color-primary)] underline">{att.name}</a></li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 border-t border-[var(--color-border)] pt-6">
        <ShareBar title={a.title} url={`/announcements/${a.slug}`} />
      </div>
    </article>
  );
}
