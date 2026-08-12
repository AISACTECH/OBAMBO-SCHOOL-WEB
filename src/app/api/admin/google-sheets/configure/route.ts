import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { googleSheetConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { getGoogleAccessToken, getGoogleSheetConnection, publicGoogleSheetConnection } from "@/lib/google-sheet-connection";
import { getSpreadsheetMetadata, parseSpreadsheetId } from "@/lib/google-sheets";
import { googleSheetsSyncEnabled } from "@/lib/google-sheets-feature";

export const runtime = "nodejs";

const configureSchema = z.object({
  spreadsheetUrl: z.string().trim().min(1).max(500),
  worksheetTitle: z.string().trim().min(1).max(200).default("Performance"),
  dataRange: z.string().trim().min(1).max(120).regex(/^[A-Za-z0-9 _!:$]+$/).default("A1:M"),
}).strict();

export async function POST(req: NextRequest) {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;
  if (!googleSheetsSyncEnabled()) return NextResponse.json({ error: "Google Sheets sync is disabled." }, { status: 503 });

  const parsed = configureSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please provide a spreadsheet URL, worksheet and valid range." }, { status: 400 });
  const connection = await getGoogleSheetConnection();
  if (!connection) return NextResponse.json({ error: "Connect a Google account before configuring a spreadsheet." }, { status: 400 });
  const spreadsheetId = parseSpreadsheetId(parsed.data.spreadsheetUrl);
  if (!spreadsheetId) return NextResponse.json({ error: "That is not a valid Google Sheets URL or spreadsheet ID." }, { status: 400 });

  try {
    const accessToken = await getGoogleAccessToken(connection);
    const metadata = await getSpreadsheetMetadata(spreadsheetId, accessToken);
    const sheet = metadata.properties?.sheets?.find((item) => item.properties?.title === parsed.data.worksheetTitle);
    if (!sheet?.properties?.title || sheet.properties.sheetId === undefined) {
      const available = metadata.properties?.sheets?.map((item) => item.properties?.title).filter(Boolean).join(", ") || "none";
      return NextResponse.json({ error: `Worksheet not found. Available worksheets: ${available}.` }, { status: 400 });
    }

    const [updated] = await db.update(googleSheetConnections).set({
      spreadsheetId,
      spreadsheetName: metadata.properties?.title || "",
      worksheetTitle: sheet.properties.title,
      worksheetId: sheet.properties.sheetId,
      dataRange: parsed.data.dataRange,
      status: "configured",
      lastError: "",
      updatedAt: new Date(),
    }).where(eq(googleSheetConnections.id, connection.id)).returning();
    return NextResponse.json({ connection: publicGoogleSheetConnection(updated) });
  } catch (error) {
    await db.update(googleSheetConnections).set({ status: "error", lastError: error instanceof Error ? error.message.slice(0, 500) : "Could not configure spreadsheet", updatedAt: new Date() }).where(eq(googleSheetConnections.id, connection.id));
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not access the spreadsheet." }, { status: 400 });
  }
}
