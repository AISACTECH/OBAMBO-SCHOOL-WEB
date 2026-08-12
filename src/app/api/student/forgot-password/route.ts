import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAudit } from "@/lib/audit";
import { rateLimit, getClientIp } from "@/lib/security";

const schema = z.object({ admissionNumber: z.string().min(1).max(60) });
const GENERIC_MESSAGE =
  "If this admission number is registered, the school administration has been notified and will help you reset your password. Please visit the school office or contact the administration directly.";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = rateLimit(`student-forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ message: GENERIC_MESSAGE });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (parsed.success) {
    await logAudit({ actorType: "system", actorName: "Password Reset Request", action: "student_password_reset_requested", ipAddress: ip, details: { admissionNumber: parsed.data.admissionNumber } });
  }
  // Always return the same message regardless of whether the account exists.
  return NextResponse.json({ message: GENERIC_MESSAGE });
}
