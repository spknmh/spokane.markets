import { auth } from "@/auth";
import { db } from "@/lib/db";
import { adminVendorProfileSchema } from "@/lib/validations";
import { normalizeUrlToHttps, slugify } from "@/lib/utils";
import { NextResponse } from "next/server";

function toOptional(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  return value;
}

function toOptionalUrl(value: string | undefined): string | undefined {
  if (value === undefined || value === "") return undefined;
  return normalizeUrlToHttps(value);
}

async function generateUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = slugify(base) || "vendor";
  let candidate = slug;
  let n = 0;
  while (true) {
    const existing = await db.vendorProfile.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || (excludeId && existing.id === excludeId)) break;
    n += 1;
    candidate = `${slug}-${n}`;
  }
  return candidate;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { session };
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = adminVendorProfileSchema.safeParse(body);

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Validation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const data = parsed.data;
  let slug = data.slug;

  if (slug) {
    const existing = await db.vendorProfile.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: `Slug "${slug}" is already taken.` },
        { status: 400 }
      );
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
      facebookUrl: toOptionalUrl(data.facebookUrl),
      instagramUrl: toOptionalUrl(data.instagramUrl),
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
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin();
  if ("error" in result && result.error) return result.error;

  const { id } = await params;
  await db.vendorProfile.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
