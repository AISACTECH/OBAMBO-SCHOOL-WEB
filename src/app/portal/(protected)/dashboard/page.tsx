import Link from "next/link";
import { requireStudent, isResponse } from "@/lib/guards";
import { redirect } from "next/navigation";
import { getActiveAnnouncements } from "@/lib/data";
import { db } from "@/db";
import { results, resources, examinations } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const session = await requireStudent();
  if (isResponse(session)) redirect("/portal/login");
  const [myResults, announcements, latestResources, upcomingExams] = await Promise.all([
    db.select().from(results).where(and(eq(results.studentId, session.id), eq(results.status, "published"))).orderBy(desc(results.createdAt)).limit(8),
    getActiveAnnouncements(4, "students"),
    db.select().from(resources).where(eq(resources.status, "published")).orderBy(desc(resources.createdAt)).limit(4),
    db.select().from(examinations).where(eq(examinations.status, "published")).orderBy(desc(examinations.year)).limit(3),
  ]);

  const avg = myResults.length ? Math.round((myResults.reduce((s, r) => s + r.marks, 0) / myResults.length) * 10) / 10 : null;

  return (
    <div className="space-y-8">
      <div className="card-surface bg-[var(--color-accent)] p-6 text-white">
        <h1 className="font-display text-2xl font-bold">Welcome back, {(session!.name as string).split(" ")[0]} 👋</h1>
        <p className="mt-1 text-sm text-white/80">Here&apos;s what&apos;s happening at St Mark&apos;s today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Average Marks" value={avg !== null ? `${avg}%` : "—"} />
        <StatCard label="Subjects Recorded" value={String(new Set(myResults.map((r) => r.subject)).size)} />
        <StatCard label="Learning Resources" value={String(latestResources.length)} suffix="new" />
        <StatCard label="Active Announcements" value={String(announcements.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Recent Announcements</h2>
            <Link href="/portal/announcements" className="text-xs font-semibold text-[var(--color-primary)]">View all</Link>
          </div>
          <div className="mt-3 space-y-2">
            {announcements.length === 0 && <p className="text-sm text-[var(--color-muted)]">You&apos;re all caught up.</p>}
            {announcements.map((a) => (
              <Link key={a.id} href={`/announcements/${a.slug}`} className="block rounded-lg border border-[var(--color-border)] p-3 text-sm hover:border-[var(--color-primary)]">
                {a.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="card-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">Upcoming Examinations</h2>
            <Link href="/academics" className="text-xs font-semibold text-[var(--color-primary)]">Academic calendar</Link>
          </div>
          <div className="mt-3 space-y-2">
            {upcomingExams.length === 0 && <p className="text-sm text-[var(--color-muted)]">No examinations scheduled yet.</p>}
            {upcomingExams.map((e) => (
              <div key={e.id} className="rounded-lg border border-[var(--color-border)] p-3 text-sm">{e.name} — {e.term} {e.year}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold">New Learning Resources</h2>
          <Link href="/portal/resources" className="text-xs font-semibold text-[var(--color-primary)]">Open Learning Hub</Link>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {latestResources.map((r) => (
            <div key={r.id} className="rounded-lg border border-[var(--color-border)] p-3 text-sm">
              <p className="font-medium">{r.title}</p>
              <p className="text-xs text-[var(--color-muted)]">{r.subject} · {r.form} · {r.term} {r.year}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="card-surface p-5">
      <p className="font-display text-2xl font-bold text-[var(--color-primary)]">{value} {suffix && <span className="text-xs font-normal text-[var(--color-muted)]">{suffix}</span>}</p>
      <p className="mt-1 text-xs text-[var(--color-muted)]">{label}</p>
    </div>
  );
}
