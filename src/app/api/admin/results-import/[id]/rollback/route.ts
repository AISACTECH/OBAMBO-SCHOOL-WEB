import { NextResponse } from "next/server";
import { db } from "@/db";
import { results, resultImports } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireStaff, isResponse } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff("manage_results");
  if (isResponse(session)) return session;

  const { id } = await params;
  const importId = Number(id);
  if (!Number.isSafeInteger(importId) || importId < 1) return NextResponse.json({ error: "Invalid import." }, { status: 400 });

  const result = await db.transaction(async (tx) => {
    const [importRecord] = await tx.select().from(resultImports).where(eq(resultImports.id, importId)).limit(1);
    if (!importRecord) return { error: "Import not found." as const };
    if (importRecord.rolledBack) return { error: "This import has already been rolled back." as const };

    for (const previous of importRecord.previousRows || []) {
      await tx.update(results).set({
        studentId: previous.studentId,
        admissionNumber: previous.admissionNumber,
        examName: previous.examName,
        subject: previous.subject,
        marks: previous.marks,
        grade: previous.grade,
        points: previous.points,
        teacherComment: previous.teacherComment,
        term: previous.term,
        year: previous.year,
        importId: previous.importId,
        status: previous.status,
      }).where(and(eq(results.id, previous.id), eq(results.importId, importId)));
    }

    const deleted = await tx.delete(results).where(eq(results.importId, importId)).returning({ id: results.id });
    await tx.update(resultImports).set({ rolledBack: true, status: "rolled_back" }).where(eq(resultImports.id, importId));
    return { recordsRemoved: deleted.length };
  });

  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.error === "Import not found." ? 404 : 409 });
  await logAudit({ actorType: "staff", actorId: session.id, actorName: session.name, action: "results_import_rolled_back", targetType: "result_import", targetId: importId, details: { recordsRemoved: result.recordsRemoved } });
  return NextResponse.json({ ok: true, recordsRemoved: result.recordsRemoved });
}
