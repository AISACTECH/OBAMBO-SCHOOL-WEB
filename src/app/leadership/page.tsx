import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { leadershipProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "School Leadership" };
export const dynamic = "force-dynamic";

export default async function LeadershipPage() {
  const leaders = await db.select().from(leadershipProfiles).where(eq(leadershipProfiles.published, true)).orderBy(leadershipProfiles.order);

  return (
    <div>
      <PageHero eyebrow="Leadership" title="School Leadership & Administration" description="Every profile below is verified and published by the school administration." />
      <div className="container-shell py-12">
        {leaders.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Leadership profiles will appear here once published by the school administration.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {leaders.map((l) => (
              <div key={l.id} className="card-surface p-5">
                <div className="h-20 w-20 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]" style={l.photoUrl ? { backgroundImage: `url(${l.photoUrl})`, backgroundSize: "cover" } : undefined} />
                <p className="mt-3 font-display font-semibold">{l.name}</p>
                <p className="text-sm text-[var(--color-primary)]">{l.title}</p>
                {l.department && <p className="text-xs text-[var(--color-muted)]">{l.department}</p>}
                <p className="mt-2 text-sm text-[var(--color-muted)]">{l.bio}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
