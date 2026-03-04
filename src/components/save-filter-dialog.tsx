"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthRequiredModal } from "@/components/auth-required-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SaveFilterDialogProps {
  session: Session | null;
  currentFilters: {
    dateRange?: string;
    neighborhood?: string;
    category?: string;
    feature?: string;
  };
}

export function SaveFilterDialog({ session, currentFilters }: SaveFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilters =
    currentFilters.dateRange ||
    currentFilters.neighborhood ||
    currentFilters.category ||
    currentFilters.feature;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          dateRange: currentFilters.dateRange || undefined,
          neighborhoods: currentFilters.neighborhood
            ? [currentFilters.neighborhood]
            : [],
          categories: currentFilters.category
            ? [currentFilters.category]
            : [],
          features: currentFilters.feature ? [currentFilters.feature] : [],
          emailAlerts,
        }),
      });

      if (res.status === 401) {
        setOpen(false);
        setAuthModalOpen(true);
        return;
      }

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error?.message || "Failed to save filter");
      }

      setSuccess(true);
      setName("");
      setEmailAlerts(false);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpen = () => {
    if (!session) {
      setAuthModalOpen(true);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        disabled={session ? !hasActiveFilters : false}
        className="min-h-[44px] min-w-[44px]"
        title={!session ? "Sign in to save filters and get email alerts" : undefined}
      >
        {!session ? (
          <>
            <Lock className="mr-1.5 h-4 w-4 shrink-0" aria-hidden />
            Sign in to save
          </>
        ) : (
          "Save This Filter"
        )}
      </Button>
      <AuthRequiredModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        title="Sign in to save filters"
        description="Create an account or sign in to save filters and get email alerts."
        callbackUrl="/events"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save your current filter settings for quick access later.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6 pt-0">
            {success ? (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
                Filter saved successfully!
              </div>
            ) : (
              <>
                {error && (
                  <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="filter-name">Filter Name</Label>
                  <Input
                    id="filter-name"
                    placeholder="e.g. Weekend Downtown Markets"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-medium">Current filters:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {currentFilters.dateRange && (
                      <li>Date: {currentFilters.dateRange}</li>
                    )}
                    {currentFilters.neighborhood && (
                      <li>Neighborhood: {currentFilters.neighborhood}</li>
                    )}
                    {currentFilters.category && (
                      <li>Category: {currentFilters.category}</li>
                    )}
                    {currentFilters.feature && (
                      <li>Feature: {currentFilters.feature}</li>
                    )}
                  </ul>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="rounded border-border"
                  />
                  Email me when new events match this filter
                </label>
              </>
            )}
          </div>

          {!success && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={submitting || !name.trim()}
              >
                {submitting ? "Saving..." : "Save Filter"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
