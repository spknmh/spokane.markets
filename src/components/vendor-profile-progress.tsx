"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VendorProfileProgressProps {
  percent: number;
  profileComplete: boolean;
  className?: string;
}

export function VendorProfileProgress({
  percent,
  profileComplete,
  className,
}: VendorProfileProgressProps) {
  if (profileComplete) return null;

  return (
    <div
      className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-4",
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span className="text-sm font-medium">Profile completion</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Add more details so customers can find and connect with you. This score is your profile
            showcase strength — separate from verification, which has its own requirements.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative h-10 w-10">
            <svg
              className="h-10 w-10 -rotate-90"
              viewBox="0 0 36 36"
              aria-hidden
            >
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-muted/30"
              />
              <circle
                cx="18"
                cy="18"
                r="15.9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray={`${percent} 100`}
                strokeLinecap="round"
                className="text-primary transition-[stroke-dasharray] duration-500"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">
              {percent}%
            </span>
          </div>
          <Button asChild size="sm">
            <Link href="/vendor/profile/edit">Complete</Link>
          </Button>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
