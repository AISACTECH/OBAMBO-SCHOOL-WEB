import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { resultImports, results, students } from "@/db/schema";
import { logAudit } from "@/lib/audit";
import { notifyByIds } from "@/lib/notify";

export const EXPECTED_PERFORMANCE_HEADERS = ["Admission Number", "Student Name", "Form", "Stream", "Term", "Year", "Exam", "Subject", "Marks", "Grade", "Points", "Comment"];
export const REQUIRED_PERFORMANCE_HEADERS = ["Admission Number", "Term", "Year", "Exam", "Subject", "Marks", "Grade"];
export const MAX_RESULT_ROWS = 10_000;

export const resultRowSchema = z.object({
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

export type ResultRow = z.infer<typeof resultRowSchema>;
export type ResultError = { row: number; field: string; value: string; error: string; suggestedFix: string };
export type StudentLookup = { id: number; admissionNumber: string; name?: string; form?: string; stream?: string | null };

function error(row: number, field: string, value: string, message: string, suggestedFix: string): ResultError {
  return { row, field, value, error: message, suggestedFix };
}

function cell(row: unknown[], index: number) {
  return index < 0 ? "" : String(row[index] ?? "").trim();
}

function normalizeKeyPart(value: string | number) {
  return String(value).trim().replace(/\s+/g, " ").toLowerCase();
}

export function resultKey(row: Pick<ResultRow, "studentId" | "examName" | "subject" | "term" | "year">) {
  return [row.studentId, row.examName, row.subject, row.term, row.year].map(normalizeKeyPart).join("|");
}

export function validatePerformanceRows(rawRows: unknown[][], allStudents: StudentLookup[]) {
  if (rawRows.length < 2) throw new Error("No data rows found in the spreadsheet.");
  const header = rawRows[0].map((value, index) => {
    const normalized = String(value ?? "");
    return (index === 0 ? normalized.replace(/^\uFEFF/, "") : normalized).trim();
  });
  const dataRows = rawRows.slice(1).filter((row) => row.some((value) => String(value ?? "").trim().length > 0));
  if (dataRows.length === 0) throw new Error("No data rows found in the spreadsheet.");
  if (dataRows.length > MAX_RESULT_ROWS) throw new Error(`The spreadsheet contains too many rows. Maximum is ${MAX_RESULT_ROWS.toLocaleString()}.`);

  const column = (name: string) => header.findIndex((value) => value.toLowerCase() === name.toLowerCase());
  const index = {
    admissionNumber: column("Admission Number"),
    studentName: column("Student Name"),
    form: column("Form"),
    stream: column("Stream"),
    term: column("Term"),
    year: column("Year"),
    exam: column("Exam"),
    subject: column("Subject"),
    marks: column("Marks"),
    grade: column("Grade"),
    points: column("Points"),
    comment: column("Comment"),
  };
  const missingColumns = REQUIRED_PERFORMANCE_HEADERS.filter((name) => column(name) === -1);
  if (missingColumns.length) throw new Error(`Missing required spreadsheet columns: ${missingColumns.join(", ")}. Expected template: ${EXPECTED_PERFORMANCE_HEADERS.join(", ")}`);

  const byAdmission = new Map(allStudents.map((student) => [student.admissionNumber.toLowerCase(), student]));
  const errors: ResultError[] = [];
  const validRows: ResultRow[] = [];
  const seen = new Set<string>();

  dataRows.forEach((rawRow, offset) => {
    const rowNumber = offset + 2;
    const admissionNumber = cell(rawRow, index.admissionNumber);
    const studentName = cell(rawRow, index.studentName);
    const form = cell(rawRow, index.form);
    const stream = cell(rawRow, index.stream);
    const term = cell(rawRow, index.term);
    const yearRaw = cell(rawRow, index.year);
    const examName = cell(rawRow, index.exam);
    const subject = cell(rawRow, index.subject);
    const marksRaw = cell(rawRow, index.marks);
    const grade = cell(rawRow, index.grade);
    const pointsRaw = cell(rawRow, index.points);
    const teacherComment = cell(rawRow, index.comment);
    const marks = Number(marksRaw);
    const year = Number(yearRaw);
    const points = Number(pointsRaw || "0");
    let invalid = false;

    if (!admissionNumber) {
      errors.push(error(rowNumber, "Admission Number", admissionNumber, "Admission number is missing", "Provide the student's admission number"));
      invalid = true;
    }
    const student = byAdmission.get(admissionNumber.toLowerCase());
    if (admissionNumber && !student) {
      errors.push(error(rowNumber, "Admission Number", admissionNumber, "Student not found", "Check the admission number against school records"));
      invalid = true;
    }
    if (studentName && student && student.name && studentName.toLowerCase() !== student.name.toLowerCase()) {
      errors.push(error(rowNumber, "Student Name", studentName, "Student name does not match the admission number", "Use the official student name or correct the admission number"));
      invalid = true;
    }
    if (form && student?.form && form.toLowerCase() !== student.form.toLowerCase()) {
      errors.push(error(rowNumber, "Form", form, "Form does not match the student record", "Correct the form or admission number"));
      invalid = true;
    }
    if (!subject || subject.length > 120) {
      errors.push(error(rowNumber, "Subject", subject, "Subject is missing or too long", "Provide a subject name (maximum 120 characters)"));
      invalid = true;
    }
    if (!marksRaw || !Number.isFinite(marks) || marks < 0 || marks > 100) {
      errors.push(error(rowNumber, "Marks", marksRaw, "Marks must be a number between 0 and 100", "Correct the marks value"));
      invalid = true;
    }
    if (!grade || grade.length > 20) {
      errors.push(error(rowNumber, "Grade", grade, "Grade is missing or too long", "Provide a grade such as B+, C or A-"));
      invalid = true;
    }
    if (!examName || examName.length > 200) {
      errors.push(error(rowNumber, "Exam", examName, "Exam name is missing or too long", "Provide an examination name"));
      invalid = true;
    }
    if (!term || term.length > 50 || !Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      errors.push(error(rowNumber, "Term/Year", `${term} ${yearRaw}`, "Term or year is missing or invalid", "Provide a valid term and year"));
      invalid = true;
    }
    if (!Number.isFinite(points) || points < 0 || points > 12) {
      errors.push(error(rowNumber, "Points", pointsRaw, "Points must be a number between 0 and 12", "Correct the points value or leave it blank"));
      invalid = true;
    }
    if (teacherComment.length > 2000) {
      errors.push(error(rowNumber, "Comment", teacherComment, "Comment is too long", "Shorten the comment to 2,000 characters"));
      invalid = true;
    }

    if (!invalid && student) {
      const candidate: ResultRow = {
        row: rowNumber,
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        examName,
        subject,
        marks,
        grade,
        points,
        teacherComment,
        term,
        year,
      };
      const key = resultKey(candidate);
      if (seen.has(key)) {
        errors.push(error(rowNumber, "Duplicate Row", key, "The same student, examination, subject, term and year appears more than once", "Remove the duplicate row"));
      } else {
        seen.add(key);
        validRows.push(candidate);
      }
    }
  });

  return {
    totalRows: dataRows.length,
    validRows: validRows.length,
    invalidRows: new Set(errors.map((item) => item.row)).size,
    errorReport: errors,
    data: validRows,
  };
}

export async function commitResultRows(input: {
  data: ResultRow[];
  source: "google_sheet_api" | "google_sheet_csv";
  sourceUrl: string;
  totalRows: number;
  errorReport?: ResultError[];
  importedBy: { id: number; name: string };
}) {
  const data = input.data.map((row) => resultRowSchema.parse(row));
  if (!data.length) throw new Error("No valid rows to import.");
  const studentIds = Array.from(new Set(data.map((row) => row.studentId)));
  const studentRows = await db.select({ id: students.id, admissionNumber: students.admissionNumber }).from(students).where(inArray(students.id, studentIds));
  const studentsById = new Map(studentRows.map((student) => [student.id, student]));
  for (const row of data) {
    const student = studentsById.get(row.studentId);
    if (!student || student.admissionNumber.toLowerCase() !== row.admissionNumber.toLowerCase()) throw new Error("One or more students could not be verified.");
  }

  const totalRows = Math.max(input.totalRows, data.length);
  const previousRows: Array<typeof results.$inferSelect> = [];
  const changedStudentIds = new Set<number>();
  const counts = { inserted: 0, updated: 0, unchanged: 0 };
  const importRecord = await db.transaction(async (tx) => {
    const [createdImport] = await tx.insert(resultImports).values({
      source: input.source,
      sourceUrl: input.sourceUrl,
      importedByName: input.importedBy.name,
      totalRows,
      validRows: data.length,
      invalidRows: Math.max(0, totalRows - data.length),
      status: "published",
      errorReport: input.errorReport || [],
      previousRows: [],
    }).returning();

    const existingRows = await tx.select().from(results).where(inArray(results.studentId, studentIds));
    const existingByKey = new Map(existingRows.map((row) => [row.logicalKey || resultKey({ studentId: row.studentId, examName: row.examName, subject: row.subject, term: row.term, year: row.year }), row]));

    for (const row of data) {
      const key = resultKey(row);
      const existing = existingByKey.get(key);
      const { row: _sourceRow, ...resultValues } = row;
      if (!existing) {
        await tx.insert(results).values({ ...resultValues, logicalKey: key, importId: createdImport.id, status: "published" }).onConflictDoUpdate({
          target: results.logicalKey,
          set: { admissionNumber: row.admissionNumber, marks: row.marks, grade: row.grade, points: row.points, teacherComment: row.teacherComment, importId: createdImport.id, status: "published" },
        });
        changedStudentIds.add(row.studentId);
        counts.inserted += 1;
        continue;
      }

      const changed = existing.marks !== row.marks || existing.grade !== row.grade || (existing.points || 0) !== row.points || (existing.teacherComment || "") !== row.teacherComment || existing.admissionNumber !== row.admissionNumber;
      if (!changed && existing.logicalKey === key) {
        counts.unchanged += 1;
        continue;
      }
      if (changed) previousRows.push(existing);
      await tx.update(results).set({ logicalKey: key, admissionNumber: row.admissionNumber, marks: row.marks, grade: row.grade, points: row.points, teacherComment: row.teacherComment, importId: changed ? createdImport.id : existing.importId, status: changed ? "published" : existing.status }).where(eq(results.id, existing.id));
      changedStudentIds.add(row.studentId);
      if (changed) counts.updated += 1;
      else counts.unchanged += 1;
    }

    await tx.update(resultImports).set({ previousRows }).where(eq(resultImports.id, createdImport.id));
    return createdImport;
  });

  try {
    await notifyByIds("student", Array.from(changedStudentIds), {
      type: "results-released",
      title: "New examination results are available",
      body: "Your latest examination results have been published. Sign in to the student portal to view them.",
      link: "/portal/results",
    });
  } catch (notificationError) {
    console.error("Failed to notify students about imported results", notificationError);
  }

  await logAudit({
    actorType: "staff",
    actorId: input.importedBy.id,
    actorName: input.importedBy.name,
    action: "results_imported",
    targetType: "result_import",
    targetId: importRecord.id,
    details: { source: input.source, rows: data.length, inserted: counts.inserted, updated: counts.updated, unchanged: counts.unchanged, sourceUrl: input.sourceUrl },
  });
  return { importId: importRecord.id, imported: data.length, ...counts };
}
