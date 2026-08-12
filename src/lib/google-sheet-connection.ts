import { db } from "@/db";
import { googleSheetConnections } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  decryptGoogleToken,
  encryptGoogleToken,
  refreshGoogleAccessToken,
  type GoogleTokenSet,
} from "@/lib/google-sheets";

export async function getGoogleSheetConnection() {
  const [connection] = await db.select().from(googleSheetConnections).orderBy(desc(googleSheetConnections.updatedAt)).limit(1);
  return connection || null;
}

export function publicGoogleSheetConnection(connection: Awaited<ReturnType<typeof getGoogleSheetConnection>>) {
  if (!connection) return null;
  return {
    id: connection.id,
    googleAccountEmail: connection.googleAccountEmail,
    spreadsheetId: connection.spreadsheetId,
    spreadsheetName: connection.spreadsheetName,
    worksheetTitle: connection.worksheetTitle,
    worksheetId: connection.worksheetId,
    dataRange: connection.dataRange,
    scopes: connection.scopes,
    status: connection.status,
    lastSyncAt: connection.lastSyncAt,
    lastError: connection.lastError,
    createdAt: connection.createdAt,
    updatedAt: connection.updatedAt,
  };
}

export async function saveGoogleAuthorization(input: {
  staffId: number;
  email: string;
  tokens: GoogleTokenSet;
}) {
  const existing = await getGoogleSheetConnection();
  const values = {
    googleAccountEmail: input.email,
    accessTokenEncrypted: encryptGoogleToken(input.tokens.access_token),
    refreshTokenEncrypted: input.tokens.refresh_token
      ? encryptGoogleToken(input.tokens.refresh_token)
      : existing?.refreshTokenEncrypted || null,
    tokenExpiresAt: new Date(Date.now() + Math.max(60, input.tokens.expires_in || 3600) * 1000),
    scopes: input.tokens.scope || "",
    status: "authorized",
    lastError: "",
    updatedAt: new Date(),
  };

  if (existing) {
    const [updated] = await db.update(googleSheetConnections).set(values).where(eq(googleSheetConnections.id, existing.id)).returning();
    return updated;
  }

  const [created] = await db.insert(googleSheetConnections).values({
    ...values,
    spreadsheetId: "",
    worksheetTitle: "Performance",
    dataRange: "A1:M",
    createdById: input.staffId,
  }).returning();
  return created;
}

export async function getGoogleAccessToken(connection: NonNullable<Awaited<ReturnType<typeof getGoogleSheetConnection>>>) {
  if (connection.accessTokenEncrypted && connection.tokenExpiresAt && new Date(connection.tokenExpiresAt).getTime() > Date.now() + 60_000) {
    return decryptGoogleToken(connection.accessTokenEncrypted);
  }
  if (!connection.refreshTokenEncrypted) throw new Error("Google authorization has expired. Reconnect the Google account.");

  try {
    const refreshToken = decryptGoogleToken(connection.refreshTokenEncrypted);
    const tokens = await refreshGoogleAccessToken(refreshToken);
    await db.update(googleSheetConnections).set({
      accessTokenEncrypted: encryptGoogleToken(tokens.access_token),
      tokenExpiresAt: new Date(Date.now() + Math.max(60, tokens.expires_in || 3600) * 1000),
      status: "configured",
      lastError: "",
      updatedAt: new Date(),
    }).where(eq(googleSheetConnections.id, connection.id));
    return tokens.access_token;
  } catch (error) {
    await db.update(googleSheetConnections).set({ status: "reauth_required", lastError: error instanceof Error ? error.message.slice(0, 500) : "Google token refresh failed", updatedAt: new Date() }).where(eq(googleSheetConnections.id, connection.id));
    throw new Error("Google authorization has expired. Reconnect the Google account.");
  }
}
