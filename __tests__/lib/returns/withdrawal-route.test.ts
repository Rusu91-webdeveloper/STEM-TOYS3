import { NextRequest } from "next/server";

import {
  GET as adminGet,
  POST as adminPost,
} from "@/app/api/admin/withdrawals/route";
import { POST } from "@/app/api/returns/withdrawal/route";
import { auth } from "@/lib/auth";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import { rateLimiter } from "@/lib/rate-limit";
import { createWithdrawalReceipt } from "@/lib/returns/withdrawal";
import {
  deliverWithdrawal,
  registerWithdrawal,
} from "@/lib/returns/withdrawal-service";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/csrf", () => ({ validateCsrfForRequest: jest.fn() }));
jest.mock("@/lib/rate-limit", () => ({
  getClientIdentifier: () => "test",
  rateLimiter: { checkLimit: jest.fn() },
}));
jest.mock("@/lib/db", () => ({
  db: {
    emailLog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));
jest.mock("@/lib/returns/withdrawal-service", () => ({
  registerWithdrawal: jest.fn(),
  deliverWithdrawal: jest.fn(),
}));
const input = {
  submissionId: "00000000-0000-4000-8000-000000000001",
  name: "Test",
  email: "test@example.invalid",
  contract: "TEST-1",
  confirmed: true as const,
};
const request = (body: unknown = input) =>
  new NextRequest("https://shop.example/api/returns/withdrawal", {
    method: "POST",
    body: JSON.stringify(body),
  });
beforeEach(() => {
  jest.clearAllMocks();
  (validateCsrfForRequest as jest.Mock).mockResolvedValue({ valid: true });
  (rateLimiter.checkLimit as jest.Mock).mockResolvedValue({ success: true });
  (registerWithdrawal as jest.Mock).mockResolvedValue(
    createWithdrawalReceipt(input)
  );
  (auth as jest.Mock).mockResolvedValue(null);
});
test("guest can record a declaration without order lookup or login", async () => {
  const response = await POST(request());
  expect(response.status).toBe(201);
  const data = await response.json();
  expect(data.text).toContain(input.contract);
  expect(data.receipt.receivedAt).toBeTruthy();
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(auth).not.toHaveBeenCalled();
});
test("CSRF denial prevents persistence", async () => {
  (validateCsrfForRequest as jest.Mock).mockResolvedValue({ valid: false });
  expect((await POST(request())).status).toBe(403);
  expect(registerWithdrawal).not.toHaveBeenCalled();
});
test("rate limiting, malformed data and unconfirmed requests never register", async () => {
  (rateLimiter.checkLimit as jest.Mock).mockResolvedValueOnce({
    success: false,
    retryAfter: 60,
  });
  const limited = await POST(request());
  expect(limited.status).toBe(429);
  expect(limited.headers.get("Retry-After")).toBe("60");
  expect((await POST(request({ ...input, confirmed: false }))).status).toBe(
    400
  );
  expect(
    (await POST(request({ ...input, contract: "x".repeat(9000) }))).status
  ).toBe(413);
  expect(registerWithdrawal).not.toHaveBeenCalled();
});
test("storage failure is not presented as receipt", async () => {
  (registerWithdrawal as jest.Mock).mockRejectedValue(new Error("DB down"));
  expect((await POST(request())).status).toBe(503);
});
test.each([
  null,
  { user: { id: "customer", role: "CUSTOMER" } },
  { user: { id: "visitor", role: "VISITOR" } },
])("admin read and mutation deny unauthorized roles", async session => {
  (auth as jest.Mock).mockResolvedValue(session);
  const req = new NextRequest("https://shop.example/api/admin/withdrawals");
  expect((await adminGet(req)).status).toBe(403);
  expect((await adminPost(req)).status).toBe(403);
  expect(db.emailLog.findMany).not.toHaveBeenCalled();
});
test("admin list is bounded, private and restricted to withdrawal records", async () => {
  (auth as jest.Mock).mockResolvedValue({
    user: { id: "admin", role: "ADMIN" },
  });
  (db.emailLog.findMany as jest.Mock).mockResolvedValue([]);
  const response = await adminGet(
    new NextRequest("https://shop.example/api/admin/withdrawals")
  );
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(db.emailLog.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      take: 101,
      where: { metadata: { path: ["type"], equals: "contract_withdrawal_v1" } },
    })
  );
});

