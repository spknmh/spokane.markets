import { db } from "@/lib/db";
import { adminVendorProfileSchema } from "@/lib/validations";
import { extractSocialHandle, normalizeUrlToHttps, slugify } from "@/lib/utils";
import { NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/api-auth";

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

async function generateUniqueSlug(base: string, excludeId?: string): Promise<string> {
  const slug = slugify(base) || "vendor";
  let candidate = slug;
  let n = 0;
  while (true) {
    const existing = await db.vendorProfile.findFirst({
      where: { slug: candidate, deletedAt: null },
      select: { id: true },
    });
    if (!existing || (excludeId && existing.id === excludeId)) break;
    n += 1;
    candidate = `${slug}-${n}`;
  }
  return candidate;
}

export async function POST(request: Request) {
  const { error } = await requireApiAdminPermission("admin.listings.manage");
  if (error) return error;

  const body = await request.json();
  const parsed = adminVendorProfileSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Validation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;
  const slug = data.slug || (await generateUniqueSlug(data.businessName));

  const existing = await db.vendorProfile.findFirst({
    where: { slug, deletedAt: null },
  });
  if (existing) {
    return NextResponse.json(
      { error: `Slug "${slug}" is already taken.` },
      { status: 400 }
    );
  }

  const galleryUrls =
    data.galleryUrls ??
    (data.galleryUrlsText
      ? data.galleryUrlsText
          .split("\n")
          .map((s) => s.trim())
          .filter((s) => s.startsWith("http"))
      : []);

  let userId: string | undefined =
    data.userId && typeof data.userId === "string" && data.userId.trim()
      ? data.userId.trim()
      : undefined;

  if (!userId && data.contactEmail && typeof data.contactEmail === "string") {
    const userByEmail = await db.user.findUnique({
      where: { email: data.contactEmail.trim() },
      select: { id: true },
    });
    if (userByEmail) {
      userId = userByEmail.id;
    }
  }

  const vendor = await db.vendorProfile.create({
    data: {
      businessName: data.businessName,
      slug,
      description: toOptional(data.description),
      imageUrl: toOptional(data.imageUrl),
      ...(data.imageFocalX != null && { imageFocalX: data.imageFocalX }),
      ...(data.imageFocalY != null && { imageFocalY: data.imageFocalY }),
      websiteUrl: toOptionalUrl(data.websiteUrl),
      facebookUrl: toOptionalHandle(data.facebookUrl, "facebook"),
      instagramUrl: toOptionalHandle(data.instagramUrl, "instagram"),
      contactEmail: toOptional(data.contactEmail),
      contactPhone: toOptional(data.contactPhone),
      galleryUrls,
      specialties: toOptional(data.specialties),
      userId,
      contactVisible: data.contactVisible ?? true,
      socialLinksVisible: data.socialLinksVisible ?? true,
      ...(data.verificationStatus !== undefined && {
        verificationStatus: data.verificationStatus,
      }),
    },
  });

  return NextResponse.json(vendor, { status: 201 });
}
