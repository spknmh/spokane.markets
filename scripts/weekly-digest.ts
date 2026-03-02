import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();

async function main() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set — skipping digest send.");
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://spokane.market";
  const resend = new Resend(apiKey);

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const subscribers = await prisma.subscriber.findMany();
  console.log(`Found ${subscribers.length} subscriber(s)`);

  let sentCount = 0;
  let errorCount = 0;

  for (const subscriber of subscribers) {
    const areaFilter =
      subscriber.areas.length > 0
        ? { venue: { neighborhood: { in: subscriber.areas } } }
        : {};

    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        startDate: { gte: now, lte: nextWeek },
        ...areaFilter,
      },
      orderBy: { startDate: "asc" },
      include: {
        venue: { select: { name: true, neighborhood: true } },
      },
    });

    if (events.length === 0) {
      console.log(`No events for ${subscriber.email} — skipping`);
      continue;
    }

    const eventsHtml = events
      .map((event) => {
        const date = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }).format(new Date(event.startDate));

        const neighborhood = event.venue.neighborhood
          ? ` · ${event.venue.neighborhood}`
          : "";

        return `
          <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eee;">
              <a href="${appUrl}/events/${event.slug}" style="color:#16a34a;font-weight:600;text-decoration:none;font-size:16px;">
                ${escapeHtml(event.title)}
              </a>
              <div style="color:#666;font-size:14px;margin-top:4px;">
                ${escapeHtml(date)} · ${escapeHtml(event.venue.name)}${escapeHtml(neighborhood)}
              </div>
            </td>
          </tr>`;
      })
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
        <h1 style="color:#16a34a;font-size:24px;margin-bottom:4px;">This Week in Spokane Markets</h1>
        <p style="color:#888;margin-top:0;">Here are ${events.length} upcoming event${events.length === 1 ? "" : "s"} for you:</p>
        <table style="width:100%;border-collapse:collapse;">
          ${eventsHtml}
        </table>
        <p style="margin-top:24px;font-size:13px;color:#999;">
          <a href="${appUrl}/unsubscribe?email=${encodeURIComponent(subscriber.email)}" style="color:#999;">Unsubscribe</a>
        </p>
      </body>
      </html>`;

    try {
      await resend.emails.send({
        from: "Spokane Markets <digest@spokane.market>",
        to: subscriber.email,
        subject: "This Week in Spokane Markets",
        html,
      });
      sentCount++;
      console.log(`Sent to ${subscriber.email}`);
    } catch (err) {
      errorCount++;
      console.error(`Failed to send to ${subscriber.email}:`, err);
    }
  }

  console.log(`\nDigest complete: ${sentCount} sent, ${errorCount} errors`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

main()
  .catch((err) => {
    console.error("Fatal error in weekly digest:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
