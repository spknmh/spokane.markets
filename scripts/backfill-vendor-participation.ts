/**
 * Backfill script: Migrate existing VendorEvent rows to EventVendorIntent + EventVendorRoster.
 * Run after applying the add_vendor_participation_model migration.
 *
 * Option A: Create intents (ATTENDING, PUBLIC) + roster (CONFIRMED) for each VendorEvent.
 * Usage: npm run db:backfill-participation
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const vendorEvents = await prisma.vendorEvent.findMany({
    include: { event: true, vendorProfile: true },
  });

  console.log(`Found ${vendorEvents.length} VendorEvent row(s) to backfill.`);

  let intentCount = 0;
  let rosterCount = 0;

  for (const ve of vendorEvents) {
    try {
      await prisma.$transaction(async (tx) => {
        const existingIntent = await tx.eventVendorIntent.findUnique({
          where: {
            eventId_vendorProfileId: {
              eventId: ve.eventId,
              vendorProfileId: ve.vendorProfileId,
            },
          },
        });
        if (!existingIntent) {
          await tx.eventVendorIntent.create({
            data: {
              eventId: ve.eventId,
              vendorProfileId: ve.vendorProfileId,
              status: "ATTENDING",
              visibility: "PUBLIC",
            },
          });
          intentCount++;
        }

        const existingRoster = await tx.eventVendorRoster.findUnique({
          where: {
            eventId_vendorProfileId: {
              eventId: ve.eventId,
              vendorProfileId: ve.vendorProfileId,
            },
          },
        });
        if (!existingRoster) {
          await tx.eventVendorRoster.create({
            data: {
              eventId: ve.eventId,
              vendorProfileId: ve.vendorProfileId,
              status: "CONFIRMED",
              approvedAt: ve.createdAt,
            },
          });
          rosterCount++;
        }
      });
    } catch (err) {
      console.error(`Error backfilling VendorEvent ${ve.id}:`, err);
    }
  }

  console.log(`Backfill complete: ${intentCount} intents, ${rosterCount} roster entries created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
