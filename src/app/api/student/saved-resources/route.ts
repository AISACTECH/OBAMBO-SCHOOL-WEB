import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { savedResources, resources } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { requireStudent, isResponse } from "@/lib/guards";

export async function GET() {
  const session = await requireStudent();
  if (isResponse(session)) return session;

  const saved = await db.select().from(savedResources).where(eq(savedResources.studentId, session.id));
  const ids = saved.map((s) => s.resourceId);
  const rows = ids.length
    ? await db.select().from(resources).where(and(eq(resources.status, "published"), inArray(resources.id, ids)))
    : [];
  return NextResponse.json({ resources: rows });
}

export async function POST(req: NextRequest) {
  const session = await requireStudent();
  if (isResponse(session)) return session;
  const body = await req.json().catch(() => null);
  const resourceId = Number(body?.resourceId);
  if (!Number.isSafeInteger(resourceId) || resourceId < 1) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  const [resource] = await db
    .select({ id: resources.id })
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.status, "published")))
    .limit(1);
  if (!resource) return NextResponse.json({ error: "Resource not found." }, { status: 404 });

  const existing = await db
    .select({ id: savedResources.id })
    .from(savedResources)
    .where(and(eq(savedResources.studentId, session.id), eq(savedResources.resourceId, resourceId)));
  if (existing.length === 0) {
    await db.insert(savedResources).values({ studentId: session.id, resourceId });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await requireStudent();
  if (isResponse(session)) return session;
  const body = await req.json().catch(() => null);
  const resourceId = Number(body?.resourceId);
  if (!Number.isSafeInteger(resourceId) || resourceId < 1) {
    return NextResponse.json({ error: "Invalid resource." }, { status: 400 });
  }

  await db.delete(savedResources).where(and(eq(savedResources.studentId, session.id), eq(savedResources.resourceId, resourceId)));
  return NextResponse.json({ ok: true });
}
