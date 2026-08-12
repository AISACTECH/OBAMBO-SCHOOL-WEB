import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { alumni } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, rateLimit, getClientIp } from "@/lib/security";
import { createSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const schema = z.object({ email: z.string().trim().email().toLowerCase(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`alumni-login:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });

  const rows = await db.select().from(alumni).where(eq(alumni.email, parsed.data.email.toLowerCase())).limit(1);
  const record = rows[0];
  const genericError = "Invalid email or password.";

  if (!record || !record.passwordHash) return NextResponse.json({ error: genericError }, { status: 401 });

  if (record.lockedUntil && new Date(record.lockedUntil) > new Date()) {
    return NextResponse.json({ error: "This account is temporarily locked. Please try again later." }, { status: 423 });
  }

  const ok = await verifyPassword(parsed.data.password, record.passwordHash);
  if (!ok) {
    const attempts = record.failedLoginAttempts + 1;
    const locked = attempts >= 5;
    await db.update(alumni).set({ failedLoginAttempts: locked ? 0 : attempts, lockedUntil: locked ? new Date(Date.now() + 15 * 60 * 1000) : null }).where(eq(alumni.id, record.id));
    return NextResponse.json({ error: genericError }, { status: 401 });
  }

  if (!record.active) return NextResponse.json({ error: "This account has been suspended. Contact the school administration." }, { status: 403 });

  await db.update(alumni).set({ failedLoginAttempts: 0, lockedUntil: null }).where(eq(alumni.id, record.id));
  await createSession({ id: record.id, name: record.name, role: "alumni", type: "alumni" });
  await logAudit({ actorType: "alumni", actorId: record.id, actorName: record.name, action: "alumni_login_success", ipAddress: ip });

  return NextResponse.json({ ok: true });
}
