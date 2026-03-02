/**
 * Sends email alerts to users who have favorited a vendor when that vendor
 * is added to a new event. Fire-and-forget — does not block.
 */
import { db } from "@/lib/db";
import { Resend } from "resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function sendVendorFavoriteAlerts(
  vendorProfileId: string,
  eventId: string
): void {
  void (async () => {
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) return;

      const [vendor, event, favorites] = await Promise.all([
        db.vendorProfile.findUnique({
          where: { id: vendorProfileId },
          select: { businessName: true, slug: true },
        }),
        db.event.findUnique({
          where: { id: eventId },
          select: {
            title: true,
            slug: true,
            startDate: true,
            venue: { select: { name: true } },
          },
        }),
        db.favoriteVendor.findMany({
          where: {
            vendorProfileId,
            emailAlerts: true,
          },
          include: {
            user: { select: { email: true, name: true } },
          },
        }),
      ]);

      if (!vendor || !event || favorites.length === 0) return;

      const resend = new Resend(resendKey);
      const eventUrl = `${APP_URL}/events/${event.slug}`;
      const vendorUrl = `${APP_URL}/vendors/${vendor.slug}`;
      const dateStr = new Date(event.startDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      for (const fav of favorites) {
        try {
          await resend.emails.send({
            from: "Spokane Markets <alerts@spokane.market>",
            to: fav.user.email,
            subject: `${vendor.businessName} is at ${event.title}`,
            html: `
              <h2>Hi${fav.user.name ? ` ${fav.user.name}` : ""},</h2>
              <p>A vendor you follow is participating in a new event:</p>
              <p><strong>${vendor.businessName}</strong> will be at <strong>${event.title}</strong></p>
              <p>${event.venue.name} · ${dateStr}</p>
              <p>
                <a href="${eventUrl}">View event</a> ·
                <a href="${vendorUrl}">View vendor</a>
              </p>
              <p><a href="${APP_URL}/settings/favorites">Manage favorite vendors</a></p>
            `,
          });
        } catch (err) {
          console.error(`Vendor alert failed for ${fav.user.email}:`, err);
        }
      }
    } catch (err) {
      console.error("Vendor favorite alerts error:", err);
    }
  })();
}
