import { db } from "@/lib/db";
import { DEFAULT_NEIGHBORHOODS, type NeighborhoodOption } from "@/lib/neighborhoods-config";

function cleanSlug(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export async function getNeighborhoodOptions(
  includeInactive = false
): Promise<NeighborhoodOption[]> {
  const rows = await db.neighborhood.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ label: "asc" }],
    select: { slug: true, label: true },
  });

  if (!rows.length) {
    return DEFAULT_NEIGHBORHOODS.map((entry) => ({
      value: entry.value,
      label: entry.label,
    }));
  }

  return rows.map((row) => ({
    value: row.slug,
    label: row.label,
  }));
}

export async function getNeighborhoodSlugSet(
  includeInactive = false
): Promise<Set<string>> {
  const options = await getNeighborhoodOptions(includeInactive);
  return new Set(options.map((option) => option.value));
}

export async function assertNeighborhoodSlug(
  rawValue: string | null | undefined,
  fieldName = "neighborhood"
): Promise<string | null> {
  const cleaned = cleanSlug(rawValue);
  if (!cleaned) return null;
  const allowed = await getNeighborhoodSlugSet();
  if (!allowed.has(cleaned)) {
    throw new Error(`Invalid ${fieldName} slug: "${cleaned}"`);
  }
  return cleaned;
}

export async function assertNeighborhoodSlugList(
  values: string[] | null | undefined,
  fieldName: string
): Promise<string[]> {
  if (!values?.length) return [];
  const allowed = await getNeighborhoodSlugSet();
  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const invalid = normalized.filter((value) => !allowed.has(value));
  if (invalid.length > 0) {
    throw new Error(`Invalid ${fieldName} slug(s): ${invalid.join(", ")}`);
  }

  return normalized;
}
