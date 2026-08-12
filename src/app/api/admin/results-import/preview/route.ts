import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireStaff, isResponse } from "@/lib/guards";
import { parseCsv, toGoogleSheetCsvUrl } from "@/lib/csv";

const EXPECTED_HEADERS = ["Admission Number", "Student Name", "Form", "Term", "Year", "Exam", "Subject", "Marks", "Grade", "Points", "Comment"];
const REQUIRED_HEADERS = ["Admission Number", "Term", "Year", "Exam", "Subject", "Marks", "Grade"];
const MAX_CSV_LENGTH = 5 * 1024 * 1024;
const MAX_DATA_ROWS = 10_000;

export async function POST(req: NextRequest) {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => ({}));
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const csvText = typeof body.csvText === "string" ? body.csvText : "";
  let text = csvText;

  if (text.length > MAX_CSV_LENGTH) {
    return NextResponse.json({ error: "The spreadsheet is too large. Maximum size is 5MB." }, { status: 400 });
  }

  if (!text) {
    if (!sourceUrl) return NextResponse.json({ error: "Please provide a Google Sheet link or CSV URL." }, { status: 400 });
    const csvUrl = toGoogleSheetCsvUrl(sourceUrl);
    if (!csvUrl) {
      return NextResponse.json({ error: "Please provide a valid HTTPS Google Sheets URL." }, { status: 400 });
    }
    try {
      const res = await fetch(csvUrl, { signal: AbortSignal.timeout(10_000), redirect: "error" });
      if (!res.ok) throw new Error("fetch failed");
      const contentLength = Number(res.headers.get("content-length") || 0);
      if (contentLength > MAX_CSV_LENGTH) throw new Error("response too large");
      text = await res.text();
      if (text.length > MAX_CSV_LENGTH) throw new Error("response too large");
    } catch {
      return NextResponse.json({ error: "Could not fetch the spreadsheet. Make sure it is published/shared as 'Anyone with the link can view'." }, { status: 400 });
    }
  }

  const rows = parseCsv(text);
  if (rows.length < 2) return NextResponse.json({ error: "No data rows found in the spreadsheet." }, { status: 400 });

  const header = rows[0].map((h, i) => (i === 0 ? h.replace(/^\uFEFF/, "") : h).trim());
  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_DATA_ROWS) {
    return NextResponse.json({ error: `The spreadsheet contains too many rows. Maximum is ${MAX_DATA_ROWS.toLocaleString()}.` }, { status: 400 });
  }

  const colIndex = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const idx = {
    admissionNumber: colIndex("Admission Number"),
    studentName: colIndex("Student Name"),
    form: colIndex("Form"),
    term: colIndex("Term"),
    year: colIndex("Year"),
    exam: colIndex("Exam"),
    subject: colIndex("Subject"),
    marks: colIndex("Marks"),
    grade: colIndex("Grade"),
    points: colIndex("Points"),
    comment: colIndex("Comment"),
  };

  const missingColumns = REQUIRED_HEADERS.filter((name) => colIndex(name) === -1);
  if (missingColumns.length > 0) {
    return NextResponse.json({ error: `Missing required spreadsheet columns: ${missingColumns.join(", ")}. Expected template: ${EXPECTED_HEADERS.join(", ")}` }, { status: 400 });
  }

  const allStudents = await db.select().from(students);
  const byAdmission = new Map(allStudents.map((s) => [s.admissionNumber.toLowerCase(), s]));

  const errorReport: { row: number; field: string; value: string; error: string; suggestedFix: string }[] = [];
  const validRows: Record<string, unknown>[] = [];

  dataRows.forEach((r, i) => {
    const rowNum = i + 2; // account for header row, 1-indexed
    const admissionNumber = (r[idx.admissionNumber] || "").trim();
    const marksRaw = (r[idx.marks] || "").trim();
    const marks = Number(marksRaw);
    const grade = (r[idx.grade] || "").trim();
    const subject = (r[idx.subject] || "").trim();
    const term = (r[idx.term] || "").trim();
    const yearRaw = (r[idx.year] || "").trim();
    const year = Number(yearRaw);
    const exam = (r[idx.exam] || "").trim();
    const pointsRaw = idx.points === -1 ? "0" : (r[idx.points] || "").trim();
    const points = Number(pointsRaw || "0");
    const comment = (r[idx.comment] || "").trim();

    let rowHasError = false;
    if (!admissionNumber) {
      errorReport.push({ row: rowNum, field: "Admission Number", value: admissionNumber, error: "Admission number is missing", suggestedFix: "Provide the student's admission number" });
      rowHasError = true;
    } else if (!byAdmission.has(admissionNumber.toLowerCase())) {
      errorReport.push({ row: rowNum, field: "Admission Number", value: admissionNumber, error: "Student not found", suggestedFix: "Check the admission number against school records" });
      rowHasError = true;
    }
    if (!subject || subject.length > 120) {
      errorReport.push({ row: rowNum, field: "Subject", value: subject, error: "Subject is missing or too long", suggestedFix: "Provide a subject name (maximum 120 characters)" });
      rowHasError = true;
    }
    if (marksRaw === "" || !Number.isFinite(marks) || marks < 0 || marks > 100) {
      errorReport.push({ row: rowNum, field: "Marks", value: marksRaw, error: "Marks must be a number between 0 and 100", suggestedFix: "Correct the marks value" });
      rowHasError = true;
    }
    if (!grade || grade.length > 20) {
      errorReport.push({ row: rowNum, field: "Grade", value: grade, error: "Grade is missing or too long", suggestedFix: "Provide a grade (e.g. B+, C, A-)" });
      rowHasError = true;
    }
    if (!exam || exam.length > 200) {
      errorReport.push({ row: rowNum, field: "Exam", value: exam, error: "Exam name is missing or too long", suggestedFix: "Provide an exam name, e.g. Term 2 Mid-Term" });
      rowHasError = true;
    }
    if (!term || term.length > 50 || !Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) {
      errorReport.push({ row: rowNum, field: "Term/Year", value: `${term} ${yearRaw}`, error: "Term or year is missing/invalid", suggestedFix: "Provide term (e.g. Term 1) and a valid numeric year" });
      rowHasError = true;
    }
    if (!Number.isFinite(points) || points < 0 || points > 12) {
      errorReport.push({ row: rowNum, field: "Points", value: pointsRaw, error: "Points must be a number between 0 and 12", suggestedFix: "Correct the points value or leave it blank" });
      rowHasError = true;
    }
    if (comment.length > 2000) {
      errorReport.push({ row: rowNum, field: "Comment", value: comment, error: "Comment is too long", suggestedFix: "Shorten the comment to 2,000 characters" });
      rowHasError = true;
    }

    if (!rowHasError) {
      const student = byAdmission.get(admissionNumber.toLowerCase())!;
      validRows.push({
        row: rowNum,
        studentId: student.id,
        admissionNumber: student.admissionNumber,
        examName: exam,
        subject,
        marks,
        grade,
        points,
        teacherComment: comment,
        term,
        year,
      });
    }
  });

  return NextResponse.json({
    totalRows: dataRows.length,
    validRows: validRows.length,
    invalidRows: errorReport.length > 0 ? new Set(errorReport.map((e) => e.row)).size : 0,
    errorReport,
    data: validRows,
    sourceUrl: sourceUrl || "",
  });
}
