import { requireApiAdmin } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { db } from "@/lib/db";
import { adminVendorProfileSchema } from "@/lib/validations";
import { extractSocialHandle, normalizeUrlToHttps, slugify } from "@/lib/utils";
import { NextResponse } from "next/server";

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
  let slug = slugify(base) || "vendor";
  const candidate_base = slug;
  let candidate = slug;
  let n = 0;
  while (true) {
    const existing = await db.vendorProfile.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || (excludeId && existing.id === excludeId)) break;
    n += 1;
    candidate = `${candidate_base}-${n}`;
  }
  return candidate;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const parsed = adminVendorProfileSchema.safeParse(body);

    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    const data = parsed.data;
    let slug = data.slug;

    if (slug) {
      const existing = await db.vendorProfile.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (existing && existing.id !== id) {
        return apiError(`Slug "${slug}" is already taken.`, 400);
      }
    } else {
      const current = await db.vendorProfile.findUnique({
        where: { id },
        select: { businessName: true },
      });
      slug = current
        ? await generateUniqueSlug(current.businessName, id)
        : await generateUniqueSlug(data.businessName, id);
    }

    const galleryUrls =
      data.galleryUrls ??
      (data.galleryUrlsText
        ? data.galleryUrlsText
            .split("\n")
            .map((s) => s.trim())
            .filter((s) => s.startsWith("http"))
        : undefined);

    const vendor = await db.vendorProfile.update({
      where: { id },
      data: {
        businessName: data.businessName,
        slug,
        description: toOptional(data.description),
        imageUrl: toOptional(data.imageUrl),
        websiteUrl: toOptionalUrl(data.websiteUrl),
        facebookUrl: toOptionalHandle(data.facebookUrl, "facebook"),
        instagramUrl: toOptionalHandle(data.instagramUrl, "instagram"),
        contactEmail: toOptional(data.contactEmail),
        contactPhone: toOptional(data.contactPhone),
        ...(Array.isArray(galleryUrls) && { galleryUrls }),
        specialties: toOptional(data.specialties),
        userId:
          data.userId && typeof data.userId === "string" && data.userId.trim()
            ? data.userId.trim()
            : null,
        contactVisible: data.contactVisible ?? true,
        socialLinksVisible: data.socialLinksVisible ?? true,
      },
    });

    return NextResponse.json(vendor);
  } catch (err) {
    console.error("[PUT /api/admin/vendors/:id]", err);
    return apiError("Internal server error", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireApiAdmin();
    if (error) return error;

    const { id } = await params;
    await db.vendorProfile.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/vendors/:id]", err);
    return apiError("Internal server error", 500);
  }
}
