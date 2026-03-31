import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import crypto from "node:crypto";
import { processBufferForUpload, type UploadImageType } from "@/lib/image-process";

const UPLOAD_BASE = join(process.cwd(), "uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok, retryAfter } = await checkRateLimit(session.user.id, "uploads");
  if (!ok) {
    const retryHeaders = retryAfter ? { "Retry-After": String(retryAfter) } : undefined;
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: retryHeaders }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "avatar";
  const allowedTypes = ["avatar", "vendor", "banner", "event", "market"];
  if (!allowedTypes.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const role = session.user.role ?? "USER";
  if (type === "banner" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (type === "market" && role !== "ADMIN" && role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (type === "event" && role !== "ADMIN" && role !== "ORGANIZER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 5MB" },
      { status: 400 }
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const inputBuffer = Buffer.from(bytes);

  let outBuffer = inputBuffer;
  let ext: string;
  let contentType = file.type;

  try {
    const processed = await processBufferForUpload(inputBuffer, file.type, type as UploadImageType);
    outBuffer = Buffer.from(processed.buffer);
    ext = processed.extension;
    contentType = processed.contentType;
  } catch (err) {
    console.error("[upload/image] process failed, storing original", err);
    const MIME_TO_EXT: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    };
    ext = MIME_TO_EXT[file.type] ?? "jpg";
  }

  const filename = `${crypto.randomUUID()}.${ext}`;
  const uploadDir = join(UPLOAD_BASE, type);
  const filePath = join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });

  await writeFile(filePath, outBuffer);

  const url = `/uploads/${type}/${filename}`;
  return NextResponse.json({ url, contentType });
}
