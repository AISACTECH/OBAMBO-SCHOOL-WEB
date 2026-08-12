import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import VerifiedNotice from "@/components/site/VerifiedNotice";
import { db } from "@/db";
import { subjects, classForms, examinations } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Academics",
  description: "Curriculum, subjects, departments, academic calendar and examination information at St Mark's Secondary School – Obambo.",
};

export const dynamic = "force-dynamic";

export default async function AcademicsPage() {
  const [subjectRows, forms, exams] = await Promise.all([
    db.select().from(subjects),
    db.select().from(classForms).orderBy(classForms.level),
    db.select().from(examinations).where(eq(examinations.status, "published")).orderBy(desc(examinations.year)).limit(6),
  ]);

  const byDepartment = subjectRows.reduce<Record<string, typeof subjectRows>>((acc, s) => {
    acc[s.department || "General"] = acc[s.department || "General"] || [];
    acc[s.department || "General"].push(s);
    return acc;
  }, {});

  return (
    <div>
      <PageHero
        eyebrow="Academics"
        title="Curriculum, Subjects & Examinations"
        description="St Mark's academic structure is kept flexible so it can adapt as Kenya's secondary curriculum evolves."
      />

      <div className="container-shell grid gap-10 py-12 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="font-display text-2xl font-bold">Departments & Subjects</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Object.entries(byDepartment).map(([dept, list]) => (
              <div key={dept} className="card-surface p-5">
                <h3 className="font-display font-semibold text-[var(--color-primary)]">{dept}</h3>
                <ul className="mt-2 space-y-1 text-sm text-[var(--color-muted)]">
                  {list.map((s) => <li key={s.id}>{s.name}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <h2 className="font-display mt-10 text-2xl font-bold">Forms / Grades</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {forms.map((f) => (
              <span key={f.id} className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm font-medium">{f.name}</span>
            ))}
          </div>

          <h2 className="font-display mt-10 text-2xl font-bold">Examinations</h2>
          {exams.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-muted)]">Examination schedules will be published here by the examination office.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {exams.map((e) => (
                <li key={e.id} className="card-surface flex items-center justify-between p-4 text-sm">
                  <span>{e.name} — {e.term} {e.year}</span>
                  <span className="badge badge-normal capitalize">{e.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div className="card-surface p-5">
            <h3 className="font-display font-semibold">Academic Support</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Revision papers, marking schemes and study guides are available in the Learning Hub.</p>
            <Link href="/resources" className="btn btn-primary mt-4 w-full">Open Learning Hub</Link>
          </div>
          <div className="card-surface p-5">
            <h3 className="font-display font-semibold">School Calendar</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">Track examination dates, events and academic deadlines.</p>
            <Link href="/events" className="btn btn-outline mt-4 w-full">View Calendar</Link>
          </div>
          <VerifiedNotice text="Detailed academic calendar dates and current examination timetables are awaiting school verification." />
        </aside>
      </div>
    </div>
  );
}
