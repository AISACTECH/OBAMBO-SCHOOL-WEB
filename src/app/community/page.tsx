import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import PostFeed from "@/components/community/PostFeed";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: "St Mark's Community" };
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const publicGroups = await db.select().from(groups).where(eq(groups.visibility, "public"));

  return (
    <div>
      <PageHero eyebrow="St Mark's Community" title="A Moderated School Community" description="Discuss academics, student life, clubs, sports, alumni and community topics — safely and respectfully." />
      <div className="container-shell grid gap-8 py-12 lg:grid-cols-[1fr_320px]">
        <div>
          <h2 className="font-display text-xl font-bold">General Discussion</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Sign in as a student or alumni to post. All content is moderated.</p>
          <div className="mt-4"><PostFeed /></div>
        </div>
        <aside className="space-y-4">
          <div className="card-surface p-5">
            <h3 className="font-display font-semibold">Community Groups</h3>
            {publicGroups.length === 0 ? (
              <p className="mt-2 text-sm text-[var(--color-muted)]">Your community groups are just getting started.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {publicGroups.map((g) => (
                  <li key={g.id}>
                    <Link href={`/community/${g.slug}`} className="text-sm font-medium text-[var(--color-primary)]">{g.name}</Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="card-surface p-5">
            <h3 className="font-display font-semibold">Community Guidelines</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[var(--color-muted)]">
              <li>Be respectful — no harassment or bullying.</li>
              <li>No sharing of private student information.</li>
              <li>Report content that violates school policy.</li>
              <li>Moderators review all reports promptly.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
