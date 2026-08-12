import { db } from "@/db";
import { alumni, staffUsers, students } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, type SessionType } from "@/lib/session";

export async function currentIdentity(): Promise<{ type: SessionType; id: number; name: string } | null> {
  for (const type of ["student", "alumni", "staff"] as SessionType[]) {
    const session = await getSession(type);
    if (!session) continue;

    if (type === "student") {
      const [student] = await db.select({ id: students.id, name: students.name, status: students.status }).from(students).where(eq(students.id, session.id)).limit(1);
      if (student?.status === "active") return { type, id: student.id, name: student.name };
    }
    if (type === "alumni") {
      const [record] = await db.select({ id: alumni.id, name: alumni.name, active: alumni.active }).from(alumni).where(eq(alumni.id, session.id)).limit(1);
      if (record?.active) return { type, id: record.id, name: record.name };
    }
    if (type === "staff") {
      const [staff] = await db.select({ id: staffUsers.id, name: staffUsers.name, active: staffUsers.active }).from(staffUsers).where(eq(staffUsers.id, session.id)).limit(1);
      if (staff?.active) return { type, id: staff.id, name: staff.name };
    }
  }
  return null;
}
