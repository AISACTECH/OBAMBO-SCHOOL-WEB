import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { comments, groups, posts } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { currentIdentity } from "@/lib/identity";
import { canAccessGroup } from "@/lib/community-access";
import { rateLimit } from "@/lib/security";

const commentSchema = z.object({
  postId: z.coerce.number().int().positive(),
  content: z.string().trim().min(1).max(1000),
});

async function getAccessiblePost(postId: number, identity: Awaited<ReturnType<typeof currentIdentity>>) {
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.status, "published")))
    .limit(1);
  if (!post) return null;
  if (!post.groupId) return post;

  const [group] = await db.select().from(groups).where(eq(groups.id, post.groupId)).limit(1);
  return group && await canAccessGroup(group, identity) ? post : null;
}

export async function GET(req: NextRequest) {
  const postId = Number(req.nextUrl.searchParams.get("postId"));
  if (!Number.isSafeInteger(postId) || postId < 1) return NextResponse.json({ comments: [] });

  const identity = await currentIdentity();
  if (!(await getAccessiblePost(postId, identity))) return NextResponse.json({ comments: [] });
  const rows = await db.select().from(comments).where(and(eq(comments.postId, postId), eq(comments.status, "published"))).orderBy(asc(comments.createdAt));
  return NextResponse.json({ comments: rows });
}

export async function POST(req: NextRequest) {
  const identity = await currentIdentity();
  if (!identity) return NextResponse.json({ error: "Please sign in to comment." }, { status: 401 });

  const limit = rateLimit(`comment:${identity.type}:${identity.id}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "You are commenting too frequently." }, { status: 429 });

  const parsed = commentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Comment cannot be empty or exceed 1,000 characters." }, { status: 400 });
  if (!(await getAccessiblePost(parsed.data.postId, identity))) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const inserted = await db.insert(comments).values({
    postId: parsed.data.postId,
    authorType: identity.type,
    authorId: identity.id,
    authorName: identity.name,
    content: parsed.data.content,
  }).returning();

  return NextResponse.json({ comment: inserted[0] });
}
