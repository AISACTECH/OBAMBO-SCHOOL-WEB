import bcrypt from "bcryptjs";
import crypto from "crypto";

const DEV_AUTH_SECRET = "dev-insecure-secret-change-me-please-0000000000";

export function getAuthSecret() {
  const configured = process.env.AUTH_SECRET?.trim();
  const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";

  if (!configured) {
    if (process.env.NODE_ENV === "production" && !isProductionBuild) {
      throw new Error("AUTH_SECRET must be configured in production");
    }
    return DEV_AUTH_SECRET;
  }

  if (configured.length < 32 && process.env.NODE_ENV === "production" && !isProductionBuild) {
    throw new Error("AUTH_SECRET must be at least 32 characters in production");
  }

  return configured;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

export function hashSensitive(value: string) {
  // Deterministic hash (sha256) used for exact-match lookups of sensitive
  // identifiers (e.g. birth certificate numbers) which must never be stored
  // or displayed in plain text.
  const pepper = getAuthSecret();
  return crypto.createHash("sha256").update(`${pepper}:${value.trim().toLowerCase()}`).digest("hex");
}

export function last4(value: string) {
  const clean = value.trim();
  return clean.length <= 4 ? clean : clean.slice(-4);
}

/**
 * Very small in-memory rate limiter. This is scoped to a single server
 * instance which is acceptable for the school's traffic profile, but if the
 * app is deployed across multiple instances this should be swapped for a
 * shared store (e.g. Redis) — the function signature is designed so that
 * swap requires no call-site changes.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, max: number, windowMs: number) {
  if (max < 1 || windowMs < 1) return { allowed: false, remaining: 0, retryAfterMs: windowMs };

  const now = Date.now();
  // Prevent an attacker from growing this process-local map indefinitely by
  // sending a unique client key on every request.
  for (const [storedKey, entry] of attempts) {
    if (entry.resetAt <= now) attempts.delete(storedKey);
  }
  if (attempts.size >= 10_000 && !attempts.has(key)) {
    const oldestKey = attempts.keys().next().value;
    if (oldestKey) attempts.delete(oldestKey);
  }

  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1 };
  }
  if (entry.count >= max) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }
  entry.count += 1;
  return { allowed: true, remaining: max - entry.count };
}

export function getClientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = headers.get("x-real-ip")?.trim();
  return (forwarded || real || "unknown").slice(0, 128);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 90);
}

export function sanitizeFilename(name: string) {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${base}`;
}

const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  document: ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"],
  image: ["jpg", "jpeg", "png", "webp", "gif"],
  media: ["mp3", "mp4", "wav", "webm"],
};

export function isAllowedUpload(filename: string, kind: "document" | "image" | "media") {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return ALLOWED_EXTENSIONS[kind].includes(ext);
}

export function fileKindFromName(filename: string): "document" | "image" | "media" | "unknown" {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  for (const [kind, exts] of Object.entries(ALLOWED_EXTENSIONS)) {
    if (exts.includes(ext)) return kind as "document" | "image" | "media";
  }
  return "unknown";
}
