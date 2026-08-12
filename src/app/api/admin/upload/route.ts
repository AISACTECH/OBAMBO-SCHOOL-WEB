import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { requireStaff, isResponse } from "@/lib/guards";
import { isAllowedUpload, fileKindFromName, sanitizeFilename } from "@/lib/security";
import { logAudit } from "@/lib/audit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await requireStaff("manage_content");
  if (isResponse(session)) return session;

  const form = await req.formData();
  const fileValue = form.get("file");
  const file = fileValue instanceof File ? fileValue : null;
  const category = String(form.get("category") || "general").slice(0, 80);
  if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: "File is too large. Maximum size is 25MB." }, { status: 400 });
  }

  const kind = fileKindFromName(file.name);
  if (kind === "unknown" || !isAllowedUpload(file.name, kind)) {
    return NextResponse.json({ error: "This file type is not allowed for security reasons." }, { status: 400 });
  }
  if (kind === "image" && file.type && !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    return NextResponse.json({ error: "The image content type does not match its file extension." }, { status: 400 });
  }
  if (kind === "media" && file.type && !["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "video/mp4", "video/webm"].includes(file.type)) {
    return NextResponse.json({ error: "The media content type does not match its file extension." }, { status: 400 });
  }

  const safeName = sanitizeFilename(file.name);
  const safeCategory = category.replace(/[^a-z0-9-]/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "general";
  const dir = path.join(process.cwd(), "public", "uploads", safeCategory);
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const url = `/uploads/${safeCategory}/${safeName}`;

  await logAudit({
    actorType: "staff",
    actorId: session.id,
    actorName: session.name,
    action: "file_uploaded",
    details: { fileName: file.name, url, size: file.size },
  });

  return NextResponse.json({ url, fileType: file.name.split(".").pop()?.toLowerCase(), fileSize: file.size });
}
