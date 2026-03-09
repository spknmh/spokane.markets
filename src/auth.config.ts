import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Auth config. Uses JWT strategy (Credentials requires JWT).
 * Credentials, OAuth, and magic link all supported during verification phase.
 * Middleware no longer uses auth (maintenance bypass handled on maintenance page).
 */
export default {
  providers: [],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? "USER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
