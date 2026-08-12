import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { feedback } from "@/db/schema";
import { rateLimit, getClientIp } from "@/lib/security";

const schema = z.object({
  category: z.enum(["academic", "facilities", "student-life", "technology", "sports", "clubs", "community", "other"]),
  message: z.string().trim().min(5).max(3000),
  submitterName: z.string().trim().max(120).optional().default(""),
  anonymous: z.boolean().optional().default(true),
}).strict();

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`feedback:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });

  await db.insert(feedback).values(parsed.data);
  return NextResponse.json({ ok: true });
}
