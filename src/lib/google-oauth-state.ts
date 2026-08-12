import crypto from "node:crypto";
import { db } from "@/db";
import { googleOAuthStates } from "@/db/schema";
import { and, eq, gt, isNull } from "drizzle-orm";

function hashState(state: string) {
  return crypto.createHash("sha256").update(state).digest("hex");
}

export async function createGoogleOAuthState(staffId: number) {
  const state = crypto.randomBytes(32).toString("base64url");
  await db.insert(googleOAuthStates).values({
    stateHash: hashState(state),
    staffId,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  return state;
}

export async function consumeGoogleOAuthState(state: string, staffId: number) {
  if (!/^[A-Za-z0-9_-]{40,}$/.test(state)) return false;
  const rows = await db
    .update(googleOAuthStates)
    .set({ usedAt: new Date() })
    .where(and(
      eq(googleOAuthStates.stateHash, hashState(state)),
      eq(googleOAuthStates.staffId, staffId),
      isNull(googleOAuthStates.usedAt),
      gt(googleOAuthStates.expiresAt, new Date()),
    ))
    .returning({ id: googleOAuthStates.id });
  return rows.length === 1;
}
