"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trackEvent } from "@/lib/analytics";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Session } from "next-auth";
import {
  submissionSchema,
  submissionSchemaAuthed,
  type SubmissionInput,
  type SubmissionInputAuthed,
} from "@/lib/validations";
import type { Resolver } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface SubmissionFormProps {
  session: Session | null;
  markets?: { id: string; name: string }[];
  tags?: { id: string; name: string; slug: string }[];
  features?: { id: string; name: string; slug: string }[];
}

export function SubmissionForm({
  session,
  markets = [],
  tags = [],
  features = [],
}: SubmissionFormProps) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthed = !!session?.user;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SubmissionInput | SubmissionInputAuthed>({
    resolver: zodResolver(
      isAuthed ? submissionSchemaAuthed : submissionSchema
    ) as Resolver<SubmissionInput | SubmissionInputAuthed>,
    defaultValues: {
      ...(isAuthed ? {} : { submitterName: "", submitterEmail: "" }),
      eventTitle: "",
      eventDescription: "",
      eventDate: "",
      eventTime: "",
      endDate: "",
      endTime: "",
      allDay: false,
      timezone: "",
      imageUrl: "",
      venueName: "",
      venueAddress: "",
      venueCity: "",
      venueState: "",
      venueZip: "",
      marketId: "",
      tagIds: [],
      featureIds: [],
      facebookUrl: "",
      websiteUrl: "",
      notes: "",
      company: "",
    },
  });

  const watchAllDay = watch("allDay");
  const watchTagIds = (watch("tagIds") ?? []) as string[];
  const watchFeatureIds = (watch("featureIds") ?? []) as string[];

  const toggleArrayItem = (
    field: "tagIds" | "featureIds",
    current: string[],
    id: string
  ) => {
    setValue(
      field,
      current.includes(id)
        ? current.filter((v) => v !== id)
        : [...current, id]
    );
  };

  async function onSubmit(data: SubmissionInput | SubmissionInputAuthed) {
    setSuccess(false);
    setError(null);
    trackEvent("submit_event_start");
    const payload = isAuthed ? data : (data as SubmissionInput);
    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      trackEvent("api_error", { endpoint: "/api/submissions", status: res.status });
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Submission failed. Please try again.";
      setError(msg);
      return;
    }

    trackEvent("submit_event_success");
    setSuccess(true);
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thank you!</CardTitle>
          <CardDescription>
            Your market date submission has been received. We&apos;ll review it and add
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
        <CardTitle>Market date details</CardTitle>
        <CardDescription>
          Fill in the information about the market date you&apos;d like to submit.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit(onSubmit, () =>
          trackEvent("form_error", { form_id: "submission", reason: "validation" })
        )}
      >
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
            <Label htmlFor="eventTitle">Market date title</Label>
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
            <Label htmlFor="eventDescription">Market date description</Label>
            <Textarea
              id="eventDescription"
              placeholder="Brief description of the market date..."
              rows={3}
              {...register("eventDescription")}
            />
            {errors.eventDescription && (
              <p className="text-sm text-destructive">
                {errors.eventDescription.message}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <Label>Schedule</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eventDate">Start date</Label>
                <Input id="eventDate" type="date" {...register("eventDate")} />
                {errors.eventDate && (
                  <p className="text-sm text-destructive">
                    {errors.eventDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date (optional)</Label>
                <Input id="endDate" type="date" {...register("endDate")} />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("allDay")} />
              <span className="text-sm">All day</span>
            </label>
            {!watchAllDay && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eventTime">Start time</Label>
                  <Input id="eventTime" type="time" {...register("eventTime")} />
                  {errors.eventTime && (
                    <p className="text-sm text-destructive">
                      {errors.eventTime.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End time (optional)</Label>
                  <Input id="endTime" type="time" {...register("endTime")} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://..."
              {...register("imageUrl")}
            />
            {errors.imageUrl && (
              <p className="text-sm text-destructive">
                {errors.imageUrl.message}
              </p>
            )}
          </div>

          {markets.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="marketId">Market (optional)</Label>
              <Select id="marketId" {...register("marketId")}>
                <option value="">None</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

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
              placeholder="123 Main St"
              {...register("venueAddress")}
            />
            {errors.venueAddress && (
              <p className="text-sm text-destructive">
                {errors.venueAddress.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="venueCity">City (optional)</Label>
              <Input
                id="venueCity"
                type="text"
                placeholder="Spokane"
                {...register("venueCity")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueState">State (optional)</Label>
              <Input
                id="venueState"
                type="text"
                placeholder="WA"
                {...register("venueState")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueZip">ZIP (optional)</Label>
              <Input
                id="venueZip"
                type="text"
                placeholder="99201"
                {...register("venueZip")}
              />
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Market date type (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary"
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={watchTagIds.includes(tag.id)}
                      onChange={() =>
                        toggleArrayItem("tagIds", watchTagIds, tag.id)
                      }
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {features.length > 0 && (
            <div className="space-y-2">
              <Label>Features / amenities (optional)</Label>
              <div className="flex flex-wrap gap-2">
                {features.map((feature) => (
                  <label
                    key={feature.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm cursor-pointer has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:checked]:border-primary"
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={watchFeatureIds.includes(feature.id)}
                      onChange={() =>
                        toggleArrayItem("featureIds", watchFeatureIds, feature.id)
                      }
                    />
                    {feature.name}
                  </label>
                ))}
              </div>
            </div>
          )}

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
            {isSubmitting ? "Submitting…" : "Submit market date"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
