import { db } from "@/db";
import { schoolSettings } from "@/db/schema";

export type SchoolSettings = typeof schoolSettings.$inferSelect;

let cache: { value: SchoolSettings; expires: number } | null = null;

export async function getSchoolSettings(): Promise<SchoolSettings> {
  if (cache && cache.expires > Date.now()) return cache.value;
  const rows = await db.select().from(schoolSettings).limit(1);
  let row = rows[0];
  if (!row) {
    const inserted = await db.insert(schoolSettings).values({}).returning();
    row = inserted[0];
  }
  cache = { value: row, expires: Date.now() + 15_000 };
  return row;
}

export function invalidateSettingsCache() {
  cache = null;
}
