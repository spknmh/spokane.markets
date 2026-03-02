"use client";

import Link from "next/link";
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
  const signInHref = `/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
  const signUpHref = `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild>
            <Link href={signInHref}>Sign In</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={signUpHref}>Create Account</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
