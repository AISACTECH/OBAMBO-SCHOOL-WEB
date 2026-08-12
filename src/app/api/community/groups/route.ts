import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { slugify } from "@/lib/security";
import { requireStaff, isResponse } from "@/lib/guards";
import { eq } from "drizzle-orm";

const groupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().max(2000).optional().default(""),
  category: z.string().trim().min(1).max(60).optional().default("community"),
  visibility: z.enum(["public", "school_only", "approved_members", "private"]).optional().default("school_only"),
});

export async function GET() {
  const session = await requireStaff("moderate_community");
  if (isResponse(session)) return session;
  const rows = await db.select().from(groups);
  return NextResponse.json({ groups: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireStaff("moderate_community");
  if (isResponse(session)) return session;
  const parsed = groupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the group details." }, { status: 400 });
  const slugBase = slugify(parsed.data.name);
  if (!slugBase) return NextResponse.json({ error: "Group name must contain letters or numbers." }, { status: 400 });
  const existing = await db.select({ id: groups.id }).from(groups).where(eq(groups.slug, slugBase)).limit(1);
  const slug = existing.length ? `${slugBase}-${Date.now().toString(36)}` : slugBase;
  const inserted = await db.insert(groups).values({
    name: parsed.data.name,
    slug,
    description: parsed.data.description,
    category: parsed.data.category,
    visibility: parsed.data.visibility,
  }).returning();
  return NextResponse.json({ group: inserted[0] });
}
