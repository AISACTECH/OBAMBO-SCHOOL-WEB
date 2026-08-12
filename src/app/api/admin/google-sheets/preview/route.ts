import { NextResponse } from "next/server";
import { requireStaff, isResponse } from "@/lib/guards";
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
    return NextResponse.json(await previewGooglePerformance(connection));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not read the Google Sheet." }, { status: 400 });
  }
}
