import { db } from "@/db";
import { students } from "@/db/schema";
import { getGoogleAccessToken, getGoogleSheetConnection } from "@/lib/google-sheet-connection";
import { getSpreadsheetValues } from "@/lib/google-sheets";
import { validatePerformanceRows } from "@/lib/result-import";

export function qualifiedGoogleRange(worksheetTitle: string, dataRange: string) {
  if (dataRange.includes("!")) return dataRange;
  const escapedTitle = worksheetTitle.replace(/'/g, "''");
  return `'${escapedTitle}'!${dataRange}`;
}

export async function previewGooglePerformance(connection: NonNullable<Awaited<ReturnType<typeof getGoogleSheetConnection>>>) {
  if (!connection.spreadsheetId) throw new Error("Configure a spreadsheet before syncing.");
  const accessToken = await getGoogleAccessToken(connection);
  const rows = await getSpreadsheetValues(connection.spreadsheetId, qualifiedGoogleRange(connection.worksheetTitle, connection.dataRange), accessToken);
  const allStudents = await db.select({ id: students.id, admissionNumber: students.admissionNumber, name: students.name, form: students.form, stream: students.stream }).from(students);
  const preview = validatePerformanceRows(rows, allStudents);
  return {
    ...preview,
    sourceUrl: `https://docs.google.com/spreadsheets/d/${connection.spreadsheetId}/edit`,
    worksheetTitle: connection.worksheetTitle,
    dataRange: connection.dataRange,
  };
}
