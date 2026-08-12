import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function logAudit(entry: {
  actorType: "staff" | "student" | "alumni" | "system";
  actorId?: number | null;
  actorName: string;
  action: string;
  targetType?: string;
  targetId?: number | null;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      actorType: entry.actorType,
      actorId: entry.actorId ?? null,
      actorName: entry.actorName,
      action: entry.action,
      targetType: entry.targetType || "",
      targetId: entry.targetId ?? null,
      details: entry.details || {},
      ipAddress: entry.ipAddress || "",
    });
  } catch (err) {
    // Auditing must never break the primary request flow.
    console.error("Failed to write audit log", err);
  }
}
