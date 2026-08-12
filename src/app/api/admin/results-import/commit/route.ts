import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { results, resultImports, students } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { notifyByIds } from "@/lib/notify";
import { toGoogleSheetCsvUrl } from "@/lib/csv";

const resultRowSchema = z.object({
  row: z.number().int().min(2),
  studentId: z.number().int().positive(),
  admissionNumber: z.string().trim().min(1).max(60),
  examName: z.string().trim().min(1).max(200),
  subject: z.string().trim().min(1).max(120),
  marks: z.number().finite().min(0).max(100),
  grade: z.string().trim().min(1).max(20),
  points: z.number().finite().min(0).max(12),
  teacherComment: z.string().max(2000),
  term: z.string().trim().min(1).max(50),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
}).strict();

const commitSchema = z.object({
  data: z.array(resultRowSchema).min(1).max(10_000),
  sourceUrl: z.string().trim().max(2_000).optional().default(""),
  totalRows: z.number().int().min(1).max(10_000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;

  const parsed = commitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "The import data is invalid. Please preview the spreadsheet again." }, { status: 400 });
  }

  const { data, sourceUrl } = parsed.data;
  if (sourceUrl && !toGoogleSheetCsvUrl(sourceUrl)) {
    return NextResponse.json({ error: "The spreadsheet URL is not a valid HTTPS Google Sheets URL." }, { status: 400 });
  }

  const studentIds = Array.from(new Set(data.map((row) => row.studentId)));
  const studentRows = await db
    .select({ id: students.id, admissionNumber: students.admissionNumber })
    .from(students)
    .where(inArray(students.id, studentIds));
  const studentsById = new Map(studentRows.map((student) => [student.id, student]));

  for (const row of data) {
    const student = studentsById.get(row.studentId);
    if (!student || student.admissionNumber.toLowerCase() !== row.admissionNumber.toLowerCase()) {
      return NextResponse.json({ error: "One or more students could not be verified. Please preview the spreadsheet again." }, { status: 400 });
    }
  }

  const totalRows = Math.max(parsed.data.totalRows || data.length, data.length);
  const invalidRows = totalRows - data.length;
  const importRecord = await db.transaction(async (tx) => {
    const insertedImports = await tx
      .insert(resultImports)
      .values({
        source: "google_sheet_csv",
        sourceUrl,
        importedByName: session.name,
        totalRows,
        validRows: data.length,
        invalidRows,
        status: "published",
      })
      .returning();
    const createdImport = insertedImports[0];

    await tx.insert(results).values(
      data.map((row) => ({
        studentId: row.studentId,
        admissionNumber: row.admissionNumber,
        examName: row.examName,
        subject: row.subject,
        marks: row.marks,
        grade: row.grade,
        points: row.points,
        teacherComment: row.teacherComment,
        term: row.term,
        year: row.year,
        importId: createdImport.id,
        status: "published",
      })),
    );

    return createdImport;
  });

  const uniqueStudentIds = Array.from(new Set(data.map((row) => row.studentId)));
  try {
    await notifyByIds("student", uniqueStudentIds, {
      type: "results-released",
      title: "New examination results are available",
      body: "Your latest examination results have been published. Sign in to the student portal to view them.",
      link: "/portal/results",
    });
  } catch (error) {
    // Results are already committed; a notification failure must not make the
    // administrator retry and accidentally duplicate the import.
    console.error("Failed to notify students about imported results", error);
  }

  await logAudit({
    actorType: "staff",
    actorId: session.id,
    actorName: session.name,
    action: "results_imported",
    targetType: "result_import",
    targetId: importRecord.id,
    details: { rows: data.length, sourceUrl },
  });

  return NextResponse.json({ ok: true, importId: importRecord.id, imported: data.length });
}
