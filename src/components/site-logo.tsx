import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

/** Whimsical market stall icon - curved awning + basket */
function MarketIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Awning/canopy */}
      <path
        d="M6 14c0-2 4-6 14-6s14 4 14 6v4H6v-4z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M6 18h28v2c0 1.5-2 3-6 3H12c-4 0-6-1.5-6-3v-2z"
        fill="currentColor"
        opacity="0.7"
      />
      {/* Basket handle */}
      <path
        d="M18 22c0-2 2-4 4-4s4 2 4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      {/* Produce dots */}
      <circle cx="14" cy="26" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="20" cy="25" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="26" cy="26" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        <MarketIcon className="h-5 w-5" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">
          <span className="text-primary">{SITE_NAME.split(" ")[0]}</span>
          {SITE_NAME.includes(" ") && (
            <>
              {" "}
              <span className="text-foreground/90">
                {SITE_NAME.split(" ").slice(1).join(" ")}
              </span>
            </>
          )}
        </span>
        <span className="hidden text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
          Discover local
        </span>
      </div>
    </Link>
  );
}
