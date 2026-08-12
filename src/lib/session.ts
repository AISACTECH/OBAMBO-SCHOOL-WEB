import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getAuthSecret } from "@/lib/security";

export type SessionType = "staff" | "student" | "alumni";

export interface SessionPayload {
  id: number;
  name: string;
  role: string;
  type: SessionType;
  [key: string]: unknown;
}

const secretKey = new TextEncoder().encode(getAuthSecret());
const SESSION_ISSUER = "stmarks-obambo";
const SESSION_AUDIENCE = "stmarks-digital-campus";

const COOKIE_NAMES: Record<SessionType, string> = {
  staff: "stmarks_admin_session",
  student: "stmarks_student_session",
  alumni: "stmarks_alumni_session",
};

function isSessionType(value: unknown): value is SessionType {
  return value === "staff" || value === "student" || value === "alumni";
}

const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES[payload.type], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return token;
}

export async function getSession(type: SessionType): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAMES[type])?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secretKey, {
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
    if (typeof payload.id !== "number" || typeof payload.name !== "string" || typeof payload.role !== "string" || !isSessionType(payload.type)) {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function destroySession(type: SessionType) {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES[type]);
}

export function sessionCookieName(type: SessionType) {
  return COOKIE_NAMES[type];
}
