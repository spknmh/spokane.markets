import { Badge } from "@/components/ui/badge";
import { BadgeIcon } from "@/components/badge-icon";

type CommunityBadgeChip = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
};

const COMMUNITY_BADGE_STYLES: Record<string, string> = {
  lgbtqia_welcoming:
    "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-900 dark:text-fuchsia-200",
  women_owned:
    "border-rose-400/40 bg-rose-500/10 text-rose-900 dark:text-rose-200",
  veteran_owned:
    "border-emerald-400/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  black_owned_business:
    "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  latine_hispanic_owned:
    "border-orange-400/40 bg-orange-500/10 text-orange-900 dark:text-orange-200",
  aapi_owned:
    "border-sky-400/40 bg-sky-500/10 text-sky-900 dark:text-sky-200",
  indigenous_owned:
    "border-lime-500/40 bg-lime-500/10 text-lime-900 dark:text-lime-200",
  disability_inclusive:
    "border-violet-400/40 bg-violet-500/10 text-violet-900 dark:text-violet-200",
};

function styleForBadge(slug: string): string {
  return (
    COMMUNITY_BADGE_STYLES[slug] ??
    "border-primary/30 bg-primary/10 text-primary"
  );
}

export function CommunityBadgeChips({
  badges,
  limit,
}: {
  badges: CommunityBadgeChip[];
  limit?: number;
}) {
  if (badges.length === 0) return null;
  const shown = typeof limit === "number" ? badges.slice(0, limit) : badges;
  const hiddenCount = badges.length - shown.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {shown.map((badge) => (
        <Badge
          key={badge.id}
          variant="outline"
          className={`gap-1 border font-medium ${styleForBadge(badge.slug)}`}
        >
          <BadgeIcon name={badge.icon} className="h-3.5 w-3.5" />
          <span>{badge.name}</span>
        </Badge>
      ))}
      {hiddenCount > 0 && (
        <Badge variant="outline" className="border-border/70 text-muted-foreground">
          +{hiddenCount} more
        </Badge>
      )}
    </div>
  );
}
