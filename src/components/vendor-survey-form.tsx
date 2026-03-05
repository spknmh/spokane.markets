"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { SITE_NAME } from "@/lib/constants";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  vendorSurveySchema,
  type VendorSurveyInput,
} from "@/lib/validations";
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

const VENDOR_TYPES = [
  { value: "handmade-craft", label: "Handmade/Craft" },
  { value: "food-beverage", label: "Food/Beverage" },
  { value: "farm-produce", label: "Farm/Produce" },
  { value: "vintage-resale", label: "Vintage/Resale" },
  { value: "art-photography", label: "Art/Photography" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
] as const;

const LEAD_TIME_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "1-week", label: "1 week" },
  { value: "2-weeks", label: "2 weeks" },
  { value: "1-month", label: "1 month" },
  { value: "2-plus-months", label: "2+ months" },
] as const;

const WILLINGNESS_OPTIONS = [
  { value: "", label: "Select..." },
  { value: "not-willing", label: "Not willing" },
  { value: "5-10", label: "$5-10/month" },
  { value: "10-25", label: "$10-25/month" },
  { value: "25-50", label: "$25-50/month" },
  { value: "50-plus", label: "$50+/month" },
] as const;

export function VendorSurveyForm() {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorSurveyInput>({
    resolver: zodResolver(vendorSurveySchema),
    defaultValues: {
      vendorType: "",
      leadTimeNeeded: "",
      biggestPainPoints: "",
      missingInfo: "",
      willingnessToPay: "",
      contactName: "",
      contactEmail: "",
    },
  });

  async function onSubmit(data: VendorSurveyInput) {
    setSuccess(false);
    setError(null);
    const res = await fetch("/api/vendor-survey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const json = await res.json();

    if (!res.ok) {
      const msg =
        typeof json.error === "string"
          ? json.error
          : "Survey submission failed. Please try again.";
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
            Your feedback helps us improve {SITE_NAME} for vendors like you.
            We appreciate you taking the time to share your experience.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share your experience</CardTitle>
        <CardDescription>
          Tell us about your vendor experience and what would help you most.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <div
              role="alert"
              className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="vendorType">Vendor type</Label>
            <Select id="vendorType" {...register("vendorType")}>
              <option value="">Select...</option>
              {VENDOR_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
            {errors.vendorType && (
              <p className="text-sm text-destructive">
                {errors.vendorType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="leadTimeNeeded">Lead time needed to apply</Label>
            <Select id="leadTimeNeeded" {...register("leadTimeNeeded")}>
              {LEAD_TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="biggestPainPoints">Biggest pain points</Label>
            <Textarea
              id="biggestPainPoints"
              placeholder="What are the biggest challenges when finding and applying to shows?"
              rows={3}
              {...register("biggestPainPoints")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="missingInfo">
              What info do you wish you had when evaluating shows?
            </Label>
            <Textarea
              id="missingInfo"
              placeholder="e.g. booth size, foot traffic estimates, vendor mix..."
              rows={3}
              {...register("missingInfo")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="willingnessToPay">
              Willingness to pay for a vendor-focused directory
            </Label>
            <Select id="willingnessToPay" {...register("willingnessToPay")}>
              {WILLINGNESS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Your name (optional)</Label>
              <Input
                id="contactName"
                type="text"
                placeholder="Jane Doe"
                {...register("contactName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Your email (optional)</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="you@example.com"
                {...register("contactEmail")}
              />
              {errors.contactEmail && (
                <p className="text-sm text-destructive">
                  {errors.contactEmail.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : "Submit survey"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
