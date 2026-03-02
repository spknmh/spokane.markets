"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteVendorButtonProps {
  slug: string;
  initialFavorited: boolean;
  initialEmailAlerts?: boolean;
  iconOnly?: boolean;
  /** Stop click propagation (e.g. when inside a card Link) */
  stopPropagation?: boolean;
  className?: string;
}

export function FavoriteVendorButton({
  slug,
  initialFavorited,
  initialEmailAlerts = true,
  iconOnly = false,
  stopPropagation = false,
  className,
}: FavoriteVendorButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { favorited: initialFavorited, emailAlerts: initialEmailAlerts },
    (current, action: "toggle" | { emailAlerts: boolean }) => {
      if (action === "toggle") {
        return { ...current, favorited: !current.favorited };
      }
      return { ...current, emailAlerts: action.emailAlerts };
    }
  );

  async function handleToggle(e: React.MouseEvent) {
    if (stopPropagation) e.stopPropagation();
    startTransition(async () => {
      setOptimistic("toggle");
      const res = await fetch(`/api/vendors/${slug}/favorite`, {
        method: "POST",
      });
      if (res.status === 401) {
        router.push("/auth/signin");
        return;
      }
      router.refresh();
    });
  }

  function handleAlertsToggle(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    startTransition(async () => {
      setOptimistic({ emailAlerts: checked });
      await fetch(`/api/vendors/${slug}/favorite`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailAlerts: checked }),
      });
      router.refresh();
    });
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <Button
        variant="ghost"
        size={iconOnly ? "icon" : "sm"}
        disabled={isPending}
        onClick={handleToggle}
        aria-label={
          optimistic.favorited ? "Remove from favorites" : "Add to favorites"
        }
      >
        <Heart
          className={cn(
            "h-4 w-4",
            optimistic.favorited && "fill-red-500 text-red-500"
          )}
        />
        {!iconOnly && (
          <span className="ml-1.5">
            {optimistic.favorited ? "Favorited" : "Favorite"}
          </span>
        )}
      </Button>
      {!iconOnly && optimistic.favorited && (
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={optimistic.emailAlerts}
            onChange={handleAlertsToggle}
            disabled={isPending}
            className="rounded border-border"
          />
          Email alerts for new events
        </label>
      )}
    </div>
  );
}
