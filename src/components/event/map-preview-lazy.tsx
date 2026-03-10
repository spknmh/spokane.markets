"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type { MapPreview as MapPreviewComponent } from "./map-preview";

const MapPreview = dynamic(
  () => import("./map-preview").then((mod) => ({ default: mod.MapPreview })),
  { ssr: false }
);

export function MapPreviewLazy(props: ComponentProps<typeof MapPreviewComponent>) {
  return <MapPreview {...props} />;
}
