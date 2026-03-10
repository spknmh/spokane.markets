import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { requireApiAuth } from "@/lib/api-auth";
import { apiError, apiValidationError } from "@/lib/api-response";
import { checkRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { z } from "zod";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const rl = await checkRateLimit(ip, "changePassword");
    if (!rl.ok) {
      return apiError("Too many requests", 429);
    }

    const { error } = await requireApiAuth();
    if (error) return error;

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error.flatten().fieldErrors);
    }

    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: false,
      },
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to change password";
    console.error("[POST /api/account/change-password]", err);
    return apiError(message, 400);
  }
}
