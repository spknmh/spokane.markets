"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { EventInput } from "@/lib/validations";
import type { UseFormWatch } from "react-hook-form";

export type AdminEventReviewContext = {
  eventId: string;
  eventSlug: string;
  moderationNotesApiEnabled: boolean;
  venue: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  } | null;
  submittedBy: { name: string | null; email: string } | null;
  organizerDisplayName: string | null;
  photos: { id: string; url: string; alt: string | null }[];
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewContext: AdminEventReviewContext;
  tags: { id: string; name: string }[];
  features: { id: string; name: string }[];
  watch: UseFormWatch<EventInput>;
  editableFields: React.ReactNode;
  submitting: boolean;
  onApprove: () => void | Promise<void>;
  onReject: (reason: string) => void | Promise<void>;
  onSaveEditsOnly: () => void | Promise<void>;
  onCancel: () => void;
};

function tagNames(ids: string[] | undefined, tags: { id: string; name: string }[]): string {
  if (!ids?.length) return "—";
  const set = new Set(ids);
  return tags.filter((t) => set.has(t.id)).map((t) => t.name).join(", ") || "—";
}

export function EventSubmissionReviewPanel({
  open,
  onOpenChange,
  reviewContext,
  tags,
  features,
  watch,
  editableFields,
  submitting,
  onApprove,
  onReject,
  onSaveEditsOnly,
  onCancel,
}: Props) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const tagIds = watch("tagIds") ?? [];
  const featureIds = watch("featureIds") ?? [];
  const imageUrl = watch("imageUrl") ?? "";

  const handleClose = (next: boolean) => {
    if (!next) {
      setRejectMode(false);
      setRejectReason("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        showClose
        className={cn(
          "flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden bg-muted/35 p-0",
          "sm:max-w-2xl"
        )}
      >
        <DialogHeader className="border-b border-border bg-muted/50 px-6 py-4 text-left">
          <DialogTitle className="text-xl">Reviewing public submission</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Verify details below. Editable fields support light corrections before you approve or reject.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
          <section className="space-y-2 rounded-lg border border-border bg-background/80 p-4 text-sm">
            <h3 className="font-medium text-foreground">Location</h3>
            {reviewContext.venue ? (
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{reviewContext.venue.name}</span>
                <br />
                {reviewContext.venue.address}
                <br />
                {reviewContext.venue.city}, {reviewContext.venue.state} {reviewContext.venue.zip}
              </p>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </section>

          <section className="space-y-2 rounded-lg border border-border bg-background/80 p-4 text-sm">
            <h3 className="font-medium text-foreground">Organizer</h3>
            <p className="text-muted-foreground">
              {reviewContext.organizerDisplayName ? (
                <span className="font-medium text-foreground">{reviewContext.organizerDisplayName}</span>
              ) : null}
              {reviewContext.submittedBy ? (
                <>
                  {reviewContext.organizerDisplayName ? <br /> : null}
                  {reviewContext.submittedBy.name ?? "—"}
                  <br />
                  <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${reviewContext.submittedBy.email}`}>
                    {reviewContext.submittedBy.email}
                  </a>
                </>
              ) : (
                !reviewContext.organizerDisplayName && "—"
              )}
            </p>
          </section>

          <section className="space-y-2 rounded-lg border border-border bg-background/80 p-4 text-sm">
            <h3 className="font-medium text-foreground">Categories</h3>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Tags: </span>
              {tagNames(tagIds, tags)}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Features: </span>
              {tagNames(featureIds, features)}
            </p>
          </section>

          <section className="space-y-3 rounded-lg border border-border bg-background/80 p-4">
            <h3 className="font-medium text-foreground">Images</h3>
            {imageUrl ? (
              <div className="relative aspect-[2/1] w-full max-w-md overflow-hidden rounded-md border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview; arbitrary URLs */}
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hero image</p>
            )}
            {reviewContext.photos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {reviewContext.photos.map((p) => (
                  <div key={p.id} className="h-20 w-28 overflow-hidden rounded border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element -- admin preview */}
                    <img src={p.url} alt={p.alt ?? ""} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <div className="space-y-4 border-t border-border pt-4">
            <p className="text-sm font-medium text-foreground">Edit listing</p>
            {editableFields}
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 border-t border-border bg-background px-6 py-4 sm:flex-col">
          {rejectMode ? (
            <div className="w-full space-y-2">
              <Label htmlFor="reject-reason">Rejection reason (required)</Label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                placeholder="Explain briefly why this submission cannot be published."
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRejectMode(false);
                    setRejectReason("");
                  }}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={submitting || !rejectReason.trim()}
                  onClick={() => void onReject(rejectReason.trim())}
                >
                  {submitting ? "Rejecting…" : "Confirm rejection"}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                <Button type="button" variant="outline" disabled={submitting} onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="button" variant="secondary" disabled={submitting} onClick={() => void onSaveEditsOnly()}>
                  {submitting ? "Saving…" : "Save edits only"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={submitting}
                  onClick={() => setRejectMode(true)}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  disabled={submitting}
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => void onApprove()}
                >
                  {submitting ? "Publishing…" : "Approve"}
                </Button>
              </div>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
