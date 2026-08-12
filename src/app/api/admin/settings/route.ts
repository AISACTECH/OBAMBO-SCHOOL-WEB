import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { schoolSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { invalidateSettingsCache, getSchoolSettings } from "@/lib/settings";
import { logAudit } from "@/lib/audit";

function isHttpsUrlOrEmpty(value: string) {
  if (!value) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

const settingsPatchSchema = z.object({
  schoolName: z.string().min(1).max(200).optional(),
  motto: z.string().max(1000).optional(),
  vision: z.string().max(4000).optional(),
  mission: z.string().max(4000).optional(),
  coreValues: z.string().max(4000).optional(),
  history: z.string().max(8000).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().or(z.literal("")).optional(),
  mapEmbedUrl: z.string().max(1000).refine(isHttpsUrlOrEmpty).optional(),
  facebookUrl: z.string().max(500).refine(isHttpsUrlOrEmpty).optional(),
  twitterUrl: z.string().max(500).refine(isHttpsUrlOrEmpty).optional(),
  instagramUrl: z.string().max(500).refine(isHttpsUrlOrEmpty).optional(),
  youtubeUrl: z.string().max(500).refine(isHttpsUrlOrEmpty).optional(),
  whatsappNumber: z.string().max(50).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  statsVisibility: z.record(z.string(), z.boolean()).optional(),
  statsValues: z.record(z.string(), z.number().finite().min(0).max(1_000_000)).optional(),
  dataSaverDefault: z.boolean().optional(),
}).strict();

export async function GET() {
  const session = await requireStaff();
  if (isResponse(session)) return session;
  const settings = await getSchoolSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = await requireStaff("manage_settings");
  if (isResponse(session)) return session;
  const parsed = settingsPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check the settings values." }, { status: 400 });

  const settings = await getSchoolSettings();
  await db.update(schoolSettings).set({ ...parsed.data, updatedAt: new Date() }).where(eq(schoolSettings.id, settings.id));
  invalidateSettingsCache();
  await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: "settings_updated", details: parsed.data });
  return NextResponse.json({ ok: true });
}
