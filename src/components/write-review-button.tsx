"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReviewForm } from "@/components/forms/review-form";
import { isValidCallbackUrl } from "@/lib/utils";

interface WriteReviewButtonProps {
  eventId?: string;
  marketId?: string;
  isLoggedIn: boolean;
  callbackUrl?: string;
}

export function WriteReviewButton({
  eventId,
  marketId,
  isLoggedIn,
  callbackUrl = "/",
}: WriteReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const safeCallbackUrl = isValidCallbackUrl(callbackUrl) ? callbackUrl : "/";
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;

  if (!isLoggedIn) {
    return (
      <Button
        size="sm"
        asChild
        className="min-h-[44px] min-w-[44px]"
        title="Sign in to write a review"
      >
        <Link href={signInHref}>
          <Lock className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
          Write a Review
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="min-h-[44px] min-w-[44px]"
      >
        Write a Review
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience to help others.
            </DialogDescription>
          </DialogHeader>
          <ReviewForm
            eventId={eventId}
            marketId={marketId}
            onSuccess={() => {
              setTimeout(() => {
                setOpen(false);
                router.refresh();
              }, 2000);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
