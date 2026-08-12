import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { desc } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { slugify } from "@/lib/security";
import { logAudit } from "@/lib/audit";
import { CONTENT_REGISTRY, pickWritableFields } from "@/lib/content-registry";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const entry = CONTENT_REGISTRY[table];
  if (!entry) return NextResponse.json({ error: "Unknown resource." }, { status: 404 });
  const session = await requireStaff(entry.permission);
  if (isResponse(session)) return session;

  const rows = await db.select().from(entry.table).orderBy(desc(entry.table.id)).limit(500);
  return NextResponse.json({ items: rows });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ table: string }> }) {
  const { table } = await params;
  const entry = CONTENT_REGISTRY[table];
  if (!entry) return NextResponse.json({ error: "Unknown resource." }, { status: 404 });
  const session = await requireStaff(entry.permission);
  if (isResponse(session)) return session;

  const body = await req.json().catch(() => null);
  const values = pickWritableFields(body, entry);
  if (!values) return NextResponse.json({ error: "No valid content fields were provided." }, { status: 400 });

  if (entry.hasSlug && !values.slug && entry.titleField && typeof values[entry.titleField] === "string") {
    const generatedSlug = slugify(values[entry.titleField] as string);
    if (!generatedSlug) return NextResponse.json({ error: "A title is required to generate a URL slug." }, { status: 400 });
    values.slug = `${generatedSlug}-${Date.now().toString(36)}`;
  }

  const inserted = (await db.insert(entry.table).values(values).returning()) as Array<{ id: number }>;
  await logAudit({
    actorType: "staff",
    actorId: session.id,
    actorName: session.name,
    action: `${table}_created`,
    targetType: table,
    targetId: inserted[0]?.id,
    details: { title: entry.titleField ? values[entry.titleField] : undefined },
  });
  return NextResponse.json({ item: inserted[0] });
}
