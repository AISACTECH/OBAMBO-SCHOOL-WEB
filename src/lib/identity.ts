import { getSession, type SessionType } from "@/lib/session";

export async function currentIdentity(): Promise<{ type: SessionType; id: number; name: string } | null> {
  for (const type of ["student", "alumni", "staff"] as SessionType[]) {
    const session = await getSession(type);
    if (session) return { type, id: session.id, name: session.name };
  }
  return null;
}
