import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { groups, posts, reactions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { currentIdentity } from "@/lib/identity";
import { canAccessGroup } from "@/lib/community-access";

const reactionSchema = z.object({
  postId: z.coerce.number().int().positive(),
  type: z.enum(["like", "love", "support"]).default("like"),
});

export async function POST(req: NextRequest) {
  const identity = await currentIdentity();
  if (!identity) return NextResponse.json({ error: "Please sign in to react." }, { status: 401 });

  const parsed = reactionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });

  const [post] = await db.select().from(posts).where(and(eq(posts.id, parsed.data.postId), eq(posts.status, "published"))).limit(1);
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (post.groupId) {
    const [group] = await db.select().from(groups).where(eq(groups.id, post.groupId)).limit(1);
    if (!group || !(await canAccessGroup(group, identity))) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const existing = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(and(
      eq(reactions.postId, parsed.data.postId),
      eq(reactions.authorType, identity.type),
      eq(reactions.authorId, identity.id),
      eq(reactions.type, parsed.data.type),
    ));

  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
    return NextResponse.json({ reacted: false });
  }

  // Keep one reaction per person and post, even if older clients used another
  // reaction type before the type selector was introduced.
  await db.delete(reactions).where(and(
    eq(reactions.postId, parsed.data.postId),
    eq(reactions.authorType, identity.type),
    eq(reactions.authorId, identity.id),
  ));
  await db.insert(reactions).values({ postId: parsed.data.postId, authorType: identity.type, authorId: identity.id, type: parsed.data.type });
  return NextResponse.json({ reacted: true });
}
