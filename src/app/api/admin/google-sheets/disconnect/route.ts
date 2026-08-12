import { NextResponse } from "next/server";
import { db } from "@/db";
import { googleSheetConnections } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { getGoogleSheetConnection } from "@/lib/google-sheet-connection";
import { googleSheetsSyncEnabled } from "@/lib/google-sheets-feature";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST() {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;
  if (!googleSheetsSyncEnabled()) return NextResponse.json({ error: "Google Sheets sync is disabled." }, { status: 503 });
  const connection = await getGoogleSheetConnection();
  if (connection) {
    await db.update(googleSheetConnections).set({
      status: "disconnected",
      spreadsheetId: "",
      spreadsheetName: "",
      accessTokenEncrypted: null,
      refreshTokenEncrypted: null,
      tokenExpiresAt: null,
      lastError: "",
      updatedAt: new Date(),
    }).where(eq(googleSheetConnections.id, connection.id));
    await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: "google_sheets_disconnected", targetType: "google_sheet_connection", targetId: connection.id });
  }
  return NextResponse.json({ ok: true });
}
