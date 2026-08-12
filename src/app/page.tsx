import Link from "next/link";
import { getSchoolSettings } from "@/lib/settings";
import { getActiveAnnouncements, getLatestNews, getUpcomingEvents, getSchoolPulse } from "@/lib/data";
import StatCounter from "@/components/ui/StatCounter";
import Reveal from "@/components/ui/Reveal";
import PulseFeed from "@/components/site/PulseFeed";
import PriorityBadge from "@/components/site/PriorityBadge";

export const dynamic = "force-dynamic";

const STAT_LABELS: Record<string, string> = {
  students: "Students",
  teachers: "Teachers",
  alumni: "Alumni",
  resources: "Learning Resources",
  years: "Years of Excellence",
  clubs: "Clubs & Activities",
};

export default async function HomePage() {
  const [settings, announcements, latestNews, upcomingEvents, pulse] = await Promise.all([
    getSchoolSettings(),
    getActiveAnnouncements(3),
    getLatestNews(3),
    getUpcomingEvents(3),
    getSchoolPulse(),
  ]);

  const visibleStats = Object.entries(settings.statsVisibility || {}).filter(([, visible]) => visible);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="decor-motion pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="decor-motion pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-[var(--color-secondary)]/20 blur-3xl" />
        <div className="container-shell relative py-16 md:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="animate-in text-white">
              <span className="badge bg-white/15 text-white">Obambo · Kisumu West Sub-County · Kisumu County</span>
              <h1 className="font-display mt-5 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                {settings.schoolName}
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/85 md:text-lg">
                A digital campus built on discipline, education and community — bringing our academics, learning
                resources, student portal, alumni network and school life together in one modern platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/about" className="btn btn-secondary">Explore Our School</Link>
                <Link href="/portal/login" className="btn bg-white text-[var(--color-accent)] hover:brightness-95">Student Portal</Link>
                <Link href="/contact" className="btn border border-white/40 text-white hover:bg-white/10">Admissions / Contact School</Link>
              </div>
            </div>

            <Reveal className="lg:justify-self-end" delay={150}>
              <div className="card-surface w-full max-w-sm bg-white/95 p-5 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
                    <span className="pulse-dot h-2 w-2 rounded-full bg-[var(--color-secondary)]" />
                    School Pulse
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">Live updates</span>
                </div>
                <p className="mt-2 text-xs text-[var(--color-muted)]">
                  {pulse.length} update{pulse.length === 1 ? "" : "s"} from across the school
                </p>
                <div className="mt-3 space-y-2">
                  {pulse.slice(0, 3).map((item) => (
                    <Link
                      href={item.href}
                      key={item.id}
                      className="block rounded-xl border border-[var(--color-border)] p-3 text-left transition hover:border-[var(--color-primary)]"
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-[var(--color-text)]">{item.title}</p>
                      <p className="line-clamp-1 text-xs text-[var(--color-muted)]">{item.detail}</p>
                    </Link>
                  ))}
                  {pulse.length === 0 && (
                    <p className="text-xs text-[var(--color-muted)]">You&apos;re all caught up — check back soon.</p>
                  )}
                </div>
                <Link href="/announcements" className="mt-3 block text-center text-xs font-semibold text-[var(--color-primary)]">
                  View all announcements →
                </Link>
              </div>
            </Reveal>
          </div>

          {visibleStats.length > 0 && (
            <div className="mt-14 grid grid-cols-2 gap-6 rounded-2xl border border-white/15 bg-white/5 p-6 md:grid-cols-4">
              {visibleStats.map(([key]) => (
                <StatCounter key={key} value={(settings.statsValues as Record<string, number>)?.[key] ?? 0} label={STAT_LABELS[key] || key} suffix="+" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SCHOOL PULSE */}
      <section className="container-shell py-14">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wide text-[var(--color-primary)]">Live from campus</span>
              <h2 className="font-display mt-1 text-2xl font-bold md:text-3xl">School Pulse — {pulse.length} update{pulse.length === 1 ? "" : "s"} today</h2>
            </div>
            <Link href="/announcements" className="btn btn-outline">See everything</Link>
          </div>
          <div className="mt-6">
            <PulseFeed items={pulse} />
          </div>
        </Reveal>
      </section>

      {/* ANNOUNCEMENTS */}
      <section className="bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)] py-14">
        <div className="container-shell">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl font-bold md:text-3xl">Announcements</h2>
              <Link href="/announcements" className="btn btn-outline">All announcements</Link>
            </div>
          </Reveal>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {announcements.length === 0 && (
              <p className="text-sm text-[var(--color-muted)]">No announcements yet. Check back soon — this space fills up fast once the school year is in session.</p>
            )}
            {announcements.map((a, idx) => (
              <Reveal key={a.id} delay={idx * 80}>
                <Link href={`/announcements/${a.slug}`} className="card-surface flex h-full flex-col p-5 transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge badge-normal capitalize">{a.category}</span>
                    <PriorityBadge priority={a.priority} />
                  </div>
                  <h3 className="font-display mt-3 line-clamp-2 text-lg font-semibold">{a.title}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-[var(--color-muted)]">{a.summary}</p>
                  <p className="mt-3 text-xs font-medium text-[var(--color-muted)]">
                    {new Date(a.publishAt ?? a.createdAt).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* NEWS */}
      <section className="container-shell py-14">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-2xl font-bold md:text-3xl">Latest School News</h2>
            <Link href="/news" className="btn btn-outline">Read more news</Link>
          </div>
        </Reveal>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {latestNews.length === 0 && (
            <p className="text-sm text-[var(--color-muted)]">School news will appear here once published by the communications office.</p>
          )}
          {latestNews.map((n, idx) => (
            <Reveal key={n.id} delay={idx * 80}>
              <Link href={`/news/${n.slug}`} className="card-surface group flex h-full flex-col overflow-hidden">
                <div className="aspect-[16/9] w-full bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)]" style={n.imageUrl ? { backgroundImage: `url(${n.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined} />
                <div className="flex flex-1 flex-col p-5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary)]">{n.category.replace(/-/g, " ")}</span>
                  <h3 className="font-display mt-2 line-clamp-2 text-lg font-semibold group-hover:text-[var(--color-primary)]">{n.title}</h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-[var(--color-muted)]">{n.excerpt}</p>
                  <p className="mt-3 text-xs text-[var(--color-muted)]">{n.readingTimeMinutes} min read</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* EVENTS + AI ASSISTANT + ALUMNI CTA */}
      <section className="bg-[var(--color-accent)] py-14 text-white">
        <div className="container-shell grid gap-8 lg:grid-cols-3">
          <Reveal className="card-surface bg-white/10 p-6 text-white">
            <h3 className="font-display text-lg font-semibold">Upcoming Events</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {upcomingEvents.length === 0 && <li className="text-white/70">No upcoming events published yet.</li>}
              {upcomingEvents.map((e) => (
                <li key={e.id} className="flex items-start gap-3">
                  <span className="rounded-lg bg-white/15 px-2 py-1 text-xs font-bold">
                    {new Date(e.startAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}
                  </span>
                  <span>{e.title}</span>
                </li>
              ))}
            </ul>
            <Link href="/events" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">View full calendar</Link>
          </Reveal>

          <Reveal delay={100} className="card-surface bg-white/10 p-6 text-white">
            <h3 className="font-display text-lg font-semibold">Ask St Mark&apos;s</h3>
            <p className="mt-2 text-sm text-white/80">Get instant answers from official school information — admissions, resources, results access and more.</p>
            <Link href="/ask" className="btn btn-secondary mt-4">Ask a question</Link>
          </Reveal>

          <Reveal delay={200} className="card-surface bg-white/10 p-6 text-white">
            <h3 className="font-display text-lg font-semibold">Reconnect With St Mark&apos;s</h3>
            <p className="mt-2 text-sm text-white/80">Your school journey doesn&apos;t end at graduation. Join the alumni network to mentor, connect and give back.</p>
            <Link href="/alumni/register" className="btn bg-white text-[var(--color-accent)] mt-4 hover:brightness-95">Join Alumni Network</Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
