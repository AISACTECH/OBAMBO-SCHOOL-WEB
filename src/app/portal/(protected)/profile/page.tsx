import { requireStudent, isResponse } from "@/lib/guards";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { students } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireStudent();
  if (isResponse(session)) redirect("/portal/login");
  const rows = await db.select().from(students).where(eq(students.id, session!.id)).limit(1);
  const student = rows[0];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">My Profile</h1>
      <div className="card-surface mt-6 max-w-lg space-y-4 p-6">
        <Field label="Full Name" value={student.name} />
        <Field label="Admission Number" value={student.admissionNumber} />
        <Field label="Form / Class" value={student.form} />
        <Field label="Stream" value={student.stream || "—"} />
        <Field label="Status" value={student.status} />
        <Field label="Birth Certificate Number" value={`•••• ${student.birthCertLast4}`} />
        <p className="text-xs text-[var(--color-muted)]">
          For your security, only the last 4 digits of your birth certificate number are ever shown. Contact the school
          administration to update your profile details.
        </p>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3 last:border-0">
      <span className="text-sm text-[var(--color-muted)]">{label}</span>
      <span className="text-sm font-semibold capitalize">{value}</span>
    </div>
  );
}
