import { describe, expect, it } from "vitest";
import { getStaticSitemapRoutes } from "@/app/sitemap";

describe("getStaticSitemapRoutes", () => {
  it("includes key static discovery routes", () => {
    const now = new Date("2026-03-10T00:00:00.000Z");
    const routes = getStaticSitemapRoutes("https://spokane.markets", now);

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://spokane.markets/vendors",
          lastModified: now,
        }),
        expect.objectContaining({
          url: "https://spokane.markets/markets",
          lastModified: now,
        }),
        expect.objectContaining({
          url: "https://spokane.markets/submit",
          lastModified: now,
        }),
      ])
    );
  });
});
