import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { news } from "@/db/schema";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";

export const metadata: Metadata = { title: "School News" };
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const rows = await db
    .select()
    .from(news)
    .where(and(eq(news.status, "published"), or(isNull(news.publishedAt), lte(news.publishedAt, new Date()))))
    .orderBy(desc(news.publishedAt));
  const featured = rows.find((n) => n.featured) || rows[0];
  const rest = rows.filter((n) => n.id !== featured?.id);

  return (
    <div>
      <PageHero eyebrow="News" title="St Mark's School News" description="Academic achievements, sports, clubs, leadership, student life and community stories." />
      <div className="container-shell py-12">
        {featured && (
          <Link href={`/news/${featured.slug}`} className="card-surface mb-10 grid overflow-hidden md:grid-cols-2">
            <div className="aspect-[16/9] bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] md:aspect-auto" style={featured.imageUrl ? { backgroundImage: `url(${featured.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
            <div className="flex flex-col justify-center p-6">
              <span className="badge badge-normal w-fit">Featured Story</span>
              <h2 className="font-display mt-3 text-2xl font-bold">{featured.title}</h2>
              <p className="mt-2 text-sm text-[var(--color-muted)]">{featured.excerpt}</p>
              <p className="mt-3 text-xs text-[var(--color-muted)]">{featured.readingTimeMinutes} min read</p>
            </div>
          </Link>
        )}

        <div className="grid gap-5 md:grid-cols-3">
          {rest.length === 0 && rows.length <= 1 && <p className="text-sm text-[var(--color-muted)]">More stories will appear here as they are published.</p>}
          {rest.map((n) => (
            <Link key={n.id} href={`/news/${n.slug}`} className="card-surface flex flex-col overflow-hidden">
              <div className="aspect-[16/9] bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]" style={n.imageUrl ? { backgroundImage: `url(${n.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{n.category.replace(/-/g, " ")}</span>
                <h3 className="font-display mt-2 line-clamp-2 text-lg font-semibold">{n.title}</h3>
                <p className="mt-2 line-clamp-2 flex-1 text-sm text-[var(--color-muted)]">{n.excerpt}</p>
                <p className="mt-3 text-xs text-[var(--color-muted)]">{n.readingTimeMinutes} min read {n.trending && "· 🔥 Trending"}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
