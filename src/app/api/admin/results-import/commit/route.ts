import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff, isResponse } from "@/lib/guards";
import { commitResultRows, resultRowSchema } from "@/lib/result-import";
import { toGoogleSheetCsvUrl } from "@/lib/csv";

const commitSchema = z.object({
  data: z.array(resultRowSchema).min(1).max(10_000),
  sourceUrl: z.string().trim().max(2_000).optional().default(""),
  totalRows: z.number().int().min(1).max(10_000).optional(),
  errorReport: z.array(z.object({ row: z.number().int(), field: z.string().max(100), value: z.string().max(2_000), error: z.string().max(500), suggestedFix: z.string().max(500) }).strict()).max(10_000).optional().default([]),
});

export async function POST(req: NextRequest) {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;

  const parsed = commitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "The import data is invalid. Please preview the spreadsheet again." }, { status: 400 });
  if (parsed.data.sourceUrl && !toGoogleSheetCsvUrl(parsed.data.sourceUrl)) {
    return NextResponse.json({ error: "The spreadsheet URL is not a valid HTTPS Google Sheets URL." }, { status: 400 });
  }

  try {
    const result = await commitResultRows({
      data: parsed.data.data,
      source: "google_sheet_csv",
      sourceUrl: parsed.data.sourceUrl,
      totalRows: parsed.data.totalRows || parsed.data.data.length,
      errorReport: parsed.data.errorReport,
      importedBy: { id: session.id, name: session.name },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The result import could not be completed." }, { status: 400 });
  }
}
