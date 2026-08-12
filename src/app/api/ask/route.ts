import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pages, announcements, resources } from "@/db/schema";
import { eq, ilike, or, and } from "drizzle-orm";
import { rateLimit, getClientIp } from "@/lib/security";

const FALLBACK =
  "I couldn't find an official answer in the school's published information. Please contact the school administration.";
const questionSchema = z.object({ question: z.string().trim().min(3).max(1_000) }).strict();

function extractKeywords(question: string) {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !["what", "when", "where", "does", "have", "your", "about", "which", "school"].includes(w));
}

async function retrieve(question: string) {
  const keywords = extractKeywords(question).slice(0, 5);
  if (keywords.length === 0) return [];

  const likeConditions = keywords.map((k) => `%${k}%`);

  const [pageRows, annRows, resourceRows] = await Promise.all([
    db.select().from(pages).where(and(eq(pages.status, "published"), or(...likeConditions.map((l) => ilike(pages.content, l))))).limit(3),
    db.select().from(announcements).where(and(eq(announcements.status, "published"), or(...likeConditions.map((l) => ilike(announcements.content, l))))).limit(3),
    db.select().from(resources).where(and(eq(resources.status, "published"), or(...likeConditions.map((l) => ilike(resources.title, l))))).limit(3),
  ]);

  return [
    ...pageRows.map((p) => ({ title: p.title, snippet: p.content.slice(0, 400), href: `/about#${p.slug}`, source: "School page" })),
    ...annRows.map((a) => ({ title: a.title, snippet: a.summary, href: `/announcements/${a.slug}`, source: "Announcement" })),
    ...resourceRows.map((r) => ({ title: r.title, snippet: `${r.subject} · ${r.form} · ${r.term} ${r.year}`, href: `/resources`, source: "Learning Hub" })),
  ];
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`ask:${ip}`, 20, 5 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ error: "Too many questions. Please wait a moment and try again." }, { status: 429 });

  const parsed = questionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please enter a question of no more than 1,000 characters." }, { status: 400 });
  const question = parsed.data.question;

  const context = await retrieve(question);

  if (context.length === 0) {
    return NextResponse.json({ answer: FALLBACK, sources: [] });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        signal: AbortSignal.timeout(10_000),
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.2,
          max_tokens: 300,
          messages: [
            {
              role: "system",
              content:
                "You are Ask St Mark's, an assistant for St Mark's Secondary School - Obambo. Answer ONLY using the provided context. Never invent facts, statistics, staff names or results. If the context does not contain the answer, reply exactly: \"" +
                FALLBACK +
                "\"",
            },
            {
              role: "user",
              content: `Question: ${question}\n\nApproved school context:\n${context.map((c) => `- (${c.source}) ${c.title}: ${c.snippet}`).join("\n")}`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const answer = data.choices?.[0]?.message?.content?.trim() || FALLBACK;
        return NextResponse.json({ answer, sources: context.map((c) => ({ title: c.title, href: c.href })) });
      }
    } catch {
      // fall through to retrieval-only response
    }
  }

  const answer = `Based on official school information:\n\n${context
    .map((c) => `• ${c.title}: ${c.snippet}`)
    .join("\n\n")}`;
  return NextResponse.json({ answer, sources: context.map((c) => ({ title: c.title, href: c.href })) });
}
