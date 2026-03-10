"use client";

import { useEffect, useRef, useState } from "react";
import {
  trackApiError,
  trackEvent,
  trackMilestoneEvent,
} from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useAbandonTracking } from "@/hooks/use-abandon-tracking";

export type FormField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "email" | "checkbox";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helpText?: string;
};

type ApplicationFormProps = {
  form: {
    id: string;
    type: string;
    title: string;
    description: string | null;
    fields: unknown;
  };
  formType: "VENDOR" | "MARKET";
};

function formatApiError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && !Array.isArray(error)) {
    const entries = Object.entries(error).flatMap(([_, v]) =>
      Array.isArray(v) ? v : v ? [String(v)] : []
    );
    return entries.filter(Boolean).join(" ") || "Something went wrong.";
  }
  return "Something went wrong.";
}

export function ApplicationForm({ form, formType }: ApplicationFormProps) {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string | boolean>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const startedRef = useRef(false);

  const fields = (form.fields as FormField[]) ?? [];
  const eventPrefix = formType.toLowerCase();
  const isDirty =
    name.trim().length > 0 ||
    email.trim().length > 0 ||
    Object.keys(answers).length > 0;

  useEffect(() => {
    if (startedRef.current || !isDirty) return;
    startedRef.current = true;
    trackEvent(`${eventPrefix}_application_started`, {
      form_type: eventPrefix,
    });
  }, [eventPrefix, isDirty]);

  useAbandonTracking({
    eventName: `${eventPrefix}_application_abandon`,
    isDirty,
    isComplete: success,
    params: { form_type: eventPrefix },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    setIsSubmitting(true);

    const payload = {
      formType,
      name: name.trim(),
      email: email.trim(),
      answers: Object.fromEntries(
        Object.entries(answers).map(([k, v]) => [k, typeof v === "boolean" ? String(v) : v])
      ),
    };

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        trackApiError("applications", res.status, { reason: "server" });
        setServerError(formatApiError(json.error ?? "Something went wrong"));
        return;
      }

      trackMilestoneEvent(`${eventPrefix}_application_submitted`, {
        form_type: eventPrefix,
      });
      setSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Submitted</CardTitle>
          <CardDescription>
            Thank you! We&apos;ll review your application and get back to you.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.title}</CardTitle>
        {form.description && (
          <CardDescription>{form.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {serverError && (
            <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="application-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="application-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="min-h-[44px] w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="application-email">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="application-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="min-h-[44px] w-full"
            />
          </div>

          {fields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`field-${field.id}`}>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
              </Label>
              {field.type === "textarea" ? (
                <Textarea
                  id={`field-${field.id}`}
                  placeholder={field.placeholder}
                  value={(answers[field.id] as string) ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  required={field.required}
                  rows={4}
                  className="min-h-[120px] w-full"
                />
              ) : field.type === "select" ? (
                <Select
                  id={`field-${field.id}`}
                  value={(answers[field.id] as string) ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  required={field.required}
                  className="min-h-[44px] w-full"
                >
                  <option value="">{field.placeholder ?? "Select..."}</option>
                  {(field.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </Select>
              ) : field.type === "checkbox" ? (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`field-${field.id}`}
                    checked={(answers[field.id] as boolean) ?? false}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [field.id]: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-border"
                  />
                  {field.placeholder && (
                    <span className="text-sm text-muted-foreground">{field.placeholder}</span>
                  )}
                </div>
              ) : (
                <Input
                  id={`field-${field.id}`}
                  type={field.type === "email" ? "email" : "text"}
                  placeholder={field.placeholder}
                  value={(answers[field.id] as string) ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  required={field.required}
                  className="min-h-[44px] w-full"
                />
              )}
              {field.helpText && (
                <p className="text-sm text-muted-foreground">{field.helpText}</p>
              )}
            </div>
          ))}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] w-full sm:w-auto"
          >
            {isSubmitting ? "Submitting..." : "Submit Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
