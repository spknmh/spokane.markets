"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AccountSettingsClientProps {
  emailsPaused: boolean;
  hasPassword: boolean;
  section: "password" | "pause" | "delete";
}

export function AccountSettingsClient({
  emailsPaused,
  hasPassword,
  section,
}: AccountSettingsClientProps) {
  const router = useRouter();
  const [passwordSection, setPasswordSection] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [passwordSaving, setPasswordSaving] = React.useState(false);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [pauseSaving, setPauseSaving] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deletePassword, setDeletePassword] = React.useState("");
  const [deleteSaving, setDeleteSaving] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    setPasswordError(null);
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to change password");
      }
      setPasswordSection(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handlePauseResume() {
    setPauseSaving(true);
    try {
      const res = await fetch(
        emailsPaused ? "/api/account/resume-emails" : "/api/account/pause-emails",
        { method: "POST" }
      );
      if (res.ok) router.refresh();
    } finally {
      setPauseSaving(false);
    }
  }

  async function handleDelete() {
    if (deleteConfirmation !== "DELETE") {
      setDeleteError('Type DELETE to confirm');
      return;
    }
    if (hasPassword && !deletePassword) {
      setDeleteError("Enter your password to confirm");
      return;
    }
    setDeleteError(null);
    setDeleteSaving(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          password: hasPassword ? deletePassword : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete account");
      }
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleteSaving(false);
    }
  }

  return (
    <>
      {section === "password" && hasPassword && (
        <div className="space-y-4">
          {!passwordSection ? (
            <Button variant="outline" onClick={() => setPasswordSection(true)}>
              Change password
            </Button>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <div className="flex gap-2">
                <Button type="submit" disabled={passwordSaving}>
                  {passwordSaving ? "Saving…" : "Save password"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPasswordSection(false);
                    setPasswordError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {section === "pause" && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {emailsPaused ? "Emails are paused" : "Emails are active"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePauseResume}
              disabled={pauseSaving}
            >
              {pauseSaving ? "Updating…" : emailsPaused ? "Resume emails" : "Pause emails"}
            </Button>
          </div>
        </div>
      )}

      {section === "delete" && (
        <div className="space-y-4">
          <Button
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            Delete account
          </Button>
        </div>
      )}

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                Type DELETE to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="font-mono"
              />
            </div>
            {hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="delete-password">Enter your password</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Your password"
                />
              </div>
            )}
            {deleteError && (
              <p className="text-sm text-destructive">{deleteError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={
                deleteSaving ||
                deleteConfirmation !== "DELETE" ||
                (hasPassword && !deletePassword)
              }
            >
              {deleteSaving ? "Deleting…" : "Delete account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
