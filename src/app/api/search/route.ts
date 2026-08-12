import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { announcements, news, resources, pages, events, alumni, groups } from "@/db/schema";
import { and, eq, ilike, or } from "drizzle-orm";
import { getClientIp, rateLimit } from "@/lib/security";

export async function GET(req: NextRequest) {
  const limit = rateLimit(`search:${getClientIp(req.headers)}`, 60, 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many search requests. Please try again shortly." }, { status: 429 });
  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 200) || "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const like = `%${q}%`;

  const [a, n, r, p, e, al, g] = await Promise.all([
    db.select().from(announcements).where(and(eq(announcements.status, "published"), or(ilike(announcements.title, like), ilike(announcements.summary, like)))).limit(5),
    db.select().from(news).where(and(eq(news.status, "published"), or(ilike(news.title, like), ilike(news.excerpt, like)))).limit(5),
    db.select().from(resources).where(and(eq(resources.status, "published"), or(ilike(resources.title, like), ilike(resources.subject, like)))).limit(5),
    db.select().from(pages).where(and(eq(pages.status, "published"), or(ilike(pages.title, like), ilike(pages.content, like)))).limit(5),
    db.select().from(events).where(and(eq(events.status, "published"), ilike(events.title, like))).limit(5),
    db.select().from(alumni).where(and(eq(alumni.privacy, "public"), eq(alumni.verified, true), ilike(alumni.name, like))).limit(5),
    db.select().from(groups).where(and(eq(groups.visibility, "public"), ilike(groups.name, like))).limit(5),
  ]);

  const results = [
    ...a.map((x) => ({ type: "Announcement", title: x.title, href: `/announcements/${x.slug}` })),
    ...n.map((x) => ({ type: "News", title: x.title, href: `/news/${x.slug}` })),
    ...r.map((x) => ({ type: "Resource", title: x.title, href: `/resources?highlight=${x.id}` })),
    ...p.map((x) => ({ type: "Page", title: x.title, href: `/about#${x.slug}` })),
    ...e.map((x) => ({ type: "Event", title: x.title, href: `/events#${x.slug}` })),
    ...al.map((x) => ({ type: "Alumni", title: x.name, href: `/alumni/directory` })),
    ...g.map((x) => ({ type: "Community Group", title: x.name, href: `/community/${x.slug}` })),
  ];

  return NextResponse.json({ results });
}
