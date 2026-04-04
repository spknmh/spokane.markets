import { describe, expect, it } from "vitest";
import {
  detectTemplateTokens,
  renderTemplateString,
  validateRequiredPlaceholders,
} from "@/lib/marketing/template-utils";

describe("marketing template utils", () => {
  it("detects unique placeholder tokens", () => {
    const input = "<h1>{{VENDOR_NAME}}</h1><p>{{LISTING_URL}}</p><span>{{VENDOR_NAME}}</span>";
    expect(detectTemplateTokens(input)).toEqual(["LISTING_URL", "VENDOR_NAME"]);
  });

  it("escapes HTML by default and allows opted-in raw placeholders", () => {
    const rendered = renderTemplateString(
      "<h1>{{VENDOR_NAME}}</h1><div>{{VENDOR_NAME_HTML}}</div>",
      {
        VENDOR_NAME: "<script>alert(1)</script>",
        VENDOR_NAME_HTML: "<strong>Safe</strong>",
      },
      { rawHtmlPlaceholders: ["VENDOR_NAME_HTML"] }
    );
    expect(rendered).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(rendered).toContain("<strong>Safe</strong>");
  });

  it("validates missing required placeholders", () => {
    const missing = validateRequiredPlaceholders(
      ["VENDOR_NAME", "LISTING_URL"],
      { VENDOR_NAME: "Acme", LISTING_URL: "" }
    );
    expect(missing).toEqual(["LISTING_URL"]);
  });
});
