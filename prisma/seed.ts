import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DEFAULT_NEIGHBORHOODS } from "../src/lib/neighborhoods-config";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const SEED_MARKER_ID = "sample_data_v1";

async function hasSampleDataBeenSeeded(): Promise<boolean> {
  try {
    const result = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM seed_marker WHERE id = ${SEED_MARKER_ID} LIMIT 1
    `;
    return result.length > 0;
  } catch {
    return false;
  }
}

async function markSampleDataSeeded(): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO seed_marker (id, ran_at) VALUES (${SEED_MARKER_ID}, NOW())
    ON CONFLICT (id) DO NOTHING
  `;
}

async function main() {
  const skipSampleData = await hasSampleDataBeenSeeded();
  if (skipSampleData) {
    console.log("Sample data already seeded; skipping venues, markets, events.");
  }

  // 1. Admin user (use password reset flow after seeding to set password)
  await prisma.user.upsert({
    where: { email: "admin@spokane.markets" },
    create: {
      name: "Admin",
      email: "admin@spokane.markets",
      role: "ADMIN",
      emailVerified: true,
    },
    update: {},
  });

  // 1b. Neighborhoods (source-of-truth for venue/market/subscriber area slugs)
  for (const neighborhood of DEFAULT_NEIGHBORHOODS) {
    await prisma.neighborhood.upsert({
      where: { slug: neighborhood.value },
      create: {
        slug: neighborhood.value,
        label: neighborhood.label,
        isActive: true,
      },
      update: {
        label: neighborhood.label,
        isActive: true,
      },
    });
  }

  // 2. Tags
  await prisma.tag.createMany({
    data: [
      { name: "Farmers Market", slug: "farmers-market" },
      { name: "Craft Fair", slug: "craft-fair" },
      { name: "Art Fair", slug: "art-fair" },
      { name: "Street Fair", slug: "street-fair" },
      { name: "Food Festival", slug: "food-festival" },
      { name: "Holiday Market", slug: "holiday-market" },
      { name: "Flea Market", slug: "flea-market" },
      { name: "Night Market", slug: "night-market" },
    ],
    skipDuplicates: true,
  });

  // 3. Features
  await prisma.feature.createMany({
    data: [
      { name: "Indoor", slug: "indoor" },
      { name: "Outdoor", slug: "outdoor" },
      { name: "Food Trucks", slug: "food-trucks" },
      { name: "Beer/Wine/Cider", slug: "beer-wine-cider" },
      { name: "Live Music", slug: "live-music" },
      { name: "Kid-Friendly", slug: "kid-friendly" },
      { name: "Dog-Friendly", slug: "dog-friendly" },
      { name: "ADA Accessible", slug: "ada-accessible" },
      { name: "Free Parking", slug: "free-parking" },
      { name: "Power Available", slug: "power-available" },
      { name: "Free Admission", slug: "free-admission" },
    ],
    skipDuplicates: true,
  });

  // Fetch tags and features for event connections (needed for sample events)
  const tags = await prisma.tag.findMany();
  const features = await prisma.feature.findMany();
  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t]));
  const featureBySlug = Object.fromEntries(features.map((f) => [f.slug, f]));

  if (!skipSampleData) {
    // 4. Venues (get-or-create pattern; Venue has no unique field)
    const venueData = [
    {
      name: "Riverfront Park",
      address: "507 N Howard St",
      city: "Spokane",
      state: "WA",
      zip: "99201",
      lat: 47.6588,
      lng: -117.426,
      neighborhood: "downtown",
    },
    {
      name: "Convention Center",
      address: "334 W Spokane Falls Blvd",
      city: "Spokane",
      state: "WA",
      zip: "99201",
      lat: 47.6595,
      lng: -117.423,
      neighborhood: "downtown",
    },
    {
      name: "South Perry District",
      address: "1000 S Perry St",
      city: "Spokane",
      state: "WA",
      zip: "99202",
      lat: 47.6381,
      lng: -117.3842,
      neighborhood: "south-hill",
    },
    {
      name: "Kendall Yards",
      address: "1335 W Summit Pkwy",
      city: "Spokane",
      state: "WA",
      zip: "99201",
      lat: 47.663,
      lng: -117.435,
      neighborhood: "kendall-yards",
    },
    {
      name: "Spokane Valley Mall Area",
      address: "14700 E Indiana Ave",
      city: "Spokane Valley",
      state: "WA",
      zip: "99216",
      lat: 47.6593,
      lng: -117.239,
      neighborhood: "spokane-valley",
    },
    {
      name: "Mirabeau Point Park",
      address: "13500 E Mirabeau Pkwy",
      city: "Spokane Valley",
      state: "WA",
      zip: "99216",
      lat: 47.697,
      lng: -117.236,
      neighborhood: "spokane-valley",
    },
  ];

  const venues: Record<string, { id: string }> = {};
  for (const v of venueData) {
    const existing = await prisma.venue.findFirst({
      where: { name: v.name, address: v.address },
    });
    const venue = existing ?? (await prisma.venue.create({ data: v }));
    venues[v.name] = { id: venue.id };
  }

  // 5. Markets
  const spokaneSaturdayMarket = await prisma.market.upsert({
    where: { slug: "spokane-saturday-market" },
    create: {
      name: "Spokane Saturday Market",
      slug: "spokane-saturday-market",
      venueId: venues["Riverfront Park"].id,
      baseArea: "downtown",
      typicalSchedule: "Saturdays, May–October",
      verificationStatus: "VERIFIED",
    },
    update: { venueId: venues["Riverfront Park"].id },
  });

  const southPerryMarket = await prisma.market.upsert({
    where: { slug: "south-perry-farmers-market" },
    create: {
      name: "South Perry Farmers Market",
      slug: "south-perry-farmers-market",
      venueId: venues["South Perry District"].id,
      baseArea: "south-hill",
      typicalSchedule: "Thursdays, June–September",
    },
    update: { venueId: venues["South Perry District"].id },
  });

  const kendallYardsMarket = await prisma.market.upsert({
    where: { slug: "kendall-yards-night-market" },
    create: {
      name: "Kendall Yards Night Market",
      slug: "kendall-yards-night-market",
      venueId: venues["Kendall Yards"].id,
      baseArea: "kendall-yards",
      typicalSchedule: "2nd Wednesday, May–September",
    },
    update: { venueId: venues["Kendall Yards"].id },
  });

  const valleyCraftMarket = await prisma.market.upsert({
    where: { slug: "valley-craft-vintage-fair" },
    create: {
      name: "Valley Craft & Vintage Fair",
      slug: "valley-craft-vintage-fair",
      venueId: venues["Spokane Valley Mall Area"].id,
      baseArea: "spokane-valley",
      typicalSchedule: "Monthly, year-round",
    },
    update: { venueId: venues["Spokane Valley Mall Area"].id },
  });

  // 6. Events (March–April 2026)
  const eventData = [
    {
      slug: "spokane-saturday-market-opening-day-2026",
      title: "Spokane Saturday Market Opening Day",
      marketId: spokaneSaturdayMarket.id,
      venueName: "Riverfront Park",
      startDate: new Date("2026-03-07T09:00:00"),
      endDate: new Date("2026-03-07T14:00:00"),
      tagSlugs: ["farmers-market", "craft-fair"],
      featureSlugs: ["outdoor", "food-trucks", "dog-friendly", "free-admission"],
    },
    {
      slug: "south-perry-spring-market-2026-03-12",
      title: "South Perry Spring Market",
      marketId: southPerryMarket.id,
      venueName: "South Perry District",
      startDate: new Date("2026-03-12T16:00:00"),
      endDate: new Date("2026-03-12T20:00:00"),
      tagSlugs: ["farmers-market"],
      featureSlugs: ["outdoor", "live-music", "kid-friendly"],
    },
    {
      slug: "kendall-yards-night-market-2026-03-11",
      title: "Kendall Yards Night Market",
      marketId: kendallYardsMarket.id,
      venueName: "Kendall Yards",
      startDate: new Date("2026-03-11T17:00:00"),
      endDate: new Date("2026-03-11T21:00:00"),
      tagSlugs: ["night-market", "food-festival"],
      featureSlugs: ["food-trucks", "beer-wine-cider", "live-music"],
    },
    {
      slug: "valley-spring-craft-fair-2026-03-14",
      title: "Valley Spring Craft Fair",
      marketId: valleyCraftMarket.id,
      venueName: "Spokane Valley Mall Area",
      startDate: new Date("2026-03-14T10:00:00"),
      endDate: new Date("2026-03-14T16:00:00"),
      tagSlugs: ["craft-fair"],
      featureSlugs: ["indoor", "free-parking", "ada-accessible"],
    },
    {
      slug: "riverfront-arts-crafts-festival-2026-03-21",
      title: "Riverfront Arts & Crafts Festival",
      marketId: null,
      venueName: "Convention Center",
      startDate: new Date("2026-03-21T10:00:00"),
      endDate: new Date("2026-03-21T17:00:00"),
      tagSlugs: ["art-fair", "craft-fair"],
      featureSlugs: ["indoor", "ada-accessible", "kid-friendly"],
    },
    {
      slug: "mirabeau-park-community-market-2026-03-28",
      title: "Mirabeau Park Community Market",
      marketId: null,
      venueName: "Mirabeau Point Park",
      startDate: new Date("2026-03-28T09:00:00"),
      endDate: new Date("2026-03-28T13:00:00"),
      tagSlugs: ["farmers-market"],
      featureSlugs: ["outdoor", "free-parking", "kid-friendly", "dog-friendly"],
    },
  ];

  for (const e of eventData) {
    const venueId = venues[e.venueName]?.id;
    if (!venueId) throw new Error(`Venue not found: ${e.venueName}`);

    await prisma.event.upsert({
      where: { slug: e.slug },
      create: {
        title: e.title,
        slug: e.slug,
        marketId: e.marketId,
        venueId,
        startDate: e.startDate,
        endDate: e.endDate,
        status: "PUBLISHED",
        tags: {
          connect: e.tagSlugs.map((s) => ({ id: tagBySlug[s]!.id })),
        },
        features: {
          connect: e.featureSlugs.map((s) => ({ id: featureBySlug[s]!.id })),
        },
      },
      update: {
        startDate: e.startDate,
        endDate: e.endDate,
        tags: { set: e.tagSlugs.map((s) => ({ id: tagBySlug[s]!.id })) },
        features: { set: e.featureSlugs.map((s) => ({ id: featureBySlug[s]!.id })) },
      },
    });
  }

    await markSampleDataSeeded();
  }

  // 7. Subscribers
  await prisma.subscriber.upsert({
    where: { email: "test@example.com" },
    create: {
      email: "test@example.com",
      areas: ["downtown", "south-hill"],
    },
    update: { areas: ["downtown", "south-hill"] },
  });

  // 8. Badge definitions
  const badgeDefinitions = [
    { slug: "member_1yr", name: "1 Year Member", description: "Member for 1 year", icon: "Calendar", category: "USER_ACHIEVEMENT" as const, requiredRole: "GLOBAL" as const, criteria: { type: "member_years", years: 1 }, sortOrder: 1 },
    { slug: "member_5yr", name: "5 Year Member", description: "Member for 5 years", icon: "Award", category: "USER_ACHIEVEMENT" as const, requiredRole: "GLOBAL" as const, criteria: { type: "member_years", years: 5 }, sortOrder: 2 },
    { slug: "first_review", name: "First Review", description: "Wrote your first approved review", icon: "Star", category: "USER_ACHIEVEMENT" as const, requiredRole: "GLOBAL" as const, criteria: { type: "reviews_count", min: 1 }, sortOrder: 3 },
    { slug: "event_explorer", name: "Event Explorer", description: "Marked Going or Interested to 3+ events", icon: "MapPin", category: "USER_ACHIEVEMENT" as const, requiredRole: "GLOBAL" as const, criteria: { type: "attendances_count", min: 3 }, sortOrder: 4 },
    { slug: "support_local", name: "Support Local", description: "Favorited 5+ vendors", icon: "Heart", category: "USER_ACHIEVEMENT" as const, requiredRole: "GLOBAL" as const, criteria: { type: "favorites_count", min: 5 }, sortOrder: 5 },
    { slug: "vendor_1yr", name: "1 Year Vendor", description: "Vendor for 1 year", icon: "Store", category: "USER_ACHIEVEMENT" as const, requiredRole: "VENDOR" as const, criteria: { type: "vendor_years", years: 1 }, sortOrder: 6 },
    { slug: "vendor_10_events", name: "10 Events Linked", description: "Linked to 10 events", icon: "CalendarCheck", category: "USER_ACHIEVEMENT" as const, requiredRole: "VENDOR" as const, criteria: { type: "vendor_events_count", min: 10 }, sortOrder: 7 },
    { slug: "vendor_50_events", name: "50 Events Linked", description: "Linked to 50 events", icon: "Trophy", category: "USER_ACHIEVEMENT" as const, requiredRole: "VENDOR" as const, criteria: { type: "vendor_events_count", min: 50 }, sortOrder: 8 },
    { slug: "organizer_1yr", name: "1 Year Organizer", description: "Organizer for 1 year", icon: "Calendar", category: "USER_ACHIEVEMENT" as const, requiredRole: "ORGANIZER" as const, criteria: { type: "organizer_years", years: 1 }, sortOrder: 9 },
    { slug: "organizer_5_markets", name: "5 Markets", description: "Own 5 verified markets", icon: "Building2", category: "USER_ACHIEVEMENT" as const, requiredRole: "ORGANIZER" as const, criteria: { type: "owned_markets_count", min: 5 }, sortOrder: 10 },
    { slug: "lgbtqia_welcoming", name: "LGBTQIA+ welcoming", description: "Welcoming and affirming", icon: "HeartHandshake", category: "LISTING_COMMUNITY" as const, requiredRole: "GLOBAL" as const, criteria: null, sortOrder: 100 },
    { slug: "women_owned", name: "Women-owned", description: "Owner or operator identifies as a woman", icon: "Users", category: "LISTING_COMMUNITY" as const, requiredRole: "GLOBAL" as const, criteria: null, sortOrder: 101 },
    { slug: "veteran_owned", name: "Veteran-owned", description: "Owned or operated by a veteran", icon: "Medal", category: "LISTING_COMMUNITY" as const, requiredRole: "GLOBAL" as const, criteria: null, sortOrder: 102 },
    { slug: "black_owned_business", name: "Black-owned business", description: "Owned or operated by Black entrepreneurs", icon: "Flag", category: "LISTING_COMMUNITY" as const, requiredRole: "GLOBAL" as const, criteria: null, sortOrder: 103 },
    { slug: "latine_hispanic_owned", name: "Latine- or Hispanic-owned", description: "Owned or operated by Latine or Hispanic entrepreneurs", icon: "Globe2", category: "LISTING_COMMUNITY" as const, requiredRole: "GLOBAL" as const, criteria: null, sortOrder: 104 },
    { slug: "aapi_owned", name: "AAPI-owned", description: "Owned or operated by Asian American and Pacific Islander entrepreneurs", icon: "Flower2", category: "LISTING_COMMUNITY" as const, requiredRole: "GLOBAL" as const, criteria: null, sortOrder: 105 },
    { slug: "indigenous_owned", name: "Indigenous-owned", description: "Owned or operated by Indigenous entrepreneurs", icon: "Trees", category: "LISTING_COMMUNITY" as const, requiredRole: "GLOBAL" as const, criteria: null, sortOrder: 106 },
    { slug: "disability_inclusive", name: "Disability-inclusive", description: "Explicitly committed to disability inclusion and accessibility", icon: "Accessibility", category: "LISTING_COMMUNITY" as const, requiredRole: "GLOBAL" as const, criteria: null, sortOrder: 107 },
  ];

  for (const b of badgeDefinitions) {
    await prisma.badgeDefinition.upsert({
      where: { slug: b.slug },
      create: b,
      update: { name: b.name, description: b.description, icon: b.icon, category: b.category, requiredRole: b.requiredRole, criteria: b.criteria as object | null, sortOrder: b.sortOrder },
    });
  }

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
