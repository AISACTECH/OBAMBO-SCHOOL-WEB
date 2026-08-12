import { NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";

export async function GET() {
  const session = await requireStaff("view_audit_logs");
  if (isResponse(session)) return session;
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200);
  return NextResponse.json({ logs: rows });
}
