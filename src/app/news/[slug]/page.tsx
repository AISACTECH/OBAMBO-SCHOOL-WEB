import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ShareBar from "@/components/site/ShareBar";
import { db } from "@/db";
import { news } from "@/db/schema";
import { and, eq, isNull, lte, or } from "drizzle-orm";

/* Article image URLs are managed by school staff and may be external. */
/* eslint-disable @next/next/no-img-element */

export const dynamic = "force-dynamic";

async function getArticle(slug: string) {
  const rows = await db
    .select()
    .from(news)
    .where(and(
      eq(news.slug, slug),
      eq(news.status, "published"),
      or(isNull(news.publishedAt), lte(news.publishedAt, new Date())),
    ))
    .limit(1);
  return rows[0] ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const n = await getArticle(slug);
  if (!n) return {};
  return {
    title: n.title,
    description: n.excerpt,
    openGraph: { title: n.title, description: n.excerpt, images: n.imageUrl ? [n.imageUrl] : undefined, type: "article" },
  };
}

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = await getArticle(slug);
  if (!n) notFound();

  return (
    <article className="container-shell max-w-3xl py-12">
      <span className="badge badge-normal capitalize">{n.category.replace(/-/g, " ")}</span>
      <h1 className="font-display mt-4 text-3xl font-bold md:text-4xl">{n.title}</h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        By {n.authorName} · {new Date(n.publishedAt ?? n.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" })} · {n.readingTimeMinutes} min read
      </p>
      {n.imageUrl && <img src={n.imageUrl} alt="" className="mt-6 w-full rounded-2xl" />}
      <div className="prose prose-slate mt-6 max-w-none whitespace-pre-line text-[var(--color-text)]/90">{n.content}</div>

      {Array.isArray(n.gallery) && n.gallery.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {n.gallery.map((g, i) => <img key={i} src={g} alt="" className="aspect-square rounded-xl object-cover" />)}
        </div>
      )}

      <div className="mt-8 border-t border-[var(--color-border)] pt-6">
        <ShareBar title={n.title} url={`/news/${n.slug}`} />
      </div>
    </article>
  );
}
