"use client";

import Link from "next/link";
import { isValidCallbackUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AuthRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  callbackUrl?: string;
}

export function AuthRequiredModal({
  open,
  onOpenChange,
  title = "Sign in required",
  description = "Please sign in or create an account to continue.",
  callbackUrl = "/",
}: AuthRequiredModalProps) {
  const safeCallbackUrl = isValidCallbackUrl(callbackUrl) ? callbackUrl : "/";
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;
  const signUpHref = `/auth/signup?callbackUrl=${encodeURIComponent(safeCallbackUrl)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg sm:w-full">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button asChild className="min-h-[44px] w-full sm:w-auto">
            <Link href={signInHref}>Sign In</Link>
          </Button>
          <Button variant="outline" asChild className="min-h-[44px] w-full sm:w-auto">
            <Link href={signUpHref}>Create Account</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
