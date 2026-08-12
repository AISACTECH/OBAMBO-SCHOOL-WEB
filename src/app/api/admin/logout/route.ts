import { NextResponse } from "next/server";
import { destroySession, getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

export async function POST() {
  const session = await getSession("staff");
  if (session) await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: "admin_logout" });
  await destroySession("staff");
  return NextResponse.json({ ok: true });
}
