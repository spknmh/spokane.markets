"use client";

import { Globe, Facebook, Instagram } from "lucide-react";

interface VendorSocialLinksProps {
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  /** Icon-only links (e.g. on cards); use stopPropagation when inside a parent Link */
  iconOnly?: boolean;
  /** Stop click propagation (e.g. when inside a card Link) */
  stopPropagation?: boolean;
  className?: string;
}

export function VendorSocialLinks({
  websiteUrl,
  facebookUrl,
  instagramUrl,
  iconOnly = false,
  stopPropagation = false,
  className = "",
}: VendorSocialLinksProps) {
  const hasLinks = websiteUrl || facebookUrl || instagramUrl;
  if (!hasLinks) return null;

  const linkClass = iconOnly
    ? "inline-flex items-center justify-center rounded-full p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
    : "inline-flex items-center gap-1.5 text-sm text-primary hover:underline";

  const iconSize = iconOnly ? "h-4 w-4" : "h-4 w-4";

  const handleClick = (e: React.MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {websiteUrl && (
        <a
          href={websiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          onClick={handleClick}
          aria-label="Website"
        >
          <Globe className={iconSize} />
          {!iconOnly && "Website"}
        </a>
      )}
      {facebookUrl && (
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          onClick={handleClick}
          aria-label="Facebook"
        >
          <Facebook className={iconSize} />
          {!iconOnly && "Facebook"}
        </a>
      )}
      {instagramUrl && (
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          onClick={handleClick}
          aria-label="Instagram"
        >
          <Instagram className={iconSize} />
          {!iconOnly && "Instagram"}
        </a>
      )}
    </div>
  );
}
