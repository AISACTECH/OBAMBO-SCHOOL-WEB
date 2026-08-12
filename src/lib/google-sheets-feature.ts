export function googleSheetsSyncEnabled() {
  return process.env.GOOGLE_SHEETS_SYNC_ENABLED === "true";
}
