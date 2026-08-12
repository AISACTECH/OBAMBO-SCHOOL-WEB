import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, hashSensitive, rateLimit, getClientIp } from "@/lib/security";
import { createSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  admissionNumber: z.string().min(1).max(60),
  password: z.string().min(1).max(200),
  birthCertificateNumber: z.string().min(1).max(60),
});

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`student-login:${ip}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json({ error: "Too many login attempts from this device. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in all fields correctly." }, { status: 400 });
  }
  const { password, birthCertificateNumber } = parsed.data;
  const admissionNumber = parsed.data.admissionNumber.trim().toUpperCase();

  const rows = await db.select().from(students).where(eq(students.admissionNumber, admissionNumber)).limit(1);
  const student = rows[0];

  const genericError = "Invalid admission number, password or birth certificate number.";

  if (!student) {
    await logAudit({ actorType: "system", actorName: "Unknown", action: "student_login_failed", ipAddress: ip, details: { admissionNumber } });
    return NextResponse.json({ error: genericError }, { status: 401 });
  }

  if (student.lockedUntil && new Date(student.lockedUntil) > new Date()) {
    return NextResponse.json({ error: "This account is temporarily locked due to multiple failed attempts. Please try again later." }, { status: 423 });
  }

  const [passwordOk, birthCertOk] = await Promise.all([
    verifyPassword(password, student.passwordHash),
    Promise.resolve(hashSensitive(birthCertificateNumber) === student.birthCertHash),
  ]);

  if (!passwordOk || !birthCertOk) {
    const attempts = student.failedLoginAttempts + 1;
    const locked = attempts >= MAX_ATTEMPTS;
    await db
      .update(students)
      .set({
        failedLoginAttempts: locked ? 0 : attempts,
        lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null,
      })
      .where(eq(students.id, student.id));
    await logAudit({ actorType: "student", actorId: student.id, actorName: student.name, action: "student_login_failed", ipAddress: ip });
    return NextResponse.json({ error: genericError }, { status: 401 });
  }

  if (student.status !== "active") {
    return NextResponse.json({ error: "This account is not currently active. Please contact the school administration." }, { status: 403 });
  }

  await db.update(students).set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }).where(eq(students.id, student.id));
  await createSession({ id: student.id, name: student.name, role: "student", type: "student", form: student.form, admissionNumber: student.admissionNumber });
  await logAudit({ actorType: "student", actorId: student.id, actorName: student.name, action: "student_login_success", ipAddress: ip });

  return NextResponse.json({ ok: true });
}
