"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { trackEvent } from "@/lib/analytics";
import { zodResolver } from "@hookform/resolvers/zod";
import { subscriberSchema, type SubscriberInput } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { NEIGHBORHOODS } from "@/lib/constants";

export function NewsletterForm() {
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubscriberInput>({
    resolver: zodResolver(subscriberSchema),
    defaultValues: {
      email: "",
      areas: [],
      company: "",
    },
  });

  async function onSubmit(data: SubscriberInput) {
    setSuccess(false);
    trackEvent("newsletter_subscribe_start");
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      trackEvent("api_error", { endpoint: "/api/subscribe", status: res.status });
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Subscription failed. Please try again.";
      throw new Error(msg);
    }

    trackEvent("newsletter_subscribe_success");
    setSuccess(true);
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>You&apos;re subscribed!</CardTitle>
          <CardDescription>
            Check your inbox for a confirmation. We&apos;ll send you the first
            digest this Thursday.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscribe</CardTitle>
        <CardDescription>
          Enter your email to receive weekly market updates.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit(onSubmit, () =>
          trackEvent("form_error", { form_id: "newsletter", reason: "validation" })
        )}
      >
        <CardContent className="space-y-4">
          <div className="absolute -left-[9999px] opacity-0" aria-hidden>
            <Label htmlFor="company">Company</Label>
            <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register("company")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Areas of interest (optional)</Label>
            <p className="text-xs text-muted-foreground">
              Select neighborhoods you&apos;re most interested in
            </p>
            <div className="flex flex-wrap gap-2">
              {NEIGHBORHOODS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    value={value}
                    {...register("areas")}
                    className="rounded border-border"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Subscribing…" : "Subscribe"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
