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
let stdout: jest.SpyInstance;
let stderr: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  stdout = jest.spyOn(process.stdout, "write").mockReturnValue(true);
  stderr = jest.spyOn(process.stderr, "write").mockReturnValue(true);
  jest.mocked(isAuthorizedCronRequest).mockReturnValue(true);
  jest.mocked(db.order.findMany).mockResolvedValue([]);
  jest
    .mocked(db.order.aggregate)
    .mockResolvedValue({ _count: 0, _sum: { total: 0 } } as never);
  jest.mocked(db.passwordResetToken.deleteMany).mockResolvedValue({ count: 0 });
  jest.mocked(runRetentionCleanup).mockResolvedValue({
    processedPolicies: 2,
    deletedRecords: 500,
    manualReview: [],
    errors: [],
  });
  jest
    .mocked(reconcileTerminalCodHolds)
    .mockResolvedValue({ checked: 0, outcomes: {} });
});
afterEach(() => {
  stdout.mockRestore();
  stderr.mockRestore();
});
const executionRecord = (stream: jest.SpyInstance) =>
  stream.mock.calls
    .map(([line]) => String(line))
    .filter(line => line.startsWith('{"event":"daily_maintenance_result"'))
    .map(line => JSON.parse(line));
test("unauthenticated maintenance cannot run cleanup", async () => {
  jest.mocked(isAuthorizedCronRequest).mockReturnValue(false);
  expect((await request()).status).toBe(401);
  expect(runRetentionCleanup).not.toHaveBeenCalled();
  expect(reconcileTerminalCodHolds).not.toHaveBeenCalled();
  expect(executionRecord(stdout)).toEqual([]);
  expect(executionRecord(stderr)).toEqual([]);
});
test("a successful worker exposes retention and hold summaries", async () => {
  const response = await request();
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.results.retention.errors).toEqual([]);
  expect(body.data.results.codHolds).toEqual({ checked: 0, outcomes: {} });
  expect(executionRecord(stdout)).toEqual([
    {
      event: "daily_maintenance_result",
      level: "info",
      timestamp: expect.any(String),
      success: true,
      retention: {
        processedPolicies: 2,
        deletedRecords: 500,
        manualReview: [],
        errors: [],
      },
      codHolds: { checked: 0, outcomes: {} },
      cleanupErrors: 0,
      durationMs: expect.any(Number),
    },
  ]);
  expect(executionRecord(stderr)).toEqual([]);
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
    expect(executionRecord(stderr)).toEqual([
      expect.objectContaining({ level: "error", success: false }),
    ]);
    expect(executionRecord(stdout)).toEqual([]);
  }
);
