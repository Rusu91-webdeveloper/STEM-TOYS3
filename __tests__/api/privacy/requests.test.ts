/** @jest-environment node */
import { NextRequest } from "next/server";

import { GET, POST } from "@/app/api/admin/privacy/requests/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eraseCustomerAccount } from "@/lib/privacy/account-erasure";
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: { consentLog: { findMany: jest.fn(), findFirst: jest.fn() } },
}));
jest.mock("@/lib/cache/user-cache", () => ({
  getUserCache: () => ({ invalidateUser: async () => {} }),
}));
jest.mock("@/lib/privacy/account-erasure", () => ({
  eraseCustomerAccount: jest.fn(),
}));
jest.mock("@/lib/csrf", () => ({
  withCsrfProtection: async (
    request: Request,
    handler: () => Promise<Response>
  ) => {
    await request.text();
    return request.headers.get("x-csrf-token") === "valid"
      ? handler()
      : new Response("{}", { status: 403 });
  },
}));
const mockAuth = auth as jest.Mock;
const erase = eraseCustomerAccount as jest.Mock;
const request = (body: unknown, csrf = "valid") =>
  new NextRequest("http://localhost/api/admin/privacy/requests", {
    method: "POST",
    headers: { "x-csrf-token": csrf },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  jest.resetAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "admin", role: "ADMIN" } });
});
it.each([null, { user: { id: "visitor", role: "VISITOR" } }])(
  "denies %j before reading customer requests",
  async session => {
    mockAuth.mockResolvedValue(session);
    expect((await GET(request({}))).status).toBe(403);
    expect(db.consentLog.findMany).not.toHaveBeenCalled();
  }
);
it("denies missing CSRF and confirmation without erasure", async () => {
  expect(
    (
      await POST(
        request({ requestId: "request", confirmProcessing: true }, "bad")
      )
    ).status
  ).toBe(403);
  expect((await POST(request({ requestId: "request" }))).status).toBe(400);
  expect(erase).not.toHaveBeenCalled();
});
it("cannot delete an arbitrary customer without a pending customer-authored request", async () => {
  (db.consentLog.findFirst as jest.Mock).mockResolvedValue(null);
  expect(
    (
      await POST(
        request({
          requestId: "missing",
          confirmProcessing: true,
          userId: "victim",
        })
      )
    ).status
  ).toBe(404);
  expect(erase).not.toHaveBeenCalled();
});
it("takes the target from the recorded request and preserves unresolved orders", async () => {
  (db.consentLog.findFirst as jest.Mock).mockResolvedValue({
    userId: "request-owner",
  });
  erase.mockResolvedValue({ status: "pending_review" });
  const response = await POST(
    request({ requestId: "request", confirmProcessing: true, userId: "victim" })
  );
  expect(response.status).toBe(202);
  expect(erase).toHaveBeenCalledWith(expect.anything(), "request-owner");
});
