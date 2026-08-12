import { NextResponse } from "next/server";
import { db } from "@/db";
import { alumni } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";

export async function GET() {
  const session = await requireStaff("manage_alumni");
  if (isResponse(session)) return session;
  const rows = await db.select().from(alumni).orderBy(desc(alumni.createdAt)).limit(1000);
  return NextResponse.json({ alumni: rows.map((a) => ({ ...a, passwordHash: undefined })) });
}
