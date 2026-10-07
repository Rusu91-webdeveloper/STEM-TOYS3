/** @jest-environment node */
import { NextRequest } from "next/server";

import { GET } from "@/app/api/cron/daily-maintenance/route";
import { reconcileTerminalCodHolds } from "@/lib/checkout/release-cod-hold";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { db } from "@/lib/db";
import { runRetentionCleanup } from "@/lib/privacy/retention";

jest.mock("@/lib/checkout/release-cod-hold", () => ({
  reconcileTerminalCodHolds: jest.fn(),
}));
jest.mock("@/lib/cron-auth", () => ({ isAuthorizedCronRequest: jest.fn() }));
jest.mock("@/lib/privacy/retention", () => ({
  runRetentionCleanup: jest.fn(),
}));
jest.mock("@/lib/email", () => ({ sendEmail: jest.fn() }));
jest.mock("@/lib/utils/order-processing", () => ({
  shouldAutoFulfillOrder: jest.fn(),
  calculateProcessingTime: jest.fn(),
  getNotificationSettings: jest.fn(),
}));
jest.mock("@/lib/db", () => ({
  db: {
    order: { findMany: jest.fn(), aggregate: jest.fn() },
    passwordResetToken: { deleteMany: jest.fn() },
    verificationToken: { deleteMany: jest.fn() },
  },
}));
const request = () =>
  GET(new NextRequest("http://localhost/api/cron/daily-maintenance"));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(isAuthorizedCronRequest).mockReturnValue(true);
  jest.mocked(db.order.findMany).mockResolvedValue([]);
  jest
    .mocked(db.order.aggregate)
    .mockResolvedValue({ _count: 0, _sum: { total: 0 } } as never);
  jest.mocked(db.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
  jest
    .mocked(runRetentionCleanup)
    .mockResolvedValue({ errors: [], enabled: true } as never);
  jest
    .mocked(reconcileTerminalCodHolds)
    .mockResolvedValue({ checked: 0, outcomes: {} });
});
test("unauthenticated maintenance cannot run cleanup", async () => {
  jest.mocked(isAuthorizedCronRequest).mockReturnValue(false);
  expect((await request()).status).toBe(401);
  expect(runRetentionCleanup).not.toHaveBeenCalled();
  expect(reconcileTerminalCodHolds).not.toHaveBeenCalled();
});
test("a successful worker exposes retention and hold summaries", async () => {
  const response = await request();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.results.retention.errors).toEqual([]);
  expect(body.data.results.codHolds).toEqual({ checked: 0, outcomes: {} });
});
test.each(["retention", "hold", "exception"])(
  "%s cleanup failure is observable as a retry, not success",
  async kind => {
    if (kind === "retention")
      jest
        .mocked(runRetentionCleanup)
        .mockResolvedValue({ errors: ["fixture failure"] } as never);
    if (kind === "hold")
      jest
        .mocked(reconcileTerminalCodHolds)
        .mockResolvedValue({ checked: 1, outcomes: { retry_required: 1 } });
    if (kind === "exception")
      jest
        .mocked(reconcileTerminalCodHolds)
        .mockRejectedValue(new Error("fixture failure"));
    const response = await request();
    expect(response.status).toBe(503);
    expect((await response.json()).success).toBe(false);
  }
);
