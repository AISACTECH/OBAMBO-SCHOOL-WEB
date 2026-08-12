import { db } from "@/db";
import { groupMembers, groups } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type CommunityIdentity = { type: "student" | "alumni" | "staff"; id: number } | null;
export type CommunityGroup = typeof groups.$inferSelect;

export async function canAccessGroup(group: CommunityGroup, identity: CommunityIdentity) {
  if (group.visibility === "public") return true;
  if (!identity) return false;
  if (identity.type === "staff") return true;
  if (group.visibility === "school_only") return true;
  if (group.visibility !== "approved_members") return false;

  const [member] = await db
    .select({ id: groupMembers.id })
    .from(groupMembers)
    .where(and(
      eq(groupMembers.groupId, group.id),
      eq(groupMembers.memberType, identity.type),
      eq(groupMembers.memberId, identity.id),
    ))
    .limit(1);
  return Boolean(member);
}
