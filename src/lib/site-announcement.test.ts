import { describe, expect, it } from "vitest";
import {
  isValidSiteAnnouncementUrl,
  normalizeSiteAnnouncement,
} from "@/lib/site-announcement";

describe("isValidSiteAnnouncementUrl", () => {
  it("accepts internal and absolute urls", () => {
    expect(isValidSiteAnnouncementUrl("/vendor/profile/edit")).toBe(true);
    expect(isValidSiteAnnouncementUrl("https://spokane.markets/apply")).toBe(
      true
    );
    expect(isValidSiteAnnouncementUrl("http://localhost:3000/apply")).toBe(
      true
    );
  });

  it("rejects unsupported urls", () => {
    expect(isValidSiteAnnouncementUrl("apply/vendor")).toBe(false);
    expect(isValidSiteAnnouncementUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("normalizeSiteAnnouncement", () => {
  it("disables empty announcements", () => {
    expect(
      normalizeSiteAnnouncement({
        enabled: true,
        text: "   ",
      })
    ).toEqual({
      enabled: false,
      text: "",
      linkLabel: null,
      linkUrl: null,
    });
  });

  it("keeps a valid cta pair", () => {
    expect(
      normalizeSiteAnnouncement({
        enabled: true,
        text: " Vendor applications are open. ",
        linkLabel: " Apply now ",
        linkUrl: "/vendor/profile/edit",
      })
    ).toEqual({
      enabled: true,
      text: "Vendor applications are open.",
      linkLabel: "Apply now",
      linkUrl: "/vendor/profile/edit",
    });
  });

  it("drops incomplete or invalid cta pairs", () => {
    expect(
      normalizeSiteAnnouncement({
        enabled: true,
        text: "Applications are open.",
        linkLabel: "Apply now",
      })
    ).toEqual({
      enabled: true,
      text: "Applications are open.",
      linkLabel: null,
      linkUrl: null,
    });

    expect(
      normalizeSiteAnnouncement({
        enabled: true,
        text: "Applications are open.",
        linkLabel: "Apply now",
        linkUrl: "javascript:alert(1)",
      })
    ).toEqual({
      enabled: true,
      text: "Applications are open.",
      linkLabel: null,
      linkUrl: null,
    });
  });
});
