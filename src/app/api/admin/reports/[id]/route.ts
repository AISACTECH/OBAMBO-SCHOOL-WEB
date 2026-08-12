import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports, posts, comments } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff("moderate_community");
  if (isResponse(session)) return session;
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isSafeInteger(numericId) || numericId < 1) return NextResponse.json({ error: "Invalid report id." }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const action = body.action;
  const resolution = typeof body.resolution === "string" ? body.resolution.slice(0, 500) : "";
  if (!["remove_content", "hide_content", "dismiss"].includes(action)) {
    return NextResponse.json({ error: "Invalid moderation action." }, { status: 400 });
  }

  const [report] = await db.select().from(reports).where(eq(reports.id, numericId));
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });

  if (action === "remove_content") {
    if (report.targetType === "post") await db.update(posts).set({ status: "removed" }).where(eq(posts.id, report.targetId));
    if (report.targetType === "comment") await db.update(comments).set({ status: "removed" }).where(eq(comments.id, report.targetId));
  }
  if (action === "hide_content") {
    if (report.targetType === "post") await db.update(posts).set({ status: "hidden" }).where(eq(posts.id, report.targetId));
    if (report.targetType === "comment") await db.update(comments).set({ status: "hidden" }).where(eq(comments.id, report.targetId));
  }

  await db.update(reports).set({ status: "resolved", resolution: resolution || action, resolvedById: session.id }).where(eq(reports.id, numericId));
  await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: `moderation_${action}`, targetType: report.targetType, targetId: report.targetId });

  return NextResponse.json({ ok: true });
}
