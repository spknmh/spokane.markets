import { describe, expect, it } from "vitest";
import { getStaticSitemapRoutes } from "@/app/sitemap";

describe("getStaticSitemapRoutes", () => {
  it("includes public application routes", () => {
    const now = new Date("2026-03-10T00:00:00.000Z");
    const routes = getStaticSitemapRoutes("https://spokane.markets", now);

    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: "https://spokane.markets/apply/vendor",
          lastModified: now,
        }),
        expect.objectContaining({
          url: "https://spokane.markets/apply/market",
          lastModified: now,
        }),
      ])
    );
  });
});
