import { NextResponse } from "next/server";

interface ApiErrorOptions {
  code?: string;
  details?: unknown;
}

export function apiError(
  message: string,
  status: number,
  options?: ApiErrorOptions
): NextResponse {
  return NextResponse.json(
    {
      error: {
        message,
        ...(options?.code && { code: options.code }),
        ...(options?.details != null ? { details: options.details } : {}),
      },
    },
    { status }
  );
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function apiValidationError(
  fieldErrors: Record<string, string[]>
): NextResponse {
  return apiError("Validation failed", 400, {
    code: "VALIDATION_ERROR",
    details: { fieldErrors },
  });
}

export function apiNotFound(resource: string = "Resource"): NextResponse {
  return apiError(`${resource} not found`, 404, { code: "NOT_FOUND" });
}
