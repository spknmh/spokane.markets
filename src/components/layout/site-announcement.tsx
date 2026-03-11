import Link from "next/link";
import type { SiteAnnouncement } from "@/lib/site-announcement";

interface SiteAnnouncementBarProps {
  announcement: SiteAnnouncement;
}

export function SiteAnnouncementBar({
  announcement,
}: SiteAnnouncementBarProps) {
  if (!announcement.enabled || !announcement.text) {
    return null;
  }

  const cta =
    announcement.linkLabel && announcement.linkUrl ? (
      announcement.linkUrl.startsWith("/") ? (
        <Link
          href={announcement.linkUrl}
          className="text-sm font-semibold text-primary transition-colors hover:underline"
        >
          {announcement.linkLabel}
        </Link>
      ) : (
        <a
          href={announcement.linkUrl}
          className="text-sm font-semibold text-primary transition-colors hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {announcement.linkLabel}
        </a>
      )
    ) : null;

  return (
    <section className="border-b border-border bg-primary/5">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-center sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-sm text-foreground">{announcement.text}</p>
        {cta}
      </div>
    </section>
  );
}
