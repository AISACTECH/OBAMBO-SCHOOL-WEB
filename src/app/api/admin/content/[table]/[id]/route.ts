import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { CONTENT_REGISTRY, pickWritableFields } from "@/lib/content-registry";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  const { table, id } = await params;
  const entry = CONTENT_REGISTRY[table];
  if (!entry) return NextResponse.json({ error: "Unknown resource." }, { status: 404 });
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) return NextResponse.json({ error: "Invalid resource id." }, { status: 400 });

  const session = await requireStaff(entry.permission);
  if (isResponse(session)) return session;

  const values = pickWritableFields(await req.json().catch(() => null), entry);
  if (!values) return NextResponse.json({ error: "No valid content fields were provided." }, { status: 400 });

  const updated = await db.update(entry.table).set(values).where(eq(entry.table.id, numericId)).returning();
  if (updated.length === 0) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: `${table}_updated`, targetType: table, targetId: numericId });
  return NextResponse.json({ item: updated[0] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ table: string; id: string }> }) {
  const { table, id } = await params;
  const entry = CONTENT_REGISTRY[table];
  if (!entry) return NextResponse.json({ error: "Unknown resource." }, { status: 404 });
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) return NextResponse.json({ error: "Invalid resource id." }, { status: 400 });

  const session = await requireStaff(entry.permission);
  if (isResponse(session)) return session;

  const deleted = await db.delete(entry.table).where(eq(entry.table.id, numericId)).returning({ id: entry.table.id });
  if (deleted.length === 0) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: `${table}_deleted`, targetType: table, targetId: numericId });
  return NextResponse.json({ ok: true });
}
