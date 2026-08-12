import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  form: z.string().trim().min(1).max(40).optional(),
  stream: z.string().trim().max(60).optional(),
  status: z.enum(["active", "suspended", "graduated", "inactive"]).optional(),
  admittedYear: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).nullable().optional(),
}).strict();

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff("manage_users");
  if (isResponse(session)) return session;
  const { id } = await params;
  const studentId = Number(id);
  if (!Number.isSafeInteger(studentId) || studentId < 1) return NextResponse.json({ error: "Invalid student id." }, { status: 400 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || Object.keys(parsed.data).length === 0) return NextResponse.json({ error: "No valid fields were provided." }, { status: 400 });
  const updated = await db.update(students).set(parsed.data).where(eq(students.id, studentId)).returning({ id: students.id });
  if (updated.length === 0) return NextResponse.json({ error: "Student not found." }, { status: 404 });
  await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: "student_updated", targetType: "student", targetId: studentId, details: parsed.data });
  return NextResponse.json({ ok: true });
}
