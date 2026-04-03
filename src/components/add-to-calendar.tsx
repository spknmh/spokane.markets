"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackEvent } from "@/lib/analytics";
import { CalendarPlus } from "lucide-react";
import { generateEventIcs } from "@/lib/ics";

interface EventForCalendar {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
}

interface VenueForCalendar {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export function AddToCalendar({
  event,
  venue,
  eventPageUrl,
}: {
  event: EventForCalendar;
  venue: VenueForCalendar;
  eventPageUrl: string;
}) {
  const [open, setOpen] = useState(false);

  const downloadIcs = useCallback(() => {
    trackEvent("add_to_calendar_click", { provider: "ics", event_id: event.id });
    const ics = generateEventIcs(event, venue, eventPageUrl);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }, [event, venue, eventPageUrl]);

  const formatForGoogle = (d: Date): string => {
    return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", event.title);
  googleUrl.searchParams.set("dates", `${formatForGoogle(event.startDate)}/${formatForGoogle(event.endDate)}`);
  googleUrl.searchParams.set("location", `${venue.name}, ${venue.address}, ${venue.city}, ${venue.state} ${venue.zip}`);
  googleUrl.searchParams.set("details", event.description ?? `${event.title} at ${venue.name}`);

  const outlookUrl = new URL("https://outlook.live.com/calendar/0/action/compose");
  outlookUrl.searchParams.set("path", "/calendar/action/compose");
  outlookUrl.searchParams.set("rru", "addevent");
  outlookUrl.searchParams.set("subject", event.title);
  outlookUrl.searchParams.set("startdt", event.startDate.toISOString());
  outlookUrl.searchParams.set("enddt", event.endDate.toISOString());
  outlookUrl.searchParams.set("body", event.description ?? `${event.title} at ${venue.name}`);
  outlookUrl.searchParams.set("location", `${venue.name}, ${venue.address}, ${venue.city}, ${venue.state} ${venue.zip}`);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-[44px]"
        onClick={() => setOpen(true)}
      >
        <CalendarPlus className="mr-1.5 h-4 w-4 stroke-[1.5]" aria-hidden />
        Add to calendar
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add to calendar</DialogTitle>
            <DialogDescription>Choose how to add this event.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 px-6 pb-6">
            <Button variant="outline" className="justify-start" onClick={downloadIcs} type="button">
              <CalendarPlus className="mr-2 h-4 w-4 stroke-[1.5]" aria-hidden />
              Download (.ics)
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a
                href={googleUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("add_to_calendar_click", { provider: "google", event_id: event.id })}
              >
                Google Calendar
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a
                href={outlookUrl.toString()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("add_to_calendar_click", { provider: "outlook", event_id: event.id })}
              >
                Outlook
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
