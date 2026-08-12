import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { alumniStories } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "Where Are They Now? — Alumni Stories" };
export const dynamic = "force-dynamic";

export default async function AlumniStoriesPage() {
  const stories = await db.select().from(alumniStories).where(eq(alumniStories.published, true));

  return (
    <div>
      <PageHero eyebrow="Alumni Stories" title="Where Are They Now?" description="Verified success stories from St Mark's graduates." />
      <div className="container-shell py-12">
        {stories.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">Alumni stories will be published here as they are verified by the school.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {stories.map((s) => (
              <div key={s.id} className="card-surface p-6">
                <p className="font-display text-lg font-semibold">{s.name}</p>
                <p className="text-xs text-[var(--color-muted)]">Class of {s.graduationYear} {s.currentRole && `· ${s.currentRole}`}</p>
                <h3 className="font-display mt-3 font-semibold text-[var(--color-primary)]">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{s.journey}</p>
                {s.quote && <p className="mt-3 border-l-2 border-[var(--color-secondary)] pl-3 text-sm italic">&ldquo;{s.quote}&rdquo;</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
