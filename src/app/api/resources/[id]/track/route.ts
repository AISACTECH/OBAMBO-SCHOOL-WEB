import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getClientIp, rateLimit } from "@/lib/security";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resourceId = Number(id);
  if (!Number.isFinite(resourceId)) return NextResponse.json({ error: "Invalid resource" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const action = body?.action;
  if (action !== "view" && action !== "download") {
    return NextResponse.json({ error: "Invalid tracking action." }, { status: 400 });
  }

  const limit = rateLimit(`resource-track:${getClientIp(req.headers)}:${resourceId}`, 60, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many tracking requests." }, { status: 429 });

  const field = action === "download" ? resources.downloadCount : resources.viewCount;
  const column = action === "download" ? "downloadCount" : "viewCount";
  const updated = await db
    .update(resources)
    .set({ [column]: sql`${field} + 1` })
    .where(and(eq(resources.id, resourceId), eq(resources.status, "published")))
    .returning({ id: resources.id });

  if (updated.length === 0) return NextResponse.json({ error: "Resource not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
