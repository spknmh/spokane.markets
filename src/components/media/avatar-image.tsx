import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { isBannerUnoptimized } from "@/lib/utils";

export interface AvatarImageProps {
  src: string;
  alt: string;
  /** Tailwind size classes e.g. h-10 w-10 or h-40 w-40 */
  className?: string;
  focalX?: number | null;
  focalY?: number | null;
  sizes?: string;
  /** Smallest dimension for next/image sizes when not using fill */
  pixelSize?: number;
}

/**
 * Square avatar / logo thumb with consistent object-fit and optional focal point.
 */
export function AvatarImage({
  src,
  alt,
  className,
  focalX = 50,
  focalY = 50,
  sizes = "96px",
  pixelSize = 96,
}: AvatarImageProps) {
  const style: CSSProperties = {
    objectPosition: `${focalX ?? 50}% ${focalY ?? 50}%`,
  };

  return (
    <Image
      src={src}
      alt={alt}
      width={pixelSize}
      height={pixelSize}
      sizes={sizes}
      className={cn("object-cover", className)}
      style={style}
      unoptimized={isBannerUnoptimized(src)}
    />
  );
}
