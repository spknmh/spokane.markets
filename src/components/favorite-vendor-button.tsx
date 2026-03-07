"use client";

import { useState } from "react";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Lock } from "lucide-react";
import { AuthRequiredModal } from "@/components/auth-required-modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

interface FavoriteVendorButtonProps {
  slug: string;
  initialFavorited: boolean;
  initialEmailAlerts?: boolean;
  iconOnly?: boolean;
  /** Stop click propagation (e.g. when inside a card Link) */
  stopPropagation?: boolean;
  className?: string;
  callbackUrl?: string;
  /** When false, shows "Sign in to favorite" and opens auth modal on click */
  isLoggedIn?: boolean;
}

export function FavoriteVendorButton({
  slug,
  initialFavorited,
  initialEmailAlerts = true,
  iconOnly = false,
  stopPropagation = false,
  className,
  callbackUrl = "/vendors",
  isLoggedIn = true,
}: FavoriteVendorButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    const previouslyFavorited = optimistic.favorited;
    startTransition(async () => {
      setOptimistic("toggle");
      const res = await fetch(`/api/vendors/${slug}/favorite`, {
        method: "POST",
      });
      if (res.status === 401) {
        setAuthModalOpen(true);
        return;
      }
      if (res.ok) {
        trackEvent(previouslyFavorited ? "vendor_unfavorite" : "vendor_favorite", {
          vendor_id: slug,
        });
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
    <>
      <div className={cn("flex flex-wrap items-center gap-3", className)}>
        <Button
          variant="ghost"
          size={iconOnly ? "icon" : "sm"}
          disabled={isPending}
          onClick={handleToggle}
          className="min-h-[44px] min-w-[44px]"
          title={!isLoggedIn ? "Sign in to favorite" : undefined}
          aria-label={
            optimistic.favorited ? "Remove from favorites" : "Add to favorites"
          }
        >
          {!isLoggedIn && <Lock className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />}
          <Heart
            className={cn(
              "h-4 w-4",
              optimistic.favorited && "fill-red-500 text-red-500"
            )}
          />
          {!iconOnly && (
            <span className="ml-1.5">
              {isLoggedIn
                ? optimistic.favorited
                  ? "Favorited"
                  : "Favorite"
                : "Sign in to favorite"}
            </span>
          )}
        </Button>
        {!iconOnly && optimistic.favorited && isLoggedIn && (
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
      <AuthRequiredModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        title="Sign in to favorite"
        description="Create an account or sign in to favorite vendors and get updates."
        callbackUrl={callbackUrl}
      />
    </>
  );
}
