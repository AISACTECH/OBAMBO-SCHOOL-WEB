import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import { db } from "@/db";
import { events } from "@/db/schema";
import { and, eq, gte, asc, desc, lt } from "drizzle-orm";

export const metadata: Metadata = { title: "School Calendar & Events" };
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const now = new Date();
  const [futureEvents, pastEvents] = await Promise.all([
    db
      .select()
      .from(events)
      .where(and(eq(events.status, "published"), gte(events.startAt, now)))
      .orderBy(asc(events.startAt)),
    db
      .select()
      .from(events)
      .where(and(eq(events.status, "published"), lt(events.startAt, now)))
      .orderBy(desc(events.startAt))
      .limit(6),
  ]);

  return (
    <div>
      <PageHero eyebrow="School Calendar" title="Events & Academic Calendar" description="Examinations, meetings, sports, club activities, holidays and admission dates." />
      <div className="container-shell py-12">
        <h2 className="font-display text-2xl font-bold">Upcoming</h2>
        {futureEvents.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">No upcoming events published yet — check back soon.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {futureEvents.map((e) => (
              <div key={e.id} id={e.slug} className="card-surface flex gap-4 p-5">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[var(--color-primary)] text-center text-white">
                  <div>
                    <div className="text-lg font-bold leading-none">{new Date(e.startAt).getDate()}</div>
                    <div className="text-[10px] uppercase">{new Date(e.startAt).toLocaleDateString("en-KE", { month: "short" })}</div>
                  </div>
                </div>
                <div>
                  <span className="badge badge-normal capitalize">{e.category}</span>
                  <h3 className="font-display mt-1 font-semibold">{e.title}</h3>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">{e.description}</p>
                  <p className="mt-2 text-xs text-[var(--color-muted)]">{e.location} · {new Date(e.startAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="font-display mt-12 text-2xl font-bold">Recent Past Events</h2>
        {pastEvents.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-muted)]">No past events recorded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {pastEvents.map((e) => (
              <li key={e.id} className="card-surface flex items-center justify-between p-4 text-sm">
                <span>{e.title}</span>
                <span className="text-xs text-[var(--color-muted)]">{new Date(e.startAt).toLocaleDateString("en-KE")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
