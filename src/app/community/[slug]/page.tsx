import { notFound } from "next/navigation";
import PageHero from "@/components/site/PageHero";
import PostFeed from "@/components/community/PostFeed";
import { db } from "@/db";
import { groups } from "@/db/schema";
import { eq } from "drizzle-orm";
import { currentIdentity } from "@/lib/identity";
import { canAccessGroup } from "@/lib/community-access";

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rows = await db.select().from(groups).where(eq(groups.slug, slug)).limit(1);
  const group = rows[0];
  const identity = await currentIdentity();
  if (!group || !(await canAccessGroup(group, identity))) notFound();

  return (
    <div>
      <PageHero eyebrow={`Community · ${group.category}`} title={group.name} description={group.description || undefined} />
      <div className="container-shell max-w-2xl py-12">
        <PostFeed groupSlug={group.slug} />
      </div>
    </div>
  );
}
