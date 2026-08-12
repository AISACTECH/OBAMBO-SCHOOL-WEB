import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { alumni } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Alumni Mentorship Program" };
export const dynamic = "force-dynamic";

const TYPES = ["career", "university", "entrepreneurship", "technology", "scholarship", "speaker", "internship"];

export default async function MentorshipPage() {
  const mentors = await db.select().from(alumni).where(and(eq(alumni.mentorshipAvailable, true), eq(alumni.verified, true), eq(alumni.privacy, "public")));

  return (
    <div>
      <PageHero eyebrow="Give Back" title="Alumni Mentorship Program" description="Alumni volunteer as career mentors, university guides, entrepreneurship coaches, technology mentors, scholarship supporters, speakers and internship supporters." />
      <div className="container-shell py-12">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => <span key={t} className="badge badge-normal capitalize">{t}</span>)}
        </div>

        <h2 className="font-display mt-8 text-2xl font-bold">Available Mentors</h2>
        {mentors.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">No mentors are listed publicly yet. Alumni can opt in to mentorship from their dashboard.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {mentors.map((m) => (
              <div key={m.id} className="card-surface p-5">
                <p className="font-display font-semibold">{m.name}</p>
                <p className="text-xs text-[var(--color-muted)]">{m.profession}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(m.mentorTypes || []).map((t) => <span key={t} className="rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10px]">{t}</span>)}
                </div>
                <Link href="/alumni/login" className="btn btn-primary mt-3 w-full !py-1.5 text-xs">Request Mentorship</Link>
              </div>
            ))}
          </div>
        )}

        <div className="card-surface mt-10 p-6">
          <h3 className="font-display font-semibold">Become a Mentor</h3>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Sign in to your alumni account and enable mentorship from your profile settings. All mentorship requests are moderated by the school for student safety.</p>
          <Link href="/alumni/login" className="btn btn-outline mt-4">Sign in to volunteer</Link>
        </div>
      </div>
    </div>
  );
}
