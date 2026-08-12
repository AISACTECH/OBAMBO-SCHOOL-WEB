import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff("manage_content");
  if (isResponse(session)) return session;
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) return NextResponse.json({ error: "Invalid message id." }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body || !["new", "read", "archived"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid message status." }, { status: 400 });
  }
  const updated = await db.update(contactMessages).set({ status: body.status }).where(eq(contactMessages.id, numericId)).returning({ id: contactMessages.id });
  if (updated.length === 0) return NextResponse.json({ error: "Message not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
