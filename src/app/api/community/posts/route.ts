import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { groups, posts } from "@/db/schema";
import { and, desc, eq, isNull } from "drizzle-orm";
import { currentIdentity } from "@/lib/identity";
import { canAccessGroup } from "@/lib/community-access";
import { rateLimit } from "@/lib/security";

const postSchema = z.object({
  content: z.string().trim().min(2).max(4000),
  title: z.string().trim().max(200).optional().default(""),
  topic: z.string().trim().min(1).max(60).optional().default("general"),
  groupSlug: z.string().trim().max(120).optional().default(""),
});

export async function GET(req: NextRequest) {
  const groupSlug = req.nextUrl.searchParams.get("group")?.trim() || "";
  if (groupSlug) {
    const [group] = await db.select().from(groups).where(eq(groups.slug, groupSlug)).limit(1);
    const identity = await currentIdentity();
    if (!group || !(await canAccessGroup(group, identity))) return NextResponse.json({ posts: [] });

    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.groupId, group.id), eq(posts.status, "published")))
      .orderBy(desc(posts.pinned), desc(posts.createdAt));
    return NextResponse.json({ posts: rows });
  }

  // General discussion deliberately excludes group posts so private or
  // member-only conversations cannot leak through the unfiltered endpoint.
  const rows = await db
    .select()
    .from(posts)
    .where(and(isNull(posts.groupId), eq(posts.status, "published")))
    .orderBy(desc(posts.pinned), desc(posts.createdAt))
    .limit(30);
  return NextResponse.json({ posts: rows });
}

export async function POST(req: NextRequest) {
  const identity = await currentIdentity();
  if (!identity) return NextResponse.json({ error: "Please sign in to post in the community." }, { status: 401 });

  const limit = rateLimit(`post:${identity.type}:${identity.id}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "You are posting too frequently. Please slow down." }, { status: 429 });

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Post content must be between 2 and 4,000 characters." }, { status: 400 });

  let groupId: number | null = null;
  if (parsed.data.groupSlug) {
    const [group] = await db.select().from(groups).where(eq(groups.slug, parsed.data.groupSlug)).limit(1);
    if (!group || !(await canAccessGroup(group, identity))) {
      return NextResponse.json({ error: "You do not have access to this group." }, { status: 403 });
    }
    groupId = group.id;
  }

  const inserted = await db.insert(posts).values({
    groupId,
    topic: parsed.data.topic,
    authorType: identity.type,
    authorId: identity.id,
    authorName: identity.name,
    title: parsed.data.title,
    content: parsed.data.content,
    status: "published",
  }).returning();

  return NextResponse.json({ post: inserted[0] });
}
