import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import PriorityBadge from "@/components/site/PriorityBadge";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";

export const metadata: Metadata = { title: "Announcements" };
export const dynamic = "force-dynamic";

const CATEGORIES = ["all", "general", "academic", "examination", "admission", "students", "parents", "teachers", "events", "clubs", "sports", "emergency", "alumni", "community"];

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category = "all" } = await searchParams;
  const now = new Date();
  const conditions = [
    eq(announcements.status, "published"),
    eq(announcements.targetAudience, "everyone"),
    or(isNull(announcements.publishAt), lte(announcements.publishAt, now)),
    or(isNull(announcements.expiryAt), gte(announcements.expiryAt, now)),
  ];
  if (category !== "all") conditions.push(eq(announcements.category, category));

  const rows = await db
    .select()
    .from(announcements)
    .where(and(...conditions))
    .orderBy(desc(announcements.pinned), desc(announcements.publishAt));

  return (
    <div>
      <PageHero eyebrow="Announcements" title="School Announcements" description="Official notices from St Mark's Secondary School – Obambo." />
      <div className="container-shell py-10">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={c === "all" ? "/announcements" : `/announcements?category=${c}`}
              className={`btn !px-3 !py-1.5 text-xs capitalize ${category === c ? "btn-primary" : "btn-outline"}`}
            >
              {c}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {rows.length === 0 && <p className="text-sm text-[var(--color-muted)]">No announcements in this category yet.</p>}
          {rows.map((a) => (
            <Link key={a.id} href={`/announcements/${a.slug}`} className={`card-surface p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${a.priority === "emergency" ? "border-[var(--color-danger)]" : ""}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="badge badge-normal capitalize">{a.category}</span>
                <PriorityBadge priority={a.priority} />
              </div>
              <h3 className="font-display mt-3 text-lg font-semibold">{a.pinned && "📌 "}{a.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--color-muted)]">{a.summary}</p>
              <p className="mt-3 text-xs text-[var(--color-muted)]">
                {new Date(a.publishAt ?? a.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · {a.authorName}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
