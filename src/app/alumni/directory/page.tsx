import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { alumni } from "@/db/schema";
import { and, eq, ilike } from "drizzle-orm";

export const metadata: Metadata = { title: "Find Your Classmates — Alumni Directory" };
export const dynamic = "force-dynamic";

export default async function AlumniDirectoryPage({ searchParams }: { searchParams: Promise<{ q?: string; year?: string }> }) {
  const { q = "", year = "" } = await searchParams;
  const conditions = [eq(alumni.verified, true), eq(alumni.active, true), eq(alumni.privacy, "public")];
  if (q) conditions.push(ilike(alumni.name, `%${q}%`));

  const rows = await db.select().from(alumni).where(and(...conditions)).limit(60);
  const filtered = year ? rows.filter((a) => String(a.graduationYear) === year) : rows;

  return (
    <div>
      <PageHero eyebrow="Alumni" title="Find Your Classmates" description="Search verified alumni by name, graduation year, profession or location." />
      <div className="container-shell py-10">
        <form className="card-surface flex flex-wrap gap-3 p-4">
          <input name="q" defaultValue={q} placeholder="Search by name..." className="flex-1 min-w-[160px] rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <input name="year" defaultValue={year} placeholder="Graduation year" className="w-40 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm" />
          <button className="btn btn-primary">Search</button>
        </form>

        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-[var(--color-muted)]">Your alumni community is just getting started — be one of the first to join and appear here.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filtered.map((a) => (
              <div key={a.id} className="card-surface p-5">
                <div className="h-16 w-16 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]" style={a.photoUrl ? { backgroundImage: `url(${a.photoUrl})`, backgroundSize: "cover" } : undefined} />
                <p className="mt-3 font-display font-semibold">{a.name}</p>
                <p className="text-xs text-[var(--color-muted)]">Class of {a.graduationYear || "—"}</p>
                {a.profession && <p className="mt-1 text-sm text-[var(--color-muted)]">{a.profession}{a.location ? ` · ${a.location}` : ""}</p>}
                {a.mentorshipAvailable && <span className="badge badge-normal mt-2 inline-block">Mentor Available</span>}
                <div className="mt-3 flex gap-2">
                  <a href="/alumni/login" className="btn btn-outline !py-1.5 text-xs">Connect</a>
                  {a.mentorshipAvailable && <a href="/alumni/mentorship" className="btn btn-primary !py-1.5 text-xs">Request Mentorship</a>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
