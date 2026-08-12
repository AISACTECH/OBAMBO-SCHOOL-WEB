import crypto from "node:crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_SHEETS_API = "https://sheets.googleapis.com/v4";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";
const DEV_TOKEN_KEY = "dev-google-token-encryption-key-change-me";

export const DEFAULT_GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

export type GoogleFetch = typeof fetch;

export type GoogleTokenSet = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
};

export type GoogleSpreadsheet = {
  properties?: {
    title?: string;
    sheets?: { properties?: { sheetId?: number; title?: string } }[];
  };
};

function googleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID?.trim() || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() || "",
    redirectUri: process.env.GOOGLE_REDIRECT_URI?.trim() || "",
  };
}

export function isGoogleSheetsConfigured() {
  const config = googleConfig();
  const hasEncryptionKey = Boolean(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim()) || process.env.NODE_ENV !== "production";
  return Boolean(config.clientId && config.clientSecret && config.redirectUri && hasEncryptionKey);
}

export function getGoogleScopes() {
  const configured = process.env.GOOGLE_SHEETS_SCOPES
    ?.split(/[,\s]+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
  return configured?.length ? configured : DEFAULT_GOOGLE_SCOPES;
}

export function getGoogleAuthorizationUrl(state: string) {
  const config = googleConfig();
  if (!isGoogleSheetsConfigured()) throw new Error("Google Sheets OAuth is not configured");
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: getGoogleScopes().join(" "),
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

function encryptionKey() {
  const configured = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();
  if (!configured && process.env.NODE_ENV === "production") {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must be configured in production");
  }
  const source = configured || process.env.AUTH_SECRET || DEV_TOKEN_KEY;
  return /^[0-9a-f]{64}$/i.test(source)
    ? Buffer.from(source, "hex")
    : crypto.createHash("sha256").update(source).digest();
}

export function encryptGoogleToken(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

export function decryptGoogleToken(value: string) {
  try {
    const payload = Buffer.from(value, "base64url");
    const iv = payload.subarray(0, 12);
    const tag = payload.subarray(12, 28);
    const encrypted = payload.subarray(28);
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Stored Google token could not be decrypted");
  }
}

export function parseSpreadsheetId(input: string) {
  const value = input.trim();
  if (!value) return null;

  if (!value.startsWith("http://") && !value.startsWith("https://")) {
    return value.match(/^[a-zA-Z0-9_-]{20,}$/)?.[0] || null;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "docs.google.com") return null;
    return url.pathname.match(/^\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/)?.[1] || null;
  } catch {
    return null;
  }
}

async function requestJson<T>(url: string, init: RequestInit, fetcher: GoogleFetch = fetch): Promise<T> {
  const response = await fetcher(url, {
    ...init,
    signal: init.signal || AbortSignal.timeout(15_000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload
      ? JSON.stringify(payload.error)
      : `Google request failed with status ${response.status}`;
    throw new Error(message);
  }
  return payload as T;
}

export async function exchangeGoogleCode(code: string, fetcher: GoogleFetch = fetch) {
  const config = googleConfig();
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: "authorization_code",
  });
  return requestJson<GoogleTokenSet>(GOOGLE_TOKEN_URL, { method: "POST", body }, fetcher);
}

export async function refreshGoogleAccessToken(refreshToken: string, fetcher: GoogleFetch = fetch) {
  const config = googleConfig();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "refresh_token",
  });
  return requestJson<GoogleTokenSet>(GOOGLE_TOKEN_URL, { method: "POST", body }, fetcher);
}

export async function getGoogleAccount(accessToken: string, fetcher: GoogleFetch = fetch) {
  return requestJson<{ email?: string }>(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }, fetcher);
}

export async function getSpreadsheetMetadata(spreadsheetId: string, accessToken: string, fetcher: GoogleFetch = fetch) {
  const fields = encodeURIComponent("properties(title,sheets(properties(sheetId,title)))");
  return requestJson<GoogleSpreadsheet>(
    `${GOOGLE_SHEETS_API}/spreadsheets/${encodeURIComponent(spreadsheetId)}?includeGridData=false&fields=${fields}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
    fetcher,
  );
}

export async function getSpreadsheetValues(spreadsheetId: string, range: string, accessToken: string, fetcher: GoogleFetch = fetch) {
  const encodedRange = encodeURIComponent(range);
  const response = await requestJson<{ values?: unknown[][] }>(
    `${GOOGLE_SHEETS_API}/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodedRange}?majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
    fetcher,
  );
  return response.values || [];
}
