/** @jest-environment node */
import { NextRequest } from "next/server";

import { DELETE } from "@/app/api/gdpr/delete/route";
import { auth } from "@/lib/auth";
import { eraseCustomerAccount } from "@/lib/privacy/account-erasure";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({ db: {} }));
jest.mock("@/lib/cache/user-cache", () => ({
  getUserCache: () => ({ invalidateUser: jest.fn() }),
}));
jest.mock("@/lib/privacy/account-erasure", () => ({
  eraseCustomerAccount: jest.fn(),
}));
jest.mock("@/lib/csrf", () => ({
  withCsrfProtection: async (
    request: Request,
    handler: () => Promise<Response>
  ) => {
    await request.text(); // Exercise the middleware's body consumption.
    if (request.headers.get("x-csrf-token") !== "valid-fixture")
      return new Response("{}", { status: 403 });
    return handler();
  },
}));
const mockAuth = auth as jest.Mock;
const erase = eraseCustomerAccount as jest.Mock;
const request = (body: unknown, csrf = "valid-fixture") =>
  new NextRequest("http://localhost/api/gdpr/delete", {
    method: "DELETE",
    headers: { "content-type": "application/json", "x-csrf-token": csrf },
    body: JSON.stringify(body),
  });
beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "owner", role: "CUSTOMER" } });
  erase.mockResolvedValue({
    status: "completed",
    retained: ["transaction_records"],
  });
});
it.each([null, {}, { user: {} }])(
  "denies absent identity %j before deletion",
  async session => {
    mockAuth.mockResolvedValue(session);
    const response = await DELETE(request({ confirmDeletion: true }));
    expect(response.status).toBe(403);
    expect(erase).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  }
);
it("requires CSRF without erasing anything", async () => {
  const response = await DELETE(request({ confirmDeletion: true }, "bad"));
  expect(response.status).toBe(403);
  expect(erase).not.toHaveBeenCalled();
});
it.each([{}, { confirmDeletion: "true" }, { confirmDeletion: false }])(
  "requires explicit boolean confirmation %j",
  async body => {
    expect((await DELETE(request(body))).status).toBe(400);
    expect(erase).not.toHaveBeenCalled();
  }
);
it("uses session identity and preserves the body through CSRF middleware", async () => {
  const response = await DELETE(
    request({ confirmDeletion: true, userId: "another-owner" })
  );
  expect(response.status).toBe(200);
  expect(erase).toHaveBeenCalledWith(expect.anything(), "owner");
  expect(await response.json()).toMatchObject({
    status: "completed",
    retained: ["transaction_records"],
  });
});
it.each([
  ["pending_review", 202],
  ["staff_review", 409],
  ["not_found", 404],
])("reports %s accurately", async (status, code) => {
  erase.mockResolvedValue({ status });
  const response = await DELETE(request({ confirmDeletion: true }));
  expect(response.status).toBe(code);
  expect(JSON.stringify(await response.json())).not.toContain("30 de zile");
});
it("fails without claiming completion when the transaction rolls back", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  erase.mockRejectedValue(new Error("secret fixture details"));
  const response = await DELETE(request({ confirmDeletion: true }));
  expect(response.status).toBe(500);
  expect(JSON.stringify(await response.json())).not.toContain("secret");
  expect(log).toHaveBeenCalledWith("Account erasure transaction failed");
  log.mockRestore();
});
