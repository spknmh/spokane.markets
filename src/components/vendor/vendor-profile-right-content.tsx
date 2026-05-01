import type { ComponentProps } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/event/event-card";
import { MediaFrame } from "@/components/media";
import type { VendorProfileTab } from "@/components/vendor/vendor-profile-tabs";

type EventCardEvent = ComponentProps<typeof EventCard>["event"];

interface VendorProfileRightContentProps {
  activeTab: VendorProfileTab;
  vendorName: string;
  description: string | null;
  galleryUrls: string[];
  upcomingEvents: EventCardEvent[];
  pastEvents: EventCardEvent[];
}

export function VendorProfileRightContent({
  activeTab,
  vendorName,
  description,
  galleryUrls,
  upcomingEvents,
  pastEvents,
}: VendorProfileRightContentProps) {
  return (
    <section className="min-w-0 flex-1 space-y-6">
      {activeTab === "about" && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold">About {vendorName}</h2>
            {description?.trim() ? (
              <p className="mt-3 whitespace-pre-line text-muted-foreground">{description}</p>
            ) : (
              <p className="mt-3 text-muted-foreground">
                This vendor has not added a full profile description yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "photos" && (
        <Card>
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold">Photos</h2>
            {galleryUrls.length === 0 ? (
              <p className="mt-3 text-muted-foreground">No photos uploaded yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {galleryUrls.map((url, index) => (
                  <a
                    key={`${url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="overflow-hidden rounded-lg border border-border"
                  >
                    <MediaFrame
                      src={url}
                      alt={`${vendorName} gallery image ${index + 1}`}
                      aspect="4/3"
                      objectFit="contain"
                      sizes="(max-width: 640px) 90vw, (max-width: 1280px) 42vw, 26vw"
                    />
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "activity" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-5">
              <h2 className="text-xl font-semibold">Where we&apos;ll be next</h2>
              {upcomingEvents.length === 0 ? (
                <p className="mt-3 text-muted-foreground">
                  No upcoming dates listed yet. Save this vendor to hear about future events when
                  they&apos;re added.
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {pastEvents.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <h2 className="text-xl font-semibold">Seen at</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Past appearances on Spokane Markets (from listings and your activity).
                </p>
                <div className="mt-4 space-y-4">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
