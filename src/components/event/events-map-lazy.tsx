"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { EventsMap as EventsMapComponent } from "./events-map";

const EventsMap = dynamic(
  () => import("./events-map").then((mod) => ({ default: mod.EventsMap })),
  { ssr: false }
);

export function EventsMapLazy(props: ComponentProps<typeof EventsMapComponent>) {
  return <EventsMap {...props} />;
}
