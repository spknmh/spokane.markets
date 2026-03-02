"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Session } from "next-auth";
import {
  submissionSchema,
  submissionSchemaAuthed,
  type SubmissionInput,
  type SubmissionInputAuthed,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface SubmissionFormProps {
  session: Session | null;
}

export function SubmissionForm({ session }: SubmissionFormProps) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthed = !!session?.user;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionInput | SubmissionInputAuthed>({
    resolver: zodResolver(isAuthed ? submissionSchemaAuthed : submissionSchema),
    defaultValues: {
      ...(isAuthed ? {} : { submitterName: "", submitterEmail: "" }),
      eventTitle: "",
      eventDescription: "",
      eventDate: "",
      eventTime: "",
      venueName: "",
      venueAddress: "",
      facebookUrl: "",
      websiteUrl: "",
      notes: "",
      company: "",
    },
  });

  async function onSubmit(data: SubmissionInput | SubmissionInputAuthed) {
    setSuccess(false);
    setError(null);
    const payload = isAuthed ? data : (data as SubmissionInput);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Submission failed. Please try again.";
      setError(msg);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thank you!</CardTitle>
          <CardDescription>
            Your event submission has been received. We&apos;ll review it and add
            it to the calendar if it fits our criteria. You&apos;ll hear back
            within a few business days.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event details</CardTitle>
        <CardDescription>
          Fill in the information about the event you&apos;d like to submit.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Honeypot */}
          <div className="absolute -left-[9999px] opacity-0" aria-hidden>
            <Label htmlFor="company">Company</Label>
            <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
          </div>
          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          {!isAuthed && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="submitterName">Your name</Label>
                <Input
                  id="submitterName"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  {...register("submitterName" as keyof SubmissionInput)}
                />
                {"submitterName" in errors && errors.submitterName && (
                  <p className="text-sm text-destructive">
                    {errors.submitterName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="submitterEmail">Your email</Label>
                <Input
                  id="submitterEmail"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("submitterEmail" as keyof SubmissionInput)}
                />
                {"submitterEmail" in errors && errors.submitterEmail && (
                  <p className="text-sm text-destructive">
                    {errors.submitterEmail.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="eventTitle">Event title</Label>
            <Input
              id="eventTitle"
              type="text"
              placeholder="South Hill Farmers Market"
              {...register("eventTitle")}
            />
            {errors.eventTitle && (
              <p className="text-sm text-destructive">
                {errors.eventTitle.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventDescription">Event description</Label>
            <Textarea
              id="eventDescription"
              placeholder="Brief description of the event..."
              rows={3}
              {...register("eventDescription")}
            />
            {errors.eventDescription && (
              <p className="text-sm text-destructive">
                {errors.eventDescription.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eventDate">Event date</Label>
              <Input
                id="eventDate"
                type="date"
                {...register("eventDate")}
              />
              {errors.eventDate && (
                <p className="text-sm text-destructive">
                  {errors.eventDate.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventTime">Event time</Label>
              <Input
                id="eventTime"
                type="time"
                {...register("eventTime")}
              />
              {errors.eventTime && (
                <p className="text-sm text-destructive">
                  {errors.eventTime.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueName">Venue name</Label>
            <Input
              id="venueName"
              type="text"
              placeholder="Perry Street Market"
              {...register("venueName")}
            />
            {errors.venueName && (
              <p className="text-sm text-destructive">
                {errors.venueName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueAddress">Venue address</Label>
            <Input
              id="venueAddress"
              type="text"
              placeholder="123 Main St, Spokane, WA"
              {...register("venueAddress")}
            />
            {errors.venueAddress && (
              <p className="text-sm text-destructive">
                {errors.venueAddress.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook URL (optional)</Label>
              <Input
                id="facebookUrl"
                type="url"
                placeholder="https://facebook.com/..."
                {...register("facebookUrl")}
              />
              {errors.facebookUrl && (
                <p className="text-sm text-destructive">
                  {errors.facebookUrl.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL (optional)</Label>
              <Input
                id="websiteUrl"
                type="url"
                placeholder="https://..."
                {...register("websiteUrl")}
              />
              {errors.websiteUrl && (
                <p className="text-sm text-destructive">
                  {errors.websiteUrl.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any other details we should know..."
              rows={2}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <Button type="submit" variant="accent" className="w-full font-semibold" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit event"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
