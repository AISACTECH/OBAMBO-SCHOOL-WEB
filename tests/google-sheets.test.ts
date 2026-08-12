import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptGoogleToken,
  encryptGoogleToken,
  exchangeGoogleCode,
  getGoogleAccount,
  getGoogleAuthorizationUrl,
  getSpreadsheetMetadata,
  getSpreadsheetValues,
  parseSpreadsheetId,
  refreshGoogleAccessToken,
} from "../src/lib/google-sheets";
process.env.GOOGLE_CLIENT_ID = "client-id";
process.env.GOOGLE_CLIENT_SECRET = "client-secret";
process.env.GOOGLE_REDIRECT_URI = "https://school.example/api/admin/google-sheets/callback";
process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

test("Google tokens round-trip through authenticated encryption", () => {
  const encrypted = encryptGoogleToken("refresh-token-value");
  assert.notEqual(encrypted, "refresh-token-value");
  assert.equal(decryptGoogleToken(encrypted), "refresh-token-value");
  assert.throws(() => decryptGoogleToken(`${encrypted.slice(0, -2)}xx`));
});

test("spreadsheet IDs are accepted from URLs but not arbitrary URLs", () => {
  assert.equal(parseSpreadsheetId("https://docs.google.com/spreadsheets/d/abc_123-XYZ/edit#gid=0"), "abc_123-XYZ");
  assert.equal(parseSpreadsheetId("1CM29gwKIzeXsAppeNwrc8lbYaVMmUclprLuLYuHog4k"), "1CM29gwKIzeXsAppeNwrc8lbYaVMmUclprLuLYuHog4k");
  assert.equal(parseSpreadsheetId("https://attacker.example/spreadsheets/d/abc"), null);
});

test("OAuth URL contains offline access, state and configured scopes", () => {
  const url = new URL(getGoogleAuthorizationUrl("test-state"));
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("state"), "test-state");
  assert.match(url.searchParams.get("scope") || "", /spreadsheets\.readonly/);
});

test("Google API adapter reads metadata and values through its injected fetcher", async () => {
  const calls: string[] = [];
  const fakeFetch: typeof fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.includes("/spreadsheets/sheet-id?")) {
      return new Response(JSON.stringify({ properties: { title: "Results", sheets: [{ properties: { sheetId: 7, title: "Performance" } }] } }), { status: 200 });
    }
    return new Response(JSON.stringify({ values: [["Admission Number", "Term"], ["A-1", "Term 1"]] }), { status: 200 });
  };

  const metadata = await getSpreadsheetMetadata("sheet-id", "access-token", fakeFetch);
  const values = await getSpreadsheetValues("sheet-id", "'Performance'!A1:M", "access-token", fakeFetch);
  assert.equal(metadata.properties?.title, "Results");
  assert.deepEqual(values[1], ["A-1", "Term 1"]);
  assert.equal(calls.length, 2);
  assert.ok(calls[1].includes("Performance"));
});

test("OAuth token exchange and account lookup use expected Google endpoints", async () => {
  const fakeFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("oauth2.googleapis.com/token")) {
      assert.equal(init?.method, "POST");
      return new Response(JSON.stringify({ access_token: "access", refresh_token: "refresh", expires_in: 3600 }), { status: 200 });
    }
    if (url.includes("userinfo")) return new Response(JSON.stringify({ email: "admin@example.org" }), { status: 200 });
    throw new Error(`Unexpected URL ${url}`);
  };

  const exchanged = await exchangeGoogleCode("authorization-code", fakeFetch);
  const refreshed = await refreshGoogleAccessToken("refresh", fakeFetch);
  const account = await getGoogleAccount("access", fakeFetch);
  assert.equal(exchanged.access_token, "access");
  assert.equal(refreshed.refresh_token, "refresh");
  assert.equal(account.email, "admin@example.org");
});
