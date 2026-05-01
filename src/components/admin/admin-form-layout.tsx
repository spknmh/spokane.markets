import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AdminTwoColumnFormLayout({
  main,
  aside,
}: {
  main: ReactNode;
  aside: ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] lg:gap-8">
      <div className="min-w-0 space-y-6">{main}</div>
      <aside className="min-w-0 space-y-6 lg:sticky lg:top-6">{aside}</aside>
    </div>
  );
}

export function AdminStickyActionBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-20 -mx-4 mt-8 border-t border-border bg-background/95 px-4 py-3 backdrop-blur",
        "sm:-mx-6 sm:px-6",
        "lg:mx-0 lg:rounded-lg lg:border lg:bg-background lg:px-4 lg:py-3",
        className
      )}
    >
      {children}
    </div>
  );
}
