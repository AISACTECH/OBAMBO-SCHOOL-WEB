import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { students } from "@/db/schema";
import { requireStaff, isResponse } from "@/lib/guards";
import { parseCsv, toGoogleSheetCsvUrl } from "@/lib/csv";
import { MAX_RESULT_ROWS, validatePerformanceRows } from "@/lib/result-import";

const MAX_CSV_LENGTH = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => ({}));
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const csvText = typeof body.csvText === "string" ? body.csvText : "";
  let text = csvText;

  if (text.length > MAX_CSV_LENGTH) return NextResponse.json({ error: "The spreadsheet is too large. Maximum size is 5MB." }, { status: 400 });
  if (!text) {
    if (!sourceUrl) return NextResponse.json({ error: "Please provide a Google Sheet link or CSV URL." }, { status: 400 });
    const csvUrl = toGoogleSheetCsvUrl(sourceUrl);
    if (!csvUrl) return NextResponse.json({ error: "Please provide a valid HTTPS Google Sheets URL." }, { status: 400 });
    try {
      const response = await fetch(csvUrl, { signal: AbortSignal.timeout(10_000), redirect: "error" });
      if (!response.ok) throw new Error("fetch failed");
      const contentLength = Number(response.headers.get("content-length") || 0);
      if (contentLength > MAX_CSV_LENGTH) throw new Error("response too large");
      text = await response.text();
      if (text.length > MAX_CSV_LENGTH) throw new Error("response too large");
    } catch {
      return NextResponse.json({ error: "Could not fetch the spreadsheet. Make sure it is published/shared as 'Anyone with the link can view'." }, { status: 400 });
    }
  }

  let preview;
  try {
    const rows = parseCsv(text);
    if (rows.length > MAX_RESULT_ROWS + 1) return NextResponse.json({ error: `The spreadsheet contains too many rows. Maximum is ${MAX_RESULT_ROWS.toLocaleString()}.` }, { status: 400 });
    const allStudents = await db.select({ id: students.id, admissionNumber: students.admissionNumber, name: students.name, form: students.form, stream: students.stream }).from(students);
    preview = validatePerformanceRows(rows, allStudents);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not validate the spreadsheet." }, { status: 400 });
  }

  return NextResponse.json({ ...preview, sourceUrl });
}
