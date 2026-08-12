import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { alumni } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, rateLimit, getClientIp } from "@/lib/security";
import { createSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";

// NOTE ON AUTHENTICATION ARCHITECTURE
// The product specification calls for Google / Facebook / Phone OTP sign-in
// for alumni. Those providers require OAuth client credentials and an SMS
// gateway that are not available in this environment. This endpoint
// implements a secure email + password flow with the exact same session and
// verification model, so that Google/Facebook/OTP providers can be added
// later purely as additional strategies without changing the rest of the
// application (see docs/AUTHENTICATION_GUIDE.md).

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(200),
  graduationYear: z.coerce.number().int().min(1970).max(new Date().getFullYear()).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`alumni-register:${ip}`, 8, 30 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });

  const existing = await db.select().from(alumni).where(eq(alumni.email, parsed.data.email.toLowerCase())).limit(1);
  if (existing.length > 0) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const passwordHash = await hashPassword(parsed.data.password);
  const inserted = await db
    .insert(alumni)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash,
      graduationYear: parsed.data.graduationYear,
      authProvider: "credentials",
      verified: false,
    })
    .returning();

  const record = inserted[0];
  await createSession({ id: record.id, name: record.name, role: "alumni", type: "alumni" });
  await logAudit({ actorType: "alumni", actorId: record.id, actorName: record.name, action: "alumni_registered", ipAddress: ip });

  return NextResponse.json({ ok: true, pendingVerification: true });
}
