import { NextResponse } from "next/server";
import { requireStaff, isResponse } from "@/lib/guards";
import { getGoogleSheetConnection, publicGoogleSheetConnection } from "@/lib/google-sheet-connection";
import { isGoogleSheetsConfigured } from "@/lib/google-sheets";
import { googleSheetsSyncEnabled } from "@/lib/google-sheets-feature";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;
  const connection = await getGoogleSheetConnection();
  return NextResponse.json({
    enabled: googleSheetsSyncEnabled(),
    configured: isGoogleSheetsConfigured(),
    connection: publicGoogleSheetConnection(connection),
  });
}
