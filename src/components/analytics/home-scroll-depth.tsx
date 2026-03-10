"use client";

import { useScrollDepth } from "@/hooks/use-scroll-depth";

/** Tracks scroll depth on homepage. */
export function HomeScrollDepth() {
  useScrollDepth("scroll_depth");
  return null;
}
