import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireApiAdminPermissionMock, dbMock, logAuditMock } = vi.hoisted(() => ({
  requireApiAdminPermissionMock: vi.fn(),
  dbMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
  logAuditMock: vi.fn(),
}));

vi.mock("@/lib/api-auth", () => ({
  requireApiAdminPermission: requireApiAdminPermissionMock,
}));

vi.mock("@/lib/db", () => ({
  db: dbMock,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: logAuditMock,
}));

import { PATCH } from "./route";

describe("PATCH /api/admin/users/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireApiAdminPermissionMock.mockResolvedValue({
      session: { user: { id: "admin-1" } },
      error: null,
    });
  });

  it("sends password reset email without requiring role/status fields", async () => {
    dbMock.user.findUnique.mockResolvedValue({ email: "amanda@example.com" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const response = await PATCH(
      new Request("http://localhost/api/admin/users/user-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendPasswordReset: true }),
      }),
      { params: Promise.resolve({ id: "user-1" }) }
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalled();
    expect(dbMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: { email: true },
    });

    const body = await response.json();
    expect(body).toEqual({
      success: true,
      message: "Password reset email sent",
    });
  });

  it("returns 400 when role/accountStatus/sendPasswordReset are all missing", async () => {
    const response = await PATCH(
      new Request("http://localhost/api/admin/users/user-1", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "user-1" }) }
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error?.message).toBe(
      "Role or accountStatus is required unless sendPasswordReset is true"
    );
  });
});
