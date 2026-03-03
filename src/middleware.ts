import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import type { NextAuthRequest } from "next-auth";
import authConfig from "@/auth.config";
import { isPrivilegedForMaintenance } from "@/lib/maintenance-rbac";
import type { MaintenanceMode } from "@prisma/client";
import type { Role } from "@prisma/client";

const { auth } = NextAuth(authConfig);

/** Paths that always bypass maintenance gate */
const BYPASS_PATHS = [
  "/api/auth",
  "/api/auth/register",
  "/auth",
  "/api/site-config/maintenance",
  "/api/health",
  "/maintenance",
  "/admin",
  "/_next",
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
];

function shouldBypass(pathname: string): boolean {
  return BYPASS_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/** Static files (by extension) bypass */
function isStaticFile(pathname: string): boolean {
  return /\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|woff2?|ttf|map)$/i.test(
    pathname
  );
}

function getApiBase(request: NextRequest): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      new URL(appUrl);
      return appUrl.replace(/\/$/, "");
    } catch {
      /* invalid */
    }
  }
  return request.nextUrl.origin;
}

export default auth(async function middleware(request: NextAuthRequest) {
  const pathname = request.nextUrl.pathname;

  if (isStaticFile(pathname)) {
    return NextResponse.next();
  }

  if (shouldBypass(pathname)) {
    return NextResponse.next();
  }

  try {
    const base = getApiBase(request);
    const res = await fetch(`${base}/api/site-config/maintenance`, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 10 },
    });
    if (!res.ok) return NextResponse.next();

    const data = await res.json();
    const mode = (data.mode ?? "OFF") as MaintenanceMode;

    if (mode === "OFF") {
      return NextResponse.next();
    }

    const role = (request.auth?.user?.role ?? null) as Role | null;
    if (isPrivilegedForMaintenance(role, mode)) {
      return NextResponse.next();
    }

    const maintenanceUrl = new URL("/maintenance", request.url);
    maintenanceUrl.searchParams.set("next", pathname);
    return NextResponse.rewrite(maintenanceUrl);
  } catch {
    return NextResponse.next();
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.).*)"],
};
