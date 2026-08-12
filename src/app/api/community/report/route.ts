import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { comments, groups, posts, reports } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { currentIdentity } from "@/lib/identity";
import { canAccessGroup } from "@/lib/community-access";
import { rateLimit } from "@/lib/security";

const reportSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.coerce.number().int().positive(),
  reason: z.string().trim().min(2).max(200),
  details: z.string().trim().max(2000).optional().default(""),
});

async function canSeeTarget(targetType: "post" | "comment", targetId: number, identity: Awaited<ReturnType<typeof currentIdentity>>) {
  const postId = targetType === "post"
    ? targetId
    : (await db.select({ postId: comments.postId }).from(comments).where(and(eq(comments.id, targetId), eq(comments.status, "published"))).limit(1))[0]?.postId;
  if (!postId) return false;

  const [post] = await db.select().from(posts).where(and(eq(posts.id, postId), eq(posts.status, "published"))).limit(1);
  if (!post) return false;
  if (!post.groupId) return true;
  const [group] = await db.select().from(groups).where(eq(groups.id, post.groupId)).limit(1);
  return Boolean(group && await canAccessGroup(group, identity));
}

export async function POST(req: NextRequest) {
  const identity = await currentIdentity();
  const parsed = reportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please provide a valid reason for reporting." }, { status: 400 });

  const key = identity ? `${identity.type}:${identity.id}` : "anonymous";
  const limit = rateLimit(`report:${key}`, 10, 30 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many reports submitted. Please try again later." }, { status: 429 });
  if (!(await canSeeTarget(parsed.data.targetType, parsed.data.targetId, identity))) {
    return NextResponse.json({ error: "Content not found." }, { status: 404 });
  }

  await db.insert(reports).values({
    targetType: parsed.data.targetType,
    targetId: parsed.data.targetId,
    reason: parsed.data.reason,
    details: parsed.data.details,
    reporterType: identity?.type || "anonymous",
    reporterId: identity?.id,
  });

  return NextResponse.json({ ok: true });
}
