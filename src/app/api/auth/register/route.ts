import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import {
  signUpSchema,
  signUpSchemaMagicLink,
} from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  sendVerificationEmail,
  sendMagicLinkEmail,
} from "@/lib/send-verification-email";

const magicLinkEnabled = !!(
  process.env.RESEND_API_KEY || process.env.AUTH_RESEND_KEY
);

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

    if (magicLinkEnabled && body.magicLink === true) {
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

      await db.user.create({
        data: {
          name,
          email: normalizedEmail,
          role: role ?? "USER",
        },
      });

      const token = randomBytes(32).toString("hex");
      await db.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      await sendMagicLinkEmail(normalizedEmail, token, callbackUrl);

      return NextResponse.json({
        success: true,
        magicLink: true,
        callbackUrl,
      });
    }

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

    const hashedPassword = await hash(password, 10);

    await db.user.create({
      data: {
        name,
        email,
        hashedPassword,
        role: role ?? "USER",
      },
    });

    const token = randomBytes(32).toString("hex");
    await db.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await sendVerificationEmail(email, token);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
