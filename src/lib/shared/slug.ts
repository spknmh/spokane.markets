import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function generateUniqueVendorSlug(
  businessName: string,
  excludeId?: string
): Promise<string> {
  const slug = slugify(businessName) || "vendor";
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
