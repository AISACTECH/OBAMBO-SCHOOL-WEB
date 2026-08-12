import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { currentIdentity } from "@/lib/identity";

export async function GET() {
  const identity = await currentIdentity();
  if (!identity) return NextResponse.json({ notifications: [] });

  const rows = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.recipientType, identity.type), eq(notifications.recipientId, identity.id)))
    .orderBy(desc(notifications.createdAt))
    .limit(30);

  return NextResponse.json({ notifications: rows });
}

export async function PATCH(req: NextRequest) {
  const identity = await currentIdentity();
  if (!identity) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { id, markAll } = await req.json().catch(() => ({}));

  if (markAll) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.recipientType, identity.type), eq(notifications.recipientId, identity.id)));
    return NextResponse.json({ ok: true });
  }

  if (id) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, Number(id)), eq(notifications.recipientType, identity.type), eq(notifications.recipientId, identity.id)));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}
