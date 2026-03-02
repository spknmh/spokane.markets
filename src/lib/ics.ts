/**
 * Generate ICS (iCalendar) string for an event per RFC 5545.
 * Used for Add to Calendar downloads.
 */
function formatIcsDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const h = pad(d.getUTCHours());
  const min = pad(d.getUTCMinutes());
  const s = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${h}${min}${s}Z`;
}

function escapeIcsText(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

interface EventForIcs {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
}

interface VenueForIcs {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export function generateEventIcs(
  event: EventForIcs,
  venue: VenueForIcs,
  eventPageUrl: string
): string {
  const location = `${venue.name}, ${venue.address}, ${venue.city}, ${venue.state} ${venue.zip}`;
  const description = event.description
    ? escapeIcsText(event.description)
    : escapeIcsText(`${event.title} at ${venue.name}`);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Spokane Markets//Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@spokane.market`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(new Date(event.startDate))}`,
    `DTEND:${formatIcsDate(new Date(event.endDate))}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${escapeIcsText(location)}`,
    `URL:${eventPageUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}
