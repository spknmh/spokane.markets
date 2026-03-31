"use client";

import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface UserResetPasswordButtonProps {
  userId: string;
  userName: string | null;
  userEmail: string;
}

export function UserResetPasswordButton({
  userId,
  userName,
  userEmail,
}: UserResetPasswordButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = userName || userEmail;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendPasswordReset: true }),
      });
      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const body = await res.json();
        setError(body.error?.message || "Failed to send password reset email");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Reset password for ${displayName}`}
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <KeyRound className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Send password reset email</DialogTitle>
              <DialogDescription>
                Send {displayName} an email with a secure link to choose a new password.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6 space-y-4 text-sm text-muted-foreground">
              <p>
                An email will be sent to <span className="font-medium text-foreground">{userEmail}</span>.
              </p>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Sending…" : "Send email"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