test("admin mutations require CSRF and refuse an in-flight delivery review", async () => {
  (auth as jest.Mock).mockResolvedValue({
    user: { id: "admin", role: "ADMIN" },
  });
  const receipt = createWithdrawalReceipt(input);
  const req = () =>
    new NextRequest("https://shop.example/api/admin/withdrawals", {
      method: "POST",
      body: JSON.stringify({
        reference: receipt.reference,
        action: "reviewed",
      }),
    });
  (validateCsrfForRequest as jest.Mock).mockResolvedValueOnce({ valid: false });
  expect((await adminPost(req())).status).toBe(403);
  expect(db.emailLog.findUnique).not.toHaveBeenCalled();
  (db.emailLog.findUnique as jest.Mock).mockResolvedValue({
    status: "sending",
    metadata: receipt,
  });
  expect((await adminPost(req())).status).toBe(409);
  expect(db.emailLog.updateMany).not.toHaveBeenCalled();
  (db.emailLog.findUnique as jest.Mock).mockResolvedValue({
    status: "failed",
    metadata: receipt,
  });
  (db.emailLog.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
  expect((await adminPost(req())).status).toBe(409);
});

test("slow validation does not shift the original request-receipt timestamp", async () => {
  jest.useFakeTimers();
  const arrival = "2026-10-04T20:59:59.000Z";
  jest.setSystemTime(new Date(arrival));
  (validateCsrfForRequest as jest.Mock).mockImplementation(() => {
    jest.advanceTimersByTime(60000);
    return Promise.resolve({ valid: true });
  });
  (registerWithdrawal as jest.Mock).mockImplementation((data, receivedAt) =>
    Promise.resolve(createWithdrawalReceipt(data, receivedAt))
  );
  try {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect((await response.json()).receipt.receivedAt).toBe(arrival);
    expect(registerWithdrawal).toHaveBeenCalledWith(input, new Date(arrival));
  } finally {
    jest.useRealTimers();
  }
});

test("an authenticated admin records review and retry outcomes", async () => {
  (auth as jest.Mock).mockResolvedValue({
    user: { id: "admin", role: "ADMIN" },
  });
  const receipt = createWithdrawalReceipt(input);
  (db.emailLog.findUnique as jest.Mock).mockResolvedValue({
    status: "failed",
    metadata: receipt,
  });
  (db.emailLog.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
  const req = (action: string) =>
    new NextRequest("https://shop.example/api/admin/withdrawals", {
      method: "POST",
      body: JSON.stringify({ reference: receipt.reference, action }),
    });
  expect((await adminPost(req("reviewed"))).status).toBe(200);
  expect(db.emailLog.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: {
        metadata: expect.objectContaining({ reviewedAt: expect.any(String) }),
      },
    })
  );
  (deliverWithdrawal as jest.Mock).mockResolvedValue({
    ...receipt,
    customerNotified: true,
    merchantNotified: true,
  });
  expect((await adminPost(req("retry_email"))).status).toBe(200);
  expect(deliverWithdrawal).toHaveBeenCalledWith(receipt.reference);
  (deliverWithdrawal as jest.Mock).mockResolvedValue({
    ...receipt,
    customerNotified: true,
    merchantNotified: false,
  });
  const incomplete = await adminPost(req("retry_email"));
  expect(incomplete.status).toBe(202);
  expect((await incomplete.json()).deliveryComplete).toBe(false);
});
