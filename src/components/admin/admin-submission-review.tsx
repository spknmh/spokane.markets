"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StatusButton } from "@/components/admin/action-buttons";
import { updateSubmissionStatus } from "@/app/admin/actions";
import { formatSubmissionScheduleSummary } from "@/lib/submission-display";
import { formatDate } from "@/lib/utils";
import type { ModerationStatus } from "@prisma/client";

export type AdminSubmissionReviewPayload = {
  id: string;
  eventTitle: string;
  eventDescription: string | null;
  submitterName: string;
  submitterEmail: string;
  scheduleDays: unknown;
  eventDate: string;
  eventTime: string;
  endDate: string | null;
  endTime: string | null;
  allDay: boolean;
  venueName: string;
  venueAddress: string;
  venueCity: string | null;
  venueState: string | null;
  venueZip: string | null;
  marketId: string | null;
  marketName: string | null;
  imageUrl: string | null;
  tagIds: string[];
  featureIds: string[];
  tagNames: string[];
  featureNames: string[];
  notes: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  websiteUrl: string | null;
  status: ModerationStatus;
  createdAt: string;
};

export function AdminSubmissionReview({ submission }: { submission: AdminSubmissionReviewPayload }) {
  const router = useRouter();
  const pending = submission.status === "PENDING";

  const afterDecision = () => {
    router.push("/admin/submissions?status=PENDING");
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/submissions?status=PENDING">← Back to submissions</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/queues?type=submission">Queues</Link>
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-6 shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">Reviewing public submission</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">{submission.eventTitle}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Submitted {formatDate(new Date(submission.createdAt))} · {submission.submitterName} (
          <a className="text-primary underline-offset-4 hover:underline" href={`mailto:${submission.submitterEmail}`}>
            {submission.submitterEmail}
          </a>
          )
        </p>
      </div>

      <div className="grid gap-6 rounded-lg border border-border bg-background p-6">
        <section>
          <h2 className="text-sm font-semibold text-foreground">Schedule</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatSubmissionScheduleSummary(submission)}
          </p>
        </section>

        {submission.eventDescription ? (
          <section>
            <h2 className="text-sm font-semibold text-foreground">Description</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{submission.eventDescription}</p>
          </section>
        ) : null}

        <section>
          <h2 className="text-sm font-semibold text-foreground">Location</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {submission.venueName}
            <br />
            {submission.venueAddress}
            <br />
            {[submission.venueCity, submission.venueState, submission.venueZip].filter(Boolean).join(", ")}
          </p>
        </section>

        {submission.marketName ? (
          <section>
            <h2 className="text-sm font-semibold text-foreground">Market</h2>
            <p className="mt-1 text-sm text-muted-foreground">{submission.marketName}</p>
          </section>
        ) : null}

        {submission.tagNames.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold text-foreground">Tags</h2>
            <p className="mt-1 text-sm text-muted-foreground">{submission.tagNames.join(", ")}</p>
          </section>
        ) : null}

        {submission.featureNames.length > 0 ? (
          <section>
            <h2 className="text-sm font-semibold text-foreground">Features</h2>
            <p className="mt-1 text-sm text-muted-foreground">{submission.featureNames.join(", ")}</p>
          </section>
        ) : null}

        {(submission.facebookUrl || submission.instagramUrl || submission.websiteUrl) && (
          <section>
            <h2 className="text-sm font-semibold text-foreground">Links</h2>
            <ul className="mt-1 list-inside list-disc text-sm text-primary">
              {submission.facebookUrl ? (
                <li>
                  <a href={submission.facebookUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    Facebook
                  </a>
                </li>
              ) : null}
              {submission.instagramUrl ? (
                <li>
                  <a href={submission.instagramUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    Instagram
                  </a>
                </li>
              ) : null}
              {submission.websiteUrl ? (
                <li>
                  <a href={submission.websiteUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    Website
                  </a>
                </li>
              ) : null}
            </ul>
          </section>
        )}

        {submission.imageUrl ? (
          <section>
            <h2 className="text-sm font-semibold text-foreground">Image</h2>
            <p className="mt-1">
              <a href={submission.imageUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
                Open image
              </a>
            </p>
          </section>
        ) : null}

        {submission.notes ? (
          <section>
            <h2 className="text-sm font-semibold text-foreground">Submitter notes</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{submission.notes}</p>
          </section>
        ) : null}

        {pending ? (
          <div className="flex flex-wrap gap-2 border-t border-border pt-6">
            <StatusButton
              action={updateSubmissionStatus.bind(null, submission.id, "APPROVED")}
              label="Approve"
              analyticsEventName="admin_submission_approved"
              analyticsParams={{ submission_id: submission.id, surface: "submission_review" }}
              onSuccess={afterDecision}
            />
            <StatusButton
              action={updateSubmissionStatus.bind(null, submission.id, "REJECTED")}
              label="Reject"
              variant="destructive"
              analyticsEventName="admin_submission_rejected"
              analyticsParams={{ submission_id: submission.id, surface: "submission_review" }}
              onSuccess={afterDecision}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This submission is <strong>{submission.status}</strong>. Approval and rejection are only available while
            status is pending.
          </p>
        )}
      </div>
    </div>
  );
}
