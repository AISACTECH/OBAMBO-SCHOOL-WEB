import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { students } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { hashPassword, hashSensitive, last4 } from "@/lib/security";
import { logAudit } from "@/lib/audit";

const studentSchema = z.object({
  admissionNumber: z.string().trim().min(1).max(60),
  name: z.string().trim().min(2).max(120),
  form: z.string().trim().min(1).max(40).optional().default("Form 1"),
  stream: z.string().trim().max(60).optional().default(""),
  password: z.string().min(8).max(200),
  birthCertificateNumber: z.string().trim().min(1).max(60),
  admittedYear: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
});

export async function GET() {
  const session = await requireStaff("manage_users");
  if (isResponse(session)) return session;
  const rows = await db.select().from(students).orderBy(desc(students.createdAt));
  return NextResponse.json({
    students: rows.map(({ passwordHash: _passwordHash, birthCertHash: _birthCertHash, ...student }) => student),
  });
}

export async function POST(req: NextRequest) {
  const session = await requireStaff("manage_users");
  if (isResponse(session)) return session;

  const parsed = studentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Admission number, name, password and birth certificate number are required." }, { status: 400 });
  }
  const data = parsed.data;
  const admissionNumber = data.admissionNumber.toUpperCase();
  const existing = await db.select({ id: students.id }).from(students).where(eq(students.admissionNumber, admissionNumber)).limit(1);
  if (existing.length > 0) return NextResponse.json({ error: "A student with this admission number already exists." }, { status: 409 });

  const inserted = await db
    .insert(students)
    .values({
      admissionNumber,
      name: data.name,
      form: data.form,
      stream: data.stream,
      passwordHash: await hashPassword(data.password),
      birthCertHash: hashSensitive(data.birthCertificateNumber),
      birthCertLast4: last4(data.birthCertificateNumber),
      admittedYear: data.admittedYear || new Date().getFullYear(),
    })
    .returning();

  const student = inserted[0];
  await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: "student_created", targetType: "student", targetId: student.id });

  const { passwordHash: _passwordHash, birthCertHash: _birthCertHash, ...safeStudent } = student;
  return NextResponse.json({ student: safeStudent });
}
