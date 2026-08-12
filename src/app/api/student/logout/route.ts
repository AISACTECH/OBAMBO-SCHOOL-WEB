import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession("student");
  if (session) {
    await logAudit({ actorType: "student", actorId: session.id, actorName: session.name, action: "student_logout" });
  }
  await destroySession("student");
  return NextResponse.json({ ok: true });
}
