import { db } from "@/db";
import { notifications } from "@/db/schema";

export async function notifyRecipients(
  recipients: { type: "student" | "alumni" | "staff"; id: number }[],
  payload: { type: string; title: string; body?: string; link?: string },
) {
  if (recipients.length === 0) return;
  await db.insert(notifications).values(
    recipients.map((r) => ({
      recipientType: r.type,
      recipientId: r.id,
      type: payload.type,
      title: payload.title,
      body: payload.body || "",
      link: payload.link || "",
    })),
  );
}

export async function notifyAllStudents(payload: { type: string; title: string; body?: string; link?: string }) {
  const { students } = await import("@/db/schema");
  const rows = await db.select({ id: students.id }).from(students);
  await notifyRecipients(
    rows.map((r) => ({ type: "student" as const, id: r.id })),
    payload,
  );
}

export async function notifyByIds(type: "student" | "alumni" | "staff", ids: number[], payload: { type: string; title: string; body?: string; link?: string }) {
  if (!ids.length) return;
  await notifyRecipients(
    ids.map((id) => ({ type, id })),
    payload,
  );
}
