import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { isBannerUnoptimized } from "@/lib/utils";

export type MediaFrameAspect = "16/9" | "4/3" | "1/1" | "video";

const aspectClass: Record<MediaFrameAspect, string> = {
  "16/9": "aspect-[16/9]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  video: "aspect-video",
};

export interface MediaFrameProps {
  src: string;
  alt: string;
  /** How the image fills the frame. `contain` avoids cropping (letterboxing). */
  objectFit?: "cover" | "contain";
  /** Focal point 0–100; defaults to center (50, 50). */
  focalX?: number | null;
  focalY?: number | null;
  aspect?: MediaFrameAspect;
  className?: string;
  imgClassName?: string;
  sizes: string;
  priority?: boolean;
}

/**
 * Fixed-aspect container for list cards and heroes. Prefer over ad-hoc `fill` + `object-cover` blocks.
 */
export function MediaFrame({
  src,
  alt,
  objectFit = "cover",
  focalX = 50,
  focalY = 50,
  aspect = "16/9",
  className,
  imgClassName,
  sizes,
  priority,
}: MediaFrameProps) {
  const position: CSSProperties = {
    objectPosition: `${focalX ?? 50}% ${focalY ?? 50}%`,
  };

  return (
    <div
      className={cn("relative w-full overflow-hidden bg-muted", aspectClass[aspect], className)}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn(objectFit === "contain" ? "object-contain" : "object-cover", imgClassName)}
        style={position}
        unoptimized={isBannerUnoptimized(src)}
      />
    </div>
  );
}
