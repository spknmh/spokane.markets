"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthRequiredModal } from "@/components/auth-required-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ReviewForm } from "@/components/review-form";

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
  callbackUrl,
}: WriteReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      setAuthModalOpen(true);
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Button
        size="sm"
        onClick={handleClick}
        className="min-h-[44px] min-w-[44px]"
        title={!isLoggedIn ? "Sign in to write a review" : undefined}
      >
        {!isLoggedIn && <Lock className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />}
        Write a Review
      </Button>
      <AuthRequiredModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        title="Sign in to write a review"
        description="Create an account or sign in to share your experience."
        callbackUrl={callbackUrl}
      />
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
