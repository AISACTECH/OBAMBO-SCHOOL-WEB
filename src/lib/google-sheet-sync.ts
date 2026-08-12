import { db } from "@/db";
import { students } from "@/db/schema";
import { getGoogleAccessToken, getGoogleSheetConnection } from "@/lib/google-sheet-connection";
import { getSpreadsheetValues } from "@/lib/google-sheets";
import { MAX_RESULT_ROWS, validatePerformanceRows } from "@/lib/result-import";

function boundedRange(dataRange: string) {
  const [sheetPrefix, range = ""] = dataRange.includes("!") ? dataRange.split(/!(.*)$/) : ["", dataRange];
  const unboundedRows = range.match(/^([A-Z]+)([1-9][0-9]*):([A-Z]+)$/i);
  const prefix = sheetPrefix ? `${sheetPrefix.startsWith("'") ? sheetPrefix : `'${sheetPrefix.replace(/'/g, "''")}'`}!` : "";
  if (unboundedRows) return `${prefix}${unboundedRows[1]}${unboundedRows[2]}:${unboundedRows[3]}${MAX_RESULT_ROWS + 1}`;
  const boundedRows = range.match(/^([A-Z]+)([1-9][0-9]*):([A-Z]+)([1-9][0-9]*)$/i);
  if (boundedRows && Number(boundedRows[4]) > MAX_RESULT_ROWS + 1) throw new Error(`The configured range cannot exceed ${MAX_RESULT_ROWS.toLocaleString()} data rows.`);
  return dataRange;
}

export function qualifiedGoogleRange(worksheetTitle: string, dataRange: string) {
  const bounded = boundedRange(dataRange);
  if (bounded.includes("!")) return bounded;
  const escapedTitle = worksheetTitle.replace(/'/g, "''");
  return `'${escapedTitle}'!${bounded}`;
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
