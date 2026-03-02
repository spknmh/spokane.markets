import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import crypto from "node:crypto";

const UPLOAD_DIR = join(process.cwd(), "uploads", "photos");

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
      { status: 400 }
    );
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10MB" },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });

  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, filename), bytes);

  const reviewId = formData.get("reviewId") as string | null;
  const eventId = formData.get("eventId") as string | null;
  const marketId = formData.get("marketId") as string | null;

  const photo = await db.photo.create({
    data: {
      url: `/uploads/photos/${filename}`,
      alt: file.name,
      status: "PENDING",
      uploadedById: session.user.id!,
      reviewId: reviewId || null,
      eventId: eventId || null,
      marketId: marketId || null,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
