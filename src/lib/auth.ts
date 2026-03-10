import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { magicLink } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { Resend } from "resend";
import { db } from "@/lib/db";
import { SITE_NAME } from "@/lib/constants";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is required for email sending");
  return new Resend(key);
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  user: {
    modelName: "users",
    additionalFields: {
      role: {
        type: "string" as const,
        required: false,
        defaultValue: "USER",
        input: false,
      },
    },
  },
  session: {
    modelName: "sessions",
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  account: {
    modelName: "accounts",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
    }) => {
      const resend = getResend();
      try {
        await resend.emails.send({
          from: `${SITE_NAME} <noreply@spokane.market>`,
          to: user.email,
          subject: `Verify your email — ${SITE_NAME}`,
          html: `
            <h2>Welcome to ${SITE_NAME}!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href="${url}" style="display:inline-block;background:#006838;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Verify Email</a></p>
            <p>Or copy this link: ${url}</p>
            <p>This link expires in 24 hours.</p>
            <p>If you didn't create an account, you can ignore this email.</p>
          `,
        });
      } catch (err) {
        console.error("[auth] Failed to send verification email:", err);
      }
    },
    sendResetPassword: async ({
      user,
      url,
    }: {
      user: { email: string };
      url: string;
    }) => {
      const resend = getResend();
      try {
        await resend.emails.send({
          from: `${SITE_NAME} <noreply@spokane.market>`,
          to: user.email,
          subject: `Reset your password — ${SITE_NAME}`,
          html: `
            <h2>Reset your password</h2>
            <p>Click the link below to reset your password:</p>
            <p><a href="${url}" style="display:inline-block;background:#006838;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Reset Password</a></p>
            <p>Or copy this link: ${url}</p>
            <p>This link expires in 1 hour.</p>
            <p>If you didn't request this, you can ignore this email.</p>
          `,
        });
      } catch (err) {
        console.error("[auth] Failed to send reset password email:", err);
      }
    },
  },
  socialProviders: {
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? {
          google: {
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          },
        }
      : {}),
    ...(process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
      ? {
          facebook: {
            clientId: process.env.AUTH_FACEBOOK_ID,
            clientSecret: process.env.AUTH_FACEBOOK_SECRET,
          },
        }
      : {}),
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        const resend = getResend();
        try {
          await resend.emails.send({
            from: `${SITE_NAME} <noreply@spokane.market>`,
            to: email,
            subject: `Sign in to ${SITE_NAME}`,
            html: `
              <h2>Welcome to ${SITE_NAME}!</h2>
              <p>Click the link below to sign in to your account:</p>
              <p><a href="${url}" style="display:inline-block;background:#006838;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;">Sign in</a></p>
              <p>Or copy this link: ${url}</p>
              <p>This link expires in 5 minutes.</p>
              <p>If you didn't request this email, you can safely ignore it.</p>
            `,
          });
        } catch (err) {
          console.error("[auth] Failed to send magic link email:", err);
        }
      },
    }),
    nextCookies(),
  ],
});

export type Session = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;
