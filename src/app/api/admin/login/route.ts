import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { staffUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, rateLimit, getClientIp } from "@/lib/security";
import { createSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`admin-login:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });

  const rows = await db.select().from(staffUsers).where(eq(staffUsers.email, parsed.data.email.toLowerCase())).limit(1);
  const staff = rows[0];
  const genericError = "Invalid email or password.";
  if (!staff) return NextResponse.json({ error: genericError }, { status: 401 });

  if (staff.lockedUntil && new Date(staff.lockedUntil) > new Date()) {
    return NextResponse.json({ error: "This account is temporarily locked. Please try again later." }, { status: 423 });
  }

  const ok = await verifyPassword(parsed.data.password, staff.passwordHash);
  if (!ok) {
    const attempts = staff.failedLoginAttempts + 1;
    const locked = attempts >= 5;
    await db.update(staffUsers).set({ failedLoginAttempts: locked ? 0 : attempts, lockedUntil: locked ? new Date(Date.now() + 15 * 60 * 1000) : null }).where(eq(staffUsers.id, staff.id));
    await logAudit({ actorType: "staff", actorId: staff.id, actorName: staff.name, action: "admin_login_failed", ipAddress: ip });
    return NextResponse.json({ error: genericError }, { status: 401 });
  }

  if (!staff.active) return NextResponse.json({ error: "This account has been deactivated." }, { status: 403 });

  await db.update(staffUsers).set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(staffUsers.id, staff.id));
  await createSession({ id: staff.id, name: staff.name, role: staff.role, type: "staff" });
  await logAudit({ actorType: "staff", actorId: staff.id, actorName: staff.name, action: "admin_login_success", ipAddress: ip });

  return NextResponse.json({ ok: true, role: staff.role });
}
