import { describe, expect, it, vi } from "vitest";
import { isAllowedRemoteUrl } from "@/lib/marketing/network-safety";

describe("network safety allowlist", () => {
  it("blocks localhost and private IPs", () => {
    vi.stubEnv("MARKETING_REMOTE_IMAGE_ALLOWLIST", "images.example.com");
    expect(isAllowedRemoteUrl("http://localhost:3000/foo.png")).toBe(false);
    expect(isAllowedRemoteUrl("https://127.0.0.1/foo.png")).toBe(false);
    expect(isAllowedRemoteUrl("https://192.168.0.10/foo.png")).toBe(false);
    vi.unstubAllEnvs();
  });

  it("allows only configured host suffixes", () => {
    vi.stubEnv("MARKETING_REMOTE_IMAGE_ALLOWLIST", "images.example.com,cdn.example.org");
    expect(isAllowedRemoteUrl("https://images.example.com/a.png")).toBe(true);
    expect(isAllowedRemoteUrl("https://sub.cdn.example.org/a.png")).toBe(true);
    expect(isAllowedRemoteUrl("https://evil.example.net/a.png")).toBe(false);
    vi.unstubAllEnvs();
  });
});
