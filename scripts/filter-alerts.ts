/**
 * Daily filter alert script — sends email notifications for saved filters.
 * Run with: npx tsx scripts/filter-alerts.ts
 * Designed to be executed via cron once per day.
 */

import { PrismaClient, type Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Resend } from "resend";
import { sendWithUnsubscribeHeaders } from "../src/server/email/send-with-headers";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function getDateRange(filter: string): { gte: Date; lt: Date } | null {
  const now = new Date();

  switch (filter) {
    case "today": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return { gte: start, lt: end };
    }
    case "weekend": {
      const day = now.getDay();
      const start = new Date(now);
      if (day === 0 || day === 6) {
        start.setHours(0, 0, 0, 0);
      } else {
        start.setDate(now.getDate() + (6 - day));
        start.setHours(0, 0, 0, 0);
      }
      const end = new Date(start);
      end.setDate(start.getDate() + (start.getDay() === 6 ? 2 : 1));
      end.setHours(23, 59, 59, 999);
      return { gte: start, lt: end };
    }
    case "week": {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { gte: start, lt: end };
    }
    case "month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { gte: start, lt: end };
    }
    default:
      return null;
  }
}

async function main() {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — skipping email delivery");
    await db.$disconnect();
    return;
  }

  const resend = new Resend(resendKey);

  const filters = await db.savedFilter.findMany({
    where: { emailAlerts: true },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (filters.length === 0) {
    console.log("No filters with email alerts enabled.");
    await db.$disconnect();
    return;
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const filtersByUser = new Map<
    string,
    { email: string; name: string | null; filters: typeof filters }
  >();

  for (const filter of filters) {
    const existing = filtersByUser.get(filter.userId);
    if (existing) {
      existing.filters.push(filter);
    } else {
      filtersByUser.set(filter.userId, {
        email: filter.user.email,
        name: filter.user.name,
        filters: [filter],
      });
    }
  }

  let totalEmails = 0;

  for (const [, { email, name, filters: userFilters }] of filtersByUser) {
    const filterResults: { filterName: string; events: { title: string; slug: string }[] }[] = [];

    for (const filter of userFilters) {
      const where: Prisma.EventWhereInput = {
        status: "PUBLISHED",
        createdAt: { gte: oneDayAgo },
      };

      if (filter.dateRange) {
        const range = getDateRange(filter.dateRange);
        if (range) {
          where.startDate = { gte: range.gte, lt: range.lt };
        }
      }

      if (filter.neighborhoods.length > 0) {
        where.venue = { neighborhood: { in: filter.neighborhoods } };
      }

      if (filter.categories.length > 0) {
        where.tags = { some: { slug: { in: filter.categories } } };
      }

      if (filter.features.length > 0) {
        where.features = { some: { slug: { in: filter.features } } };
      }

      const events = await db.event.findMany({
        where,
        select: { title: true, slug: true },
        orderBy: { startDate: "asc" },
        take: 20,
      });

      if (events.length > 0) {
        filterResults.push({ filterName: filter.name, events });
      }
    }

    if (filterResults.length === 0) continue;

    const eventListHtml = filterResults
      .map(
        ({ filterName, events }) =>
          `<h3>${filterName}</h3><ul>${events
            .map(
              (e) =>
                `<li><a href="${APP_URL}/events/${e.slug}">${e.title}</a></li>`
            )
            .join("")}</ul>`
      )
      .join("");

    const totalEvents = filterResults.reduce((sum, r) => sum + r.events.length, 0);

    try {
      await sendWithUnsubscribeHeaders(resend, {
        from: "Spokane Markets <alerts@spokane.market>",
        to: email,
        subject: `${totalEvents} new event${totalEvents === 1 ? "" : "s"} matching your filters`,
        html: `
          <h2>Hi${name ? ` ${name}` : ""},</h2>
          <p>New events were published in the last 24 hours that match your saved filters:</p>
          ${eventListHtml}
          <p><a href="${APP_URL}/settings/filters">Manage your filters</a></p>
          <p><a href="${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}&source=filters">Unsubscribe from filter alerts</a></p>
        `,
        unsubscribe: { type: "filters", email },
      });
      totalEmails++;
      console.log(`Sent alert to ${email} (${filterResults.length} filters, ${totalEvents} events)`);
    } catch (err) {
      console.error(`Failed to send to ${email}:`, err);
    }
  }

  console.log(`Done. Sent ${totalEmails} email(s).`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  db.$disconnect();
  process.exit(1);
});
