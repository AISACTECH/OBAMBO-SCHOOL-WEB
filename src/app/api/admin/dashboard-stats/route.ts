import { NextResponse } from "next/server";
import { db } from "@/db";
import { students, announcements, resources, results, alumni, reports, contactMessages, events, groups } from "@/db/schema";
import { eq, sql, gte } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";

export async function GET() {
  const session = await requireStaff();
  if (isResponse(session)) return session;

  const [studentCount, announcementCount, resourceCount, resultCount, alumniCount, pendingReports, newMessages, upcomingEvents, groupCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(students),
    db.select({ count: sql<number>`count(*)` }).from(announcements).where(eq(announcements.status, "published")),
    db.select({ count: sql<number>`count(*)` }).from(resources),
    db.select({ count: sql<number>`count(*)` }).from(results),
    db.select({ count: sql<number>`count(*)` }).from(alumni),
    db.select({ count: sql<number>`count(*)` }).from(reports).where(eq(reports.status, "pending")),
    db.select({ count: sql<number>`count(*)` }).from(contactMessages).where(eq(contactMessages.status, "new")),
    db.select({ count: sql<number>`count(*)` }).from(events).where(gte(events.startAt, new Date())),
    db.select({ count: sql<number>`count(*)` }).from(groups),
  ]);

  return NextResponse.json({
    students: Number(studentCount[0].count),
    announcements: Number(announcementCount[0].count),
    resources: Number(resourceCount[0].count),
    results: Number(resultCount[0].count),
    alumni: Number(alumniCount[0].count),
    pendingReports: Number(pendingReports[0].count),
    newMessages: Number(newMessages[0].count),
    upcomingEvents: Number(upcomingEvents[0].count),
    groups: Number(groupCount[0].count),
  });
}
