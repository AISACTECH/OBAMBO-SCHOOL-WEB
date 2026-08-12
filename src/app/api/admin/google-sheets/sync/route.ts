import { NextResponse } from "next/server";
import { db } from "@/db";
import { googleSheetConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { commitResultRows } from "@/lib/result-import";
import { getGoogleSheetConnection } from "@/lib/google-sheet-connection";
import { previewGooglePerformance } from "@/lib/google-sheet-sync";
import { googleSheetsSyncEnabled } from "@/lib/google-sheets-feature";

export const runtime = "nodejs";

export async function POST() {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;
  if (!googleSheetsSyncEnabled()) return NextResponse.json({ error: "Google Sheets sync is disabled." }, { status: 503 });
  const connection = await getGoogleSheetConnection();
  if (!connection || connection.status === "disconnected") return NextResponse.json({ error: "Connect and configure Google Sheets first." }, { status: 400 });

  try {
    const preview = await previewGooglePerformance(connection);
    if (!preview.data.length) return NextResponse.json({ error: "No valid rows are ready to publish.", preview }, { status: 400 });
    const result = await commitResultRows({
      data: preview.data,
      source: "google_sheet_api",
      sourceUrl: preview.sourceUrl,
      totalRows: preview.totalRows,
      importedBy: { id: session.id, name: session.name },
    });
    await db.update(googleSheetConnections).set({ status: "configured", lastSyncAt: new Date(), lastError: "", updatedAt: new Date() }).where(eq(googleSheetConnections.id, connection.id));
    return NextResponse.json({ ok: true, preview, ...result });
  } catch (error) {
    await db.update(googleSheetConnections).set({ status: "error", lastError: error instanceof Error ? error.message.slice(0, 500) : "Google Sheet sync failed", updatedAt: new Date() }).where(eq(googleSheetConnections.id, connection.id));
    return NextResponse.json({ error: error instanceof Error ? error.message : "The Google Sheet sync failed." }, { status: 400 });
  }
}
