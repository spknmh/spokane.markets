import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { vendorProfileSchema } from "@/lib/validations";
import { extractSocialHandle, normalizeUrlToHttps, slugify } from "@/lib/utils";

function toOptional(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  return value;
}

function toOptionalUrl(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  return normalizeUrlToHttps(value);
}

function toOptionalHandle(
  value: string | undefined,
  platform: "facebook" | "instagram"
): string | undefined {
  if (value === undefined || value === "") return undefined;
  const handle = extractSocialHandle(value, platform);
  return handle ? handle : undefined;
}

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = slugify(base) || "vendor";
  let candidate = slug;
  let n = 0;
  while (await db.vendorProfile.findUnique({ where: { slug: candidate } })) {
    n += 1;
    candidate = `${slug}-${n}`;
  }
  return candidate;
}

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        vendorEvents: {
          include: {
            event: {
              include: { venue: true, tags: true, features: true },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error("Vendor profile GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch vendor profile" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Vendor profile already exists. Use PUT to update." },
        { status: 409 },
      );
    }

    const body = await request.json();
    const parsed = vendorProfileSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;
    const slug = await generateUniqueSlug(data.businessName);

    const profile = await db.$transaction(async (tx) => {
      const user = await tx.user.findUniqueOrThrow({
        where: { id: session.user.id },
      });

      if (user.role === "USER") {
        await tx.user.update({
          where: { id: session.user.id },
          data: { role: "VENDOR" },
        });
      }

      return tx.vendorProfile.create({
        data: {
          userId: session.user.id,
          businessName: data.businessName,
          slug,
          description: toOptional(data.description),
          imageUrl: toOptional(data.imageUrl),
          websiteUrl: toOptionalUrl(data.websiteUrl),
          facebookUrl: toOptionalHandle(data.facebookUrl, "facebook"),
          instagramUrl: toOptionalHandle(data.instagramUrl, "instagram"),
          contactEmail: toOptional(data.contactEmail),
          contactPhone: toOptional(data.contactPhone),
          galleryUrls: data.galleryUrls ?? [],
          specialties: toOptional(data.specialties),
        },
      });
    });

    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    console.error("Vendor profile POST error:", err);
    return NextResponse.json(
      { error: "Failed to create vendor profile" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await db.vendorProfile.findUnique({
      where: { userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "No vendor profile found. Use POST to create one." },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = vendorProfileSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const data = parsed.data;

    const profile = await db.vendorProfile.update({
      where: { userId: session.user.id },
      data: {
        businessName: data.businessName,
        description: toOptional(data.description),
        imageUrl: toOptional(data.imageUrl),
        websiteUrl: toOptionalUrl(data.websiteUrl),
        facebookUrl: toOptionalHandle(data.facebookUrl, "facebook"),
        instagramUrl: toOptionalHandle(data.instagramUrl, "instagram"),
        contactEmail: toOptional(data.contactEmail),
        contactPhone: toOptional(data.contactPhone),
        galleryUrls: data.galleryUrls ?? [],
        specialties: toOptional(data.specialties),
      },
    });

    return NextResponse.json(profile);
  } catch (err) {
    console.error("Vendor profile PUT error:", err);
    return NextResponse.json(
      { error: "Failed to update vendor profile" },
      { status: 500 },
    );
  }
}
