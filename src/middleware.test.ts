import { describe, it, expect } from "vitest";

/**
 * Unit tests for proxy allowlist logic.
 * The actual allowlist is in proxy.ts - we test the same logic here.
 */
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

function isStaticFile(pathname: string): boolean {
  return /\.(ico|png|jpg|jpeg|gif|webp|svg|css|js|woff2?|ttf|map)$/i.test(
    pathname
  );
}

describe("proxy allowlist", () => {
  describe("shouldBypass", () => {
    it("allows /api/auth and subpaths", () => {
      expect(shouldBypass("/api/auth")).toBe(true);
      expect(shouldBypass("/api/auth/session")).toBe(true);
      expect(shouldBypass("/api/auth/callback/google")).toBe(true);
    });
    it("allows /api/auth/register", () => {
      expect(shouldBypass("/api/auth/register")).toBe(true);
    });
    it("allows /auth and subpaths", () => {
      expect(shouldBypass("/auth")).toBe(true);
      expect(shouldBypass("/auth/signin")).toBe(true);
      expect(shouldBypass("/auth/signup")).toBe(true);
    });
    it("allows /api/site-config/maintenance", () => {
      expect(shouldBypass("/api/site-config/maintenance")).toBe(true);
    });
    it("allows /api/health", () => {
      expect(shouldBypass("/api/health")).toBe(true);
    });
    it("allows /maintenance", () => {
      expect(shouldBypass("/maintenance")).toBe(true);
    });
    it("allows /admin and subpaths", () => {
      expect(shouldBypass("/admin")).toBe(true);
      expect(shouldBypass("/admin/settings")).toBe(true);
    });
    it("allows /_next and static assets", () => {
      expect(shouldBypass("/_next")).toBe(true);
      expect(shouldBypass("/_next/static/chunks/foo.js")).toBe(true);
    });
    it("allows favicon, robots, sitemap", () => {
      expect(shouldBypass("/favicon.ico")).toBe(true);
      expect(shouldBypass("/robots.txt")).toBe(true);
      expect(shouldBypass("/sitemap.xml")).toBe(true);
    });
    it("does not allow public pages when not in allowlist", () => {
      expect(shouldBypass("/")).toBe(false);
      expect(shouldBypass("/events")).toBe(false);
      expect(shouldBypass("/markets")).toBe(false);
      expect(shouldBypass("/vendors")).toBe(false);
    });
  });

  describe("isStaticFile", () => {
    it("identifies static files by extension", () => {
      expect(isStaticFile("/favicon.ico")).toBe(true);
      expect(isStaticFile("/image.png")).toBe(true);
      expect(isStaticFile("/style.css")).toBe(true);
      expect(isStaticFile("/script.js")).toBe(true);
      expect(isStaticFile("/font.woff2")).toBe(true);
    });
    it("rejects non-static paths", () => {
      expect(isStaticFile("/")).toBe(false);
      expect(isStaticFile("/events")).toBe(false);
      expect(isStaticFile("/api/health")).toBe(false);
    });
  });
});
