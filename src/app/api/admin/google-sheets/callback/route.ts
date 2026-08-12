import { NextRequest, NextResponse } from "next/server";
import { requireStaff, isResponse } from "@/lib/guards";
import { consumeGoogleOAuthState } from "@/lib/google-oauth-state";
import { exchangeGoogleCode, getGoogleAccount, isGoogleSheetsConfigured } from "@/lib/google-sheets";
import { saveGoogleAuthorization } from "@/lib/google-sheet-connection";
import { googleSheetsSyncEnabled } from "@/lib/google-sheets-feature";

export const runtime = "nodejs";

function redirectWith(req: NextRequest, params: Record<string, string>) {
  const url = new URL("/admin/integrations/google-sheets", req.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return NextResponse.redirect(url);
}

export async function GET(req: NextRequest) {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return redirectWith(req, { error: "Please sign in again." });
  if (!googleSheetsSyncEnabled() || !isGoogleSheetsConfigured()) return redirectWith(req, { error: "Google Sheets integration is not configured." });

  const error = req.nextUrl.searchParams.get("error");
  if (error) return redirectWith(req, { error: "Google authorization was cancelled." });
  const state = req.nextUrl.searchParams.get("state") || "";
  const code = req.nextUrl.searchParams.get("code") || "";
  if (!state || !code || !(await consumeGoogleOAuthState(state, session.id))) return redirectWith(req, { error: "The Google authorization session is invalid or expired." });

  try {
    const tokens = await exchangeGoogleCode(code);
    if (!tokens.access_token) throw new Error("Google did not return an access token");
    const account = await getGoogleAccount(tokens.access_token);
    if (!account.email) throw new Error("Google did not return an account email");
    const connection = await saveGoogleAuthorization({ staffId: session.id, email: account.email, tokens });
    return redirectWith(req, { connected: "1", connectionId: String(connection.id) });
  } catch (caught) {
    return redirectWith(req, { error: caught instanceof Error ? caught.message.slice(0, 200) : "Google authorization failed." });
  }
}
