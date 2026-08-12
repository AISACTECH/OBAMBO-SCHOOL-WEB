import { db } from "@/db";
import { announcements, news, events, resources } from "@/db/schema";
import { and, desc, eq, gte, lte, or, isNull, sql } from "drizzle-orm";

type AnnouncementAudience = "everyone" | "students" | "parents" | "teachers" | "alumni";

export async function getActiveAnnouncements(limit = 6, audience: AnnouncementAudience = "everyone") {
  const now = new Date();
  const audienceCondition = audience === "everyone"
    ? eq(announcements.targetAudience, "everyone")
    : or(eq(announcements.targetAudience, "everyone"), eq(announcements.targetAudience, audience));

  return db
    .select()
    .from(announcements)
    .where(
      and(
        eq(announcements.status, "published"),
        audienceCondition,
        or(isNull(announcements.publishAt), lte(announcements.publishAt, now)),
        or(isNull(announcements.expiryAt), gte(announcements.expiryAt, now)),
      ),
    )
    .orderBy(desc(announcements.pinned), desc(announcements.publishAt))
    .limit(limit);
}

export async function getLatestNews(limit = 6) {
  const now = new Date();
  return db
    .select()
    .from(news)
    .where(and(eq(news.status, "published"), or(isNull(news.publishedAt), lte(news.publishedAt, now))))
    .orderBy(desc(news.publishedAt))
    .limit(limit);
}

export async function getUpcomingEvents(limit = 6) {
  const now = new Date();
  return db
    .select()
    .from(events)
    .where(and(eq(events.status, "published"), gte(events.startAt, now)))
    .orderBy(events.startAt)
    .limit(limit);
}

export async function getSchoolPulse() {
  const [ann, upcoming, resourceRows] = await Promise.all([
    getActiveAnnouncements(4),
    getUpcomingEvents(3),
    db
      .select()
      .from(resources)
      .where(eq(resources.status, "published"))
      .orderBy(desc(resources.createdAt))
      .limit(2),
  ]);

  type PulseItem = {
    id: string;
    kind: "announcement" | "event" | "resource";
    title: string;
    detail: string;
    href: string;
    date: Date;
    priority?: string;
  };

  const items: PulseItem[] = [
    ...ann.map((a) => ({
      id: `a-${a.id}`,
      kind: "announcement" as const,
      title: a.title,
      detail: a.summary,
      href: `/announcements/${a.slug}`,
      date: a.publishAt ?? a.createdAt,
      priority: a.priority,
    })),
    ...upcoming.map((e) => ({
      id: `e-${e.id}`,
      kind: "event" as const,
      title: e.title,
      detail: `Upcoming event · ${new Date(e.startAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`,
      href: `/events#${e.slug}`,
      date: e.startAt,
    })),
    ...resourceRows.map((r) => ({
      id: `r-${r.id}`,
      kind: "resource" as const,
      title: `New resource: ${r.title}`,
      detail: `${r.subject} · ${r.form} · ${r.term} ${r.year}`,
      href: `/resources?highlight=${r.id}`,
      date: r.createdAt,
    })),
  ];

  items.sort((x, y) => y.date.getTime() - x.date.getTime());
  return items.slice(0, 6);
}

export const resourceCount = () => db.select({ count: sql<number>`count(*)` }).from(resources);

export async function getPage(slug: string) {
  const { pages } = await import("@/db/schema");
  const rows = await db.select().from(pages).where(and(eq(pages.slug, slug), eq(pages.status, "published"))).limit(1);
  return rows[0] ?? null;
}
