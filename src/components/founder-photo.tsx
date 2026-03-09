"use client";

import Image from "next/image";
import { User } from "lucide-react";
import { useState } from "react";

/** Shows founder photo if /founder.jpg exists, otherwise a placeholder. */
export function FounderPhoto() {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="flex h-48 w-48 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted sm:h-56 sm:w-56">
        <User className="h-24 w-24 text-muted-foreground/40" aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-border bg-muted sm:h-56 sm:w-56">
      <Image
        src="/founder.jpg"
        alt="Founder"
        width={224}
        height={224}
        className="h-full w-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  );
}
