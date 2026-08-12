import Link from "next/link";
import PriorityBadge from "@/components/site/PriorityBadge";
import { getActiveAnnouncements } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PortalAnnouncementsPage() {
  const announcements = await getActiveAnnouncements(20, "students");
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">My Announcements</h1>
      <div className="mt-6 space-y-3">
        {announcements.length === 0 && <p className="text-sm text-[var(--color-muted)]">You&apos;re all caught up.</p>}
        {announcements.map((a) => (
          <Link key={a.id} href={`/announcements/${a.slug}`} className="card-surface flex items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">{a.summary}</p>
            </div>
            <PriorityBadge priority={a.priority} />
          </Link>
        ))}
      </div>
    </div>
  );
}
