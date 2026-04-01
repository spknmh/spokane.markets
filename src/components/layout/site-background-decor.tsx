"use client";

import { usePathname } from "next/navigation";

/**
 * Subtle geometric blobs (flyer-style) fixed behind page content for depth.
 * Uses `primary` / `accent` theme tokens — no `dark:` utilities needed: when
 * `html` has `.dark` or `body` has `data-theme`, `--color-*` updates and these
 * shapes pick up the same palette as the rest of the UI.
 * Skipped on admin, maintenance, and when the user prefers reduced motion.
 */
export function SiteBackgroundDecor() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname === "/maintenance") {
    return null;
  }

  return (
    <div
      className="site-deco-layer pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      {/* Primary (cedar / theme green) — varied radii & rotations */}
      <div className="absolute -left-9 top-24 h-36 w-36 rounded-full bg-primary/[0.055] sm:top-32" />
      <div className="absolute right-[2%] top-[5%] h-32 w-32 rotate-[18deg] rounded-br-[4rem] bg-primary/[0.05] md:h-36 md:w-36" />
      <div className="absolute bottom-[12%] left-[4%] h-24 w-24 -rotate-12 rounded-tl-[3rem] bg-primary/[0.05] sm:h-28 sm:w-28" />
      <div className="absolute -right-8 top-[28%] h-44 w-44 rounded-full bg-primary/[0.035] md:top-[32%]" />
      <div className="absolute bottom-[22%] right-[3%] h-48 w-48 rounded-full bg-primary/[0.03] lg:h-52 lg:w-52" />
      <div className="absolute left-[12%] top-[48%] h-28 w-28 rotate-[22deg] rounded-br-[2.5rem] bg-primary/[0.045] max-md:hidden" />
      <div className="absolute bottom-40 right-[18%] h-20 w-20 rotate-[-35deg] rounded-tl-[2.5rem] bg-primary/[0.05] max-lg:hidden" />
      <div className="absolute left-1/2 top-[65%] h-24 w-24 -translate-x-1/2 rotate-[8deg] rounded-br-[3rem] bg-primary/[0.04] md:top-[70%]" />

      {/* Accent (warmer / honey-adjacent) — smaller secondary layer */}
      <div className="absolute right-[20%] top-[18%] h-20 w-20 rotate-[-12deg] rounded-tl-[2.5rem] bg-accent/[0.06] sm:h-24 sm:w-24" />
      <div className="absolute bottom-[35%] left-[8%] h-28 w-28 rotate-[55deg] rounded-br-[3.5rem] bg-accent/[0.05] max-sm:hidden" />
      <div className="absolute left-[35%] top-[12%] h-16 w-16 rounded-full bg-accent/[0.045] md:left-[40%]" />
      <div className="absolute bottom-[8%] right-[28%] h-24 w-24 -rotate-6 rounded-tl-[3rem] bg-accent/[0.055]" />
      <div className="absolute right-[8%] top-[55%] h-[4.5rem] w-[4.5rem] rotate-[28deg] rounded-br-[2rem] bg-accent/[0.05] lg:top-[52%]" />
      <div className="absolute bottom-[48%] left-[22%] h-14 w-14 rounded-full bg-accent/[0.04] max-md:hidden" />
    </div>
  );
}
