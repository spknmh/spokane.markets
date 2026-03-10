"use client";

interface FormErrorBannerProps {
  message: string | null | undefined;
}

export function FormErrorBanner({ message }: FormErrorBannerProps) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
    >
      {message}
    </div>
  );
}
