import { NextResponse } from "next/server";
import { db } from "@/db";
import { contactMessages, feedback } from "@/db/schema";
import { desc } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";

export async function GET() {
  const session = await requireStaff("manage_content");
  if (isResponse(session)) return session;
  const [messages, feedbackRows] = await Promise.all([
    db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)),
    db.select().from(feedback).orderBy(desc(feedback.createdAt)),
  ]);
  return NextResponse.json({ messages, feedback: feedbackRows });
}
