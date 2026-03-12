import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_NEIGHBORHOODS } from "../src/lib/neighborhoods-config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const canonicalSlugs = new Set(DEFAULT_NEIGHBORHOODS.map((entry) => entry.value));

const aliasMap: Record<string, string> = {
  "downtown-riverfront": "downtown",
  "south-hill-perry-district": "south-hill",
  "perry-district": "south-hill",
  "garland-north-monroe": "garland",
  "north-monroe": "garland",
  "north-spokane-mead": "north-spokane",
  mead: "north-spokane",
  "spokane-valley-millwood": "spokane-valley",
  millwood: "spokane-valley",
  "cheney-airway-heights": "cheney",
  "airway-heights": "cheney",
};

function normalizeNeighborhoodSlug(rawValue: string | null | undefined): string | null {
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (canonicalSlugs.has(normalized)) return normalized;
  if (aliasMap[normalized]) return aliasMap[normalized];
  return null;
}

function printHeader(title: string) {
  console.log("");
  console.log(`=== ${title} ===`);
}

type AuditRow = { value: string | null; count: bigint };

function printRows(title: string, rows: AuditRow[]) {
  printHeader(title);
  if (!rows.length) {
    console.log("No rows.");
    return;
  }

  for (const row of rows) {
    const normalized = normalizeNeighborhoodSlug(row.value);
    const status = row.value == null || normalized ? "ok" : "unmapped";
    console.log(
      JSON.stringify({
        raw: row.value,
        count: Number(row.count),
        normalized,
        status,
      })
    );
  }
}

async function main() {
  console.log("Canonical neighborhoods:");
  for (const item of DEFAULT_NEIGHBORHOODS) {
    console.log(JSON.stringify(item));
  }

  const venueRows = await prisma.$queryRaw<AuditRow[]>`
    SELECT "neighborhood" AS value, COUNT(*)::bigint AS count
    FROM "venues"
    GROUP BY "neighborhood"
    ORDER BY count DESC
  `;
  printRows("venues.neighborhood distinct values", venueRows);

  const marketRows = await prisma.$queryRaw<AuditRow[]>`
    SELECT "baseArea" AS value, COUNT(*)::bigint AS count
    FROM "markets"
    GROUP BY "baseArea"
    ORDER BY count DESC
  `;
  printRows("markets.baseArea distinct values", marketRows);

  const subscriberRows = await prisma.$queryRaw<AuditRow[]>`
    SELECT area AS value, COUNT(*)::bigint AS count
    FROM "subscribers", unnest("areas") AS area
    GROUP BY area
    ORDER BY count DESC
  `;
  printRows("subscribers.areas flattened values", subscriberRows);

  const savedFilterRows = await prisma.$queryRaw<AuditRow[]>`
    SELECT area AS value, COUNT(*)::bigint AS count
    FROM "saved_filters", unnest("neighborhoods") AS area
    GROUP BY area
    ORDER BY count DESC
  `;
  printRows("saved_filters.neighborhoods flattened values", savedFilterRows);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
