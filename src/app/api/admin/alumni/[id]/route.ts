import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alumni } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { notifyByIds } from "@/lib/notify";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff("manage_alumni");
  if (isResponse(session)) return session;
  const { id } = await params;
  const alumniId = Number(id);
  if (!Number.isSafeInteger(alumniId) || alumniId < 1) return NextResponse.json({ error: "Invalid alumni id." }, { status: 400 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const patch: { verified?: boolean; active?: boolean; privacy?: "public" | "alumni_only" | "private" } = {};
  if ("verified" in body && typeof body.verified === "boolean") patch.verified = body.verified;
  if ("active" in body && typeof body.active === "boolean") patch.active = body.active;
  if ("privacy" in body && ["public", "alumni_only", "private"].includes(body.privacy)) patch.privacy = body.privacy;
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "No valid fields were provided." }, { status: 400 });

  const [before] = await db.select({ id: alumni.id, verified: alumni.verified }).from(alumni).where(eq(alumni.id, alumniId)).limit(1);
  if (!before) return NextResponse.json({ error: "Alumni record not found." }, { status: 404 });
  await db.update(alumni).set(patch).where(eq(alumni.id, alumniId));

  if (patch.verified === true && !before.verified) {
    await notifyByIds("alumni", [alumniId], { type: "alumni-verified", title: "Your alumni profile has been verified", body: "Welcome to the verified St Mark's alumni community!", link: "/alumni/dashboard" });
  }

  await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: "alumni_updated", targetType: "alumni", targetId: alumniId, details: patch });
  return NextResponse.json({ ok: true });
}
