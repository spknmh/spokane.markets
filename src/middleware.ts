import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { MaintenanceMode } from "@prisma/client";

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

/**
 * Maintenance gate: when mode is ON, rewrite to /maintenance.
 * Privileged users (admin, vendor, organizer) bypass via the maintenance page
 * which runs on Node.js and can use auth() with database sessions.
 */
export default async function middleware(request: NextRequest) {
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

    const maintenanceUrl = new URL("/maintenance", request.url);
    maintenanceUrl.searchParams.set("next", pathname);
    return NextResponse.rewrite(maintenanceUrl);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.).*)"],
};
