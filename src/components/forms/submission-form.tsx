"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import {
  trackApiError,
  trackEvent,
  trackFormError,
  trackMilestoneEvent,
} from "@/lib/analytics";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Session } from "@/lib/auth";
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
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { AddressAutofillFields } from "@/components/address-autocomplete";
import { useAbandonTracking } from "@/hooks/use-abandon-tracking";

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

  /** Required field label suffix */
  const req = (label: string) => `${label} *`;

  const isAuthed = !!session?.user;

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting, isDirty },
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
      instagramUrl: "",
      websiteUrl: "",
      notes: "",
      company: "",
    },
  });

  const watchAllDay = useWatch({ control, name: "allDay" });
  const watchEventDate = useWatch({ control, name: "eventDate" }) as string | undefined;
  const watchEndDate = useWatch({ control, name: "endDate" }) as string | undefined;
  const watchTagIds = (useWatch({ control, name: "tagIds" }) ?? []) as string[];
  const watchFeatureIds = (useWatch({ control, name: "featureIds" }) ?? []) as string[];

  useAbandonTracking({
    eventName: "submit_event_abandon",
    isDirty,
    isComplete: success,
    params: { form_id: "submission", surface: "submit_page" },
  });

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
      trackApiError("submissions", res.status, { reason: "server" });
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Submission failed. Please try again.";
      setError(msg);
      return;
    }

    trackMilestoneEvent("submit_event_success");
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
      <form
        onSubmit={handleSubmit(onSubmit, () => {
          trackFormError("submission", "validation");
          trackEvent("submit_event_validation_error", { form_id: "submission" });
        })}
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
                <Label htmlFor="submitterName">{req("Your name")}</Label>
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
                <Label htmlFor="submitterEmail">{req("Your email")}</Label>
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
            <Label htmlFor="eventTitle">{req("Event title")}</Label>
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

          <div className="space-y-4">
            <Label>Schedule</Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="eventDate">{req("Start date")}</Label>
                <DatePickerInput
                  id="eventDate"
                  value={watchEventDate ?? ""}
                  onChange={(value) =>
                    setValue("eventDate", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
                {errors.eventDate && (
                  <p className="text-sm text-destructive">
                    {errors.eventDate.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End date (optional)</Label>
                <DatePickerInput
                  id="endDate"
                  value={watchEndDate ?? ""}
                  onChange={(value) =>
                    setValue("endDate", value, {
                      shouldDirty: true,
                      shouldValidate: true,
                    })
                  }
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register("allDay")} />
              <span className="text-sm">All day event</span>
            </label>
            {!watchAllDay && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="eventTime">{req("Start time")}</Label>
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
            <Label htmlFor="imageUrl">Image Link</Label>
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
            <Label htmlFor="venueName">{req("Venue name")}</Label>
            <Input
              id="venueName"
              type="text"
              placeholder="e.g., Riverside Park Pavilion, Spokane County Fair & Expo Center"
              {...register("venueName")}
            />
            {errors.venueName && (
              <p className="text-sm text-destructive">
                {errors.venueName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">{req("Venue address")}</Label>
            <p className="text-xs text-muted-foreground">
              Start typing in the street address field for suggestions. City, state, and ZIP are required.
            </p>
            <AddressAutofillFields
              streetProps={{
                id: "venueAddress",
                type: "text",
                placeholder: "Street address",
                ...register("venueAddress"),
              }}
              cityProps={{ type: "text", placeholder: "City", ...register("venueCity") }}
              stateProps={{ type: "text", placeholder: "State", ...register("venueState") }}
              zipProps={{ type: "text", placeholder: "ZIP", ...register("venueZip") }}
            />
            {errors.venueAddress && (
              <p className="text-sm text-destructive">
                {errors.venueAddress.message}
              </p>
            )}
            {errors.venueCity && (
              <p className="text-sm text-destructive">{errors.venueCity.message}</p>
            )}
            {errors.venueState && (
              <p className="text-sm text-destructive">{errors.venueState.message}</p>
            )}
            {errors.venueZip && (
              <p className="text-sm text-destructive">{errors.venueZip.message}</p>
            )}
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <Label>Event type (optional)</Label>
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="facebookUrl">Facebook Link</Label>
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
              <Label htmlFor="instagramUrl">Instagram Link</Label>
              <Input
                id="instagramUrl"
                type="url"
                placeholder="https://instagram.com/..."
                {...register("instagramUrl")}
              />
              {errors.instagramUrl && (
                <p className="text-sm text-destructive">
                  {errors.instagramUrl.message}
                </p>
              )}
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="websiteUrl">Website Link</Label>
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
