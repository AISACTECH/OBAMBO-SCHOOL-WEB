import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import VerifiedNotice from "@/components/site/VerifiedNotice";
import { getPage } from "@/lib/data";
import { db } from "@/db";
import { leadershipProfiles, facilities } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "About St Mark's Secondary School – Obambo",
  description: "Learn about St Mark's Secondary School – Obambo: our vision, mission, core values, history and school culture.",
};

export const dynamic = "force-dynamic";

const SECTIONS = [
  { slug: "about", label: "About the School" },
  { slug: "history", label: "History" },
  { slug: "vision", label: "Vision" },
  { slug: "mission", label: "Mission" },
  { slug: "core-values", label: "Core Values" },
  { slug: "academic-life", label: "Academic Life" },
  { slug: "student-life", label: "Student Life" },
  { slug: "school-culture", label: "School Culture" },
  { slug: "community-engagement", label: "Community Engagement" },
];

export default async function AboutPage() {
  const [pagesData, leaders, facilityRows] = await Promise.all([
    Promise.all(SECTIONS.map((s) => getPage(s.slug))),
    db.select().from(leadershipProfiles).where(eq(leadershipProfiles.published, true)).orderBy(leadershipProfiles.order).limit(60),
    db.select().from(facilities).where(eq(facilities.published, true)).limit(60),
  ]);

  return (
    <div>
      <PageHero
        eyebrow="About St Mark's"
        title="Discipline, Education and Community"
        description="Everything below is managed by the school administration and can be updated at any time without a developer."
      />

      <div className="container-shell grid gap-10 py-12 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1 text-sm">
            {SECTIONS.map((s) => (
              <a key={s.slug} href={`#${s.slug}`} className="block rounded-lg px-3 py-2 text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]">
                {s.label}
              </a>
            ))}
            <a href="#leadership" className="block rounded-lg px-3 py-2 text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]">Leadership</a>
            <a href="#facilities" className="block rounded-lg px-3 py-2 text-[var(--color-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)]">Facilities</a>
          </nav>
        </aside>

        <div className="space-y-12">
          {SECTIONS.map((s, i) => {
            const page = pagesData[i];
            const isPlaceholder = !page?.content || page.content.includes("awaiting school verification");
            return (
              <section key={s.slug} id={s.slug} className="scroll-mt-24">
                <h2 className="font-display text-2xl font-bold">{s.label}</h2>
                <p className="mt-3 whitespace-pre-line text-[var(--color-text)]/85">{page?.content}</p>
                {isPlaceholder && <div className="mt-3"><VerifiedNotice /></div>}
              </section>
            );
          })}

          <section id="leadership" className="scroll-mt-24">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">Leadership</h2>
              <Link href="/leadership" className="text-sm font-semibold text-[var(--color-primary)]">Full leadership page →</Link>
            </div>
            {leaders.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">Leadership profiles will appear here once published by the school administration.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {leaders.map((l) => (
                  <div key={l.id} className="card-surface p-4">
                    <div className="h-16 w-16 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]" style={l.photoUrl ? { backgroundImage: `url(${l.photoUrl})`, backgroundSize: "cover" } : undefined} />
                    <p className="mt-3 font-semibold">{l.name}</p>
                    <p className="text-xs text-[var(--color-muted)]">{l.title}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section id="facilities" className="scroll-mt-24">
            <h2 className="font-display text-2xl font-bold">Explore Our School — Facilities</h2>
            {facilityRows.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">Facility information will be published here once confirmed by the school.</p>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {facilityRows.map((f) => (
                  <div key={f.id} className="card-surface p-4">
                    <span className="badge badge-normal capitalize">{f.category}</span>
                    <p className="mt-2 font-semibold">{f.name}</p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">{f.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
