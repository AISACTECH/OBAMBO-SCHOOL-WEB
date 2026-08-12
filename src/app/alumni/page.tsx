import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { alumni, alumniStories } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Alumni Network" };
export const dynamic = "force-dynamic";

export default async function AlumniLandingPage() {
  const [verifiedCount, stories] = await Promise.all([
    db.select().from(alumni).where(and(eq(alumni.verified, true), eq(alumni.active, true))),
    db.select().from(alumniStories).where(eq(alumniStories.published, true)).limit(3),
  ]);

  return (
    <div>
      <PageHero
        eyebrow="St Mark's Alumni"
        title="Your school journey doesn't end at graduation."
        description="Reconnect with classmates, mentor current students, and stay part of the St Mark's family."
      />

      <div className="container-shell py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/alumni/register" className="card-surface p-6 hover:-translate-y-0.5 hover:shadow-lg">
            <h3 className="font-display font-semibold">Join the Network</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Create your alumni profile in minutes.</p>
          </Link>
          <Link href="/alumni/directory" className="card-surface p-6 hover:-translate-y-0.5 hover:shadow-lg">
            <h3 className="font-display font-semibold">Find Your Classmates</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Search alumni by year, profession or location.</p>
          </Link>
          <Link href="/alumni/stories" className="card-surface p-6 hover:-translate-y-0.5 hover:shadow-lg">
            <h3 className="font-display font-semibold">Where Are They Now?</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Read inspiring alumni success stories.</p>
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <p className="text-sm text-[var(--color-muted)]">{verifiedCount.length} verified alumni have joined so far.</p>
        </div>

        {stories.length > 0 && (
          <div className="mt-10">
            <h2 className="font-display text-2xl font-bold">Featured Stories</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {stories.map((s) => (
                <div key={s.id} className="card-surface p-5">
                  <p className="font-display font-semibold">{s.name}</p>
                  <p className="text-xs text-[var(--color-muted)]">Class of {s.graduationYear}</p>
                  <p className="mt-2 line-clamp-3 text-sm text-[var(--color-muted)]">{s.journey}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/alumni/login" className="btn btn-outline">Alumni Sign In</Link>
          <Link href="/alumni/register" className="btn btn-primary">Join Alumni Network</Link>
          <Link href="/alumni/mentorship" className="btn btn-secondary">Mentorship Program</Link>
        </div>
      </div>
    </div>
  );
}
