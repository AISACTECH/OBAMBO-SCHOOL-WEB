import { NextResponse } from "next/server";
import { db } from "@/db";
import { reports } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";

export async function GET() {
  const session = await requireStaff("moderate_community");
  if (isResponse(session)) return session;
  const rows = await db.select().from(reports).orderBy(desc(reports.createdAt));
  return NextResponse.json({ reports: rows });
}
