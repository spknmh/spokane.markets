"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

interface PendingVerificationModalProps {
  emailVerified: Date | null;
  showPendingVerification: boolean;
}

export function PendingVerificationModal({
  emailVerified,
  showPendingVerification,
}: PendingVerificationModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (showPendingVerification && !emailVerified) {
      setOpen(true);
    }
  }, [showPendingVerification, emailVerified]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Verify your email
          </DialogTitle>
          <DialogDescription>
            We&apos;ve sent a verification link to your email address. Please
            check your inbox and click the link to verify your account. The link
            expires in 24 hours.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
