import { NextResponse } from "next/server";
import { db } from "@/db";
import { alumni, staffUsers, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, type SessionPayload } from "@/lib/session";
import { hasPermission, type Permission } from "@/lib/permissions";

export async function requireStudent(): Promise<SessionPayload | NextResponse> {
  const session = await getSession("student");
  if (!session || session.type !== "student") {
    return NextResponse.json({ error: "Please sign in to the student portal." }, { status: 401 });
  }
  const [student] = await db.select({ status: students.status }).from(students).where(eq(students.id, session.id)).limit(1);
  if (!student || student.status !== "active") {
    return NextResponse.json({ error: "This student account is not currently active." }, { status: 403 });
  }
  return session;
}

export async function requireAlumni(): Promise<SessionPayload | NextResponse> {
  const session = await getSession("alumni");
  if (!session || session.type !== "alumni") {
    return NextResponse.json({ error: "Please sign in to your alumni account." }, { status: 401 });
  }
  const [record] = await db.select({ active: alumni.active }).from(alumni).where(eq(alumni.id, session.id)).limit(1);
  if (!record || !record.active) {
    return NextResponse.json({ error: "This alumni account is not currently active." }, { status: 403 });
  }
  return session;
}

export async function requireStaff(permission?: Permission): Promise<SessionPayload | NextResponse> {
  const session = await getSession("staff");
  if (!session || session.type !== "staff") {
    return NextResponse.json({ error: "Please sign in to the School Control Center." }, { status: 401 });
  }
  const [staff] = await db.select({ active: staffUsers.active, role: staffUsers.role, name: staffUsers.name }).from(staffUsers).where(eq(staffUsers.id, session.id)).limit(1);
  if (!staff || !staff.active) {
    return NextResponse.json({ error: "This staff account is not currently active." }, { status: 403 });
  }
  const currentSession = { ...session, role: staff.role, name: staff.name };
  if (permission && !hasPermission(currentSession.role, permission)) {
    return NextResponse.json({ error: "You do not have permission to perform this action." }, { status: 403 });
  }
  return currentSession;
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
