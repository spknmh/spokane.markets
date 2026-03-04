"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type EventWithVenue = {
  id: string;
  slug: string;
  title: string;
  startDate: Date;
  endDate: Date;
  timezone: string | null;
  venue: { name: string; lat: number; lng: number };
};

interface EventsMapProps {
  events: EventWithVenue[];
}

const SPOKANE_CENTER: [number, number] = [47.6588, -117.426];
const DEFAULT_ZOOM = 10;

export function EventsMap({ events }: EventsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const validEvents = events.filter((e) => e.venue.lat !== 0 || e.venue.lng !== 0);
    const center =
      validEvents.length > 0
        ? ([validEvents[0].venue.lat, validEvents[0].venue.lng] as [number, number])
        : SPOKANE_CENTER;

    const map = L.map(mapRef.current, {
      center,
      zoom: validEvents.length > 0 ? 12 : DEFAULT_ZOOM,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    const bounds = new L.LatLngBounds([]);
    for (const event of validEvents) {
      const marker = L.marker([event.venue.lat, event.venue.lng]).addTo(map);
      const popup = L.popup().setContent(
        `<a href="/events/${event.slug}" class="font-medium text-primary hover:underline">${event.title}</a><br/><span class="text-sm text-muted-foreground">${event.venue.name}</span>`
      );
      marker.bindPopup(popup);
      bounds.extend([event.venue.lat, event.venue.lng]);
    }
    if (validEvents.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [events]);

  return (
    <div
      ref={mapRef}
      className="h-[400px] w-full touch-none sm:h-[500px]"
      aria-label="Events map"
    />
  );
}
