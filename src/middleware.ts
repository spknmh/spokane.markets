import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BYPASS_PATHS = ["/admin", "/api", "/auth", "/landing"];

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.).*)"],
};

function shouldBypass(pathname: string): boolean {
  return BYPASS_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

function getApiBase(request: NextRequest): string {
  // Use configured app URL when behind reverse proxy (Docker, Caddy). Fallback to request origin for local dev.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      new URL(appUrl);
      return appUrl.replace(/\/$/, "");
    } catch {
      /* invalid, use fallback */
    }
  }
  return request.nextUrl.origin;
}

export async function middleware(request: NextRequest) {
  if (shouldBypass(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  try {
    const base = getApiBase(request);
    const url = `${base}/api/site-config/landing`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 10 },
    });
    if (!res.ok) return NextResponse.next();
    const { enabled } = await res.json();
    if (enabled) {
      return NextResponse.rewrite(new URL("/landing", request.url));
    }
  } catch {
    // On error, allow request through
  }
  return NextResponse.next();
}
