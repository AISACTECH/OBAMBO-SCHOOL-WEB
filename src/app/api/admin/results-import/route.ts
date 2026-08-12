import { NextResponse } from "next/server";
import { db } from "@/db";
import { resultImports } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";

export async function GET() {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;
  const rows = await db.select().from(resultImports).orderBy(desc(resultImports.createdAt));
  return NextResponse.json({ imports: rows });
}
