import { NextResponse } from "next/server";
import { requireStaff, isResponse } from "@/lib/guards";
import { createGoogleOAuthState } from "@/lib/google-oauth-state";
import { getGoogleAuthorizationUrl, isGoogleSheetsConfigured } from "@/lib/google-sheets";
import { googleSheetsSyncEnabled } from "@/lib/google-sheets-feature";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;
  if (!googleSheetsSyncEnabled()) return NextResponse.json({ error: "Google Sheets sync is disabled. Set GOOGLE_SHEETS_SYNC_ENABLED=true to enable it." }, { status: 503 });
  if (!isGoogleSheetsConfigured()) return NextResponse.json({ error: "Google Sheets OAuth is not configured on the server." }, { status: 503 });

  const state = await createGoogleOAuthState(session.id);
  return NextResponse.json({ url: getGoogleAuthorizationUrl(state) });
}
