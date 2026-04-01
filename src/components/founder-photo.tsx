"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const sizeClasses = "h-48 w-48 sm:h-56 sm:w-56";

const shapeClasses = {
  rounded: "rounded-2xl border border-border",
  circle: "rounded-full border-4 border-[#fcf8f1]",
} as const;

export type FounderPhotoShape = keyof typeof shapeClasses;

interface FounderPhotoProps {
  className?: string;
  /** Default card corners; `circle` matches the backstory / flyer portrait. */
  shape?: FounderPhotoShape;
}

/** Shows founder photo if /founder.jpg exists, otherwise a placeholder. */
export function FounderPhoto({ className, shape = "rounded" }: FounderPhotoProps) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden bg-muted",
          sizeClasses,
          shapeClasses[shape],
          className
        )}
      >
        <User className="h-24 w-24 text-muted-foreground/40" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        sizeClasses,
        shapeClasses[shape],
        className
      )}
    >
      <Image
        src="/founder.jpg"
        alt="Hunter — Founder"
        width={224}
        height={224}
        className="h-full w-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}
