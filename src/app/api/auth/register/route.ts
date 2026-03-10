import { NextResponse } from "next/server";
import { headers as getHeaders } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { signUpSchema, signUpSchemaMagicLink } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ??
      request.headers.get("x-real-ip") ??
      "unknown";
    const { ok } = checkRateLimit(ip, "register");
    if (!ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const useMagicLink = body.magicLink === true;

    if (useMagicLink) {
      const parsed = signUpSchemaMagicLink.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { name, email, role = "USER", website } = parsed.data;
      const callbackUrl = (body.callbackUrl as string) || "/dashboard";

      if (website && website.length > 0) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const existing = await db.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existing) {
        return NextResponse.json(
          { error: { email: ["An account with this email already exists"] } },
          { status: 409 }
        );
      }

      await auth.api.signInMagicLink({
        headers: await getHeaders(),
        body: {
          email: normalizedEmail,
          name,
          callbackURL: callbackUrl,
        },
      });

      // Set the role on the created user
      await db.user.update({
        where: { email: normalizedEmail },
        data: { role: role ?? "USER" },
      });

      return NextResponse.json({
        success: true,
        magicLink: true,
        callbackUrl,
      });
    }

    // Password-based registration
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role = "USER", website } = parsed.data;

    if (website && website.length > 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const existing = await db.user.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { error: { email: ["An account with this email already exists"] } },
        { status: 409 }
      );
    }

    // Use Better Auth server API to create user with email+password
    const signUpResult = await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    if (!signUpResult?.user) {
      return NextResponse.json(
        { error: "Registration failed" },
        { status: 500 }
      );
    }

    // Set the role on the created user
    await db.user.update({
      where: { email },
      data: { role: role ?? "USER" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
