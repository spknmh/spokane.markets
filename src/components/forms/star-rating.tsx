"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export function StarRating({
  value,
  onChange,
  readonly = false,
  size = "md",
}: StarRatingProps) {
  const sizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly || !onChange}
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-colors",
            !readonly && onChange
              ? "cursor-pointer hover:text-yellow-400"
              : "cursor-default"
          )}
          aria-label={`${star} star${star !== 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              sizeClass,
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}
