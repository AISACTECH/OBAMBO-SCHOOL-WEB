import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { alumni } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAlumni, isResponse } from "@/lib/guards";

function isSafeExternalUrl(value: string) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

const schema = z.object({
  graduationYear: z.coerce.number().int().min(1970).max(new Date().getFullYear()).optional(),
  profession: z.string().trim().max(120).optional(),
  industry: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  bio: z.string().max(2000).optional(),
  linkedin: z.string().max(200).refine(isSafeExternalUrl).optional(),
  website: z.string().max(200).refine(isSafeExternalUrl).optional(),
  skills: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  achievements: z.string().max(2000).optional(),
  mentorshipAvailable: z.boolean().optional(),
  mentorTypes: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  privacy: z.enum(["public", "alumni_only", "private"]).optional(),
}).strict();

export async function GET() {
  const session = await requireAlumni();
  if (isResponse(session)) return session;
  const rows = await db.select().from(alumni).where(eq(alumni.id, session.id)).limit(1);
  const record = rows[0];
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { passwordHash: _passwordHash, ...safe } = record;
  return NextResponse.json({ profile: safe });
}

export async function PATCH(req: NextRequest) {
  const session = await requireAlumni();
  if (isResponse(session)) return session;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your profile details." }, { status: 400 });
  await db.update(alumni).set(parsed.data).where(eq(alumni.id, session.id));
  return NextResponse.json({ ok: true });
}
