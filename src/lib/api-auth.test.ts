import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(() => new Headers()),
}));

import { requireApiAuth, requireApiAdmin, requireApiRole } from "./api-auth";
import { auth } from "@/lib/auth";

const mockSession = (role: string) =>
  ({
    user: { id: "u1", name: "Test User", email: "test@test.com", role },
    session: { id: "s1" },
  }) as any;

describe("requireApiAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session exists", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const result = await requireApiAuth();
    expect(result.session).toBeNull();
    expect(result.error).not.toBeNull();
    const body = await result.error!.json();
    expect(body.error.message).toBe("Authentication required");
    expect(result.error!.status).toBe(401);
  });

  it("returns session when authenticated", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession("USER"));
    const result = await requireApiAuth();
    expect(result.error).toBeNull();
    expect(result.session).not.toBeNull();
    expect(result.session!.user.email).toBe("test@test.com");
  });
});

describe("requireApiAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session exists", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const result = await requireApiAdmin();
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it("returns 403 when user has role USER", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession("USER"));
    const result = await requireApiAdmin();
    expect(result.session).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
    const body = await result.error!.json();
    expect(body.error.message).toBe("Forbidden: admin access required");
  });

  it("succeeds when user has role ADMIN", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession("ADMIN"));
    const result = await requireApiAdmin();
    expect(result.error).toBeNull();
    expect(result.session).not.toBeNull();
    expect(result.session!.user.role).toBe("ADMIN");
  });
});

describe("requireApiRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no session exists", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);
    const result = await requireApiRole("ORGANIZER");
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it("returns 403 when user lacks the required role", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession("USER"));
    const result = await requireApiRole("ORGANIZER");
    expect(result.session).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
    const body = await result.error!.json();
    expect(body.error.message).toBe("Forbidden: ORGANIZER access required");
  });

  it("succeeds when user has the exact required role", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession("ORGANIZER"));
    const result = await requireApiRole("ORGANIZER");
    expect(result.error).toBeNull();
    expect(result.session).not.toBeNull();
  });

  it("succeeds for ADMIN users (admin bypass)", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession("ADMIN"));
    const result = await requireApiRole("ORGANIZER");
    expect(result.error).toBeNull();
    expect(result.session).not.toBeNull();
    expect(result.session!.user.role).toBe("ADMIN");
  });
});
