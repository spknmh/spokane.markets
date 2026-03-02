"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
}

export function WriteReviewButton({
  eventId,
  marketId,
  isLoggedIn,
}: WriteReviewButtonProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/auth/signin");
      return;
    }
    setOpen(true);
  }

  return (
    <>
      <Button size="sm" onClick={handleClick}>
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
