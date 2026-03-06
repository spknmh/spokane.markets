"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthGate } from "@/components/auth-gate";
import { trackEvent } from "@/lib/analytics";
import type { Session } from "next-auth";

interface ClaimMarketButtonProps {
  marketId: string;
  marketSlug: string;
  session: Session | null;
}

export function ClaimMarketButton({ marketId, marketSlug, session }: ClaimMarketButtonProps) {
  return (
    <AuthGate session={session} callbackUrl={`/markets/${marketSlug}/claim`}>
      <Button asChild className="w-full">
        <Link
          href={`/markets/${marketSlug}/claim`}
          onClick={() => trackEvent("claim_market_click", { market_id: marketId })}
        >
          Claim This Market
        </Link>
      </Button>
    </AuthGate>
  );
}
