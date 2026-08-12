import { NextResponse } from "next/server";
import { db } from "@/db";
import { results } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireStudent, isResponse } from "@/lib/guards";

export async function GET() {
  const session = await requireStudent();
  if (isResponse(session)) return session;

  // Server-side authorization: results are only ever fetched for the
  // authenticated student's own numeric id. No client-supplied identifier
  // is ever trusted for this lookup.
  const rows = await db.select().from(results).where(and(eq(results.studentId, session.id), eq(results.status, "published")));

  const examGroups = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = `${r.examName}__${r.term}__${r.year}`;
    if (!examGroups.has(key)) examGroups.set(key, []);
    examGroups.get(key)!.push(r);
  }

  const exams = Array.from(examGroups.entries()).map(([key, subjectResults]) => {
    const [examName, term, year] = key.split("__");
    const totalPoints = subjectResults.reduce((sum, r) => sum + (r.points || 0), 0);
    const avgMarks = subjectResults.reduce((sum, r) => sum + r.marks, 0) / subjectResults.length;
    return {
      examName,
      term,
      year: Number(year),
      subjects: subjectResults.map((r) => ({
        subject: r.subject,
        marks: r.marks,
        grade: r.grade,
        points: r.points,
        comment: r.teacherComment,
      })),
      averageMarks: Math.round(avgMarks * 10) / 10,
      totalPoints,
    };
  });

  exams.sort((a, b) => (b.year - a.year) || a.examName.localeCompare(b.examName));

  return NextResponse.json({ exams });
}
