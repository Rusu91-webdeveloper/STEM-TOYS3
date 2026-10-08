import { NextRequest } from "next/server";

import { GET as health } from "@/app/api/admin/store-health/route";
import { GET as ready, HEAD } from "@/app/api/health/ready/route";
import { POST as review } from "@/app/api/reviews/route";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getStoreHealthReport,
  isSupplierFeedStale,
} from "@/lib/monitoring/store-health";

jest.mock("server-only", () => ({}));
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/rate-limit", () => ({ withRateLimit: (fn: unknown) => fn }));
jest.mock("@/lib/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock("next/cache", () => ({
  revalidateTag: jest.fn(),
  unstable_cache: (fn: unknown) => fn,
}));
jest.mock("@/lib/db", () => ({
  db: {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
    supplierFeed: { findMany: jest.fn() },
    order: { count: jest.fn() },
    emailLog: { count: jest.fn() },
    orderItem: { findUnique: jest.fn() },
    review: { findFirst: jest.fn(), create: jest.fn() },
  },
}));
const now = new Date("2026-10-07T12:00:00Z");
const request = () =>
  new NextRequest("http://localhost/api/reviews", {
    method: "POST",
    body: JSON.stringify({
      productId: "product-1",
      orderItemId: "item-1",
      rating: 5,
      title: "Util",
      content: "Un kit foarte interesant.",
    }),
  });
beforeEach(() => {
  jest.clearAllMocks();
  (auth as jest.Mock).mockResolvedValue({
    user: { id: "buyer", role: "ADMIN" },
  });
});

it.each([
  null,
  { user: { id: "buyer", role: "CUSTOMER" } },
  { user: { role: "ADMIN_VIEWER" } },
])("denies operational data before querying it: %#", async session => {
  (auth as jest.Mock).mockResolvedValue(session);
  expect(
    (await health(new NextRequest("http://localhost/api/admin/store-health")))
      .status
  ).toBe(403);
  expect(db.order.count).not.toHaveBeenCalled();
  expect(db.supplierFeed.findMany).not.toHaveBeenCalled();
});
it("reports partial failure as unavailable and does not leak the provider error", async () => {
  (db.supplierFeed.findMany as jest.Mock).mockResolvedValue([
    { lastSyncAt: now, pollingIntervalMinutes: 60, lastSyncStatus: "SUCCESS" },
  ]);
  (db.order.count as jest.Mock)
    .mockResolvedValueOnce(2)
    .mockResolvedValueOnce(0);
  (db.emailLog.count as jest.Mock).mockRejectedValue(
    new Error("secret provider credentials")
  );
  const report = await getStoreHealthReport(now);
  expect(report.checks.map(c => c.status)).toEqual([
    "ok",
    "attention",
    "unavailable",
    "ok",
    "manual",
  ]);
  expect(JSON.stringify(report)).not.toContain("secret provider");
});
it("uses daily cron cadence and grace for supplier staleness", () => {
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000);
  expect(
    isSupplierFeedStale(
      { lastSyncAt: hoursAgo(25), pollingIntervalMinutes: 60 },
      now
    )
  ).toBe(false);
  expect(
    isSupplierFeedStale(
      { lastSyncAt: hoursAgo(31), pollingIntervalMinutes: 60 },
      now
    )
  ).toBe(true);
  expect(
    isSupplierFeedStale({ lastSyncAt: null, pollingIntervalMinutes: 60 }, now)
  ).toBe(true);
});
it("uses shared database connections for repeated readiness probes", async () => {
  process.env.DATABASE_URL = "postgresql://localhost/local";
  process.env.NEXTAUTH_SECRET = "test-only";
  (db.$queryRaw as jest.Mock).mockResolvedValue([{ value: 1 }]);
  expect((await ready()).status).toBe(200);
  expect((await HEAD()).status).toBe(200);
  expect(db.$disconnect).not.toHaveBeenCalled();
});
it("fails readiness without revealing raw connection errors", async () => {
  (db.$queryRaw as jest.Mock).mockRejectedValue(
    new Error("postgresql://user:password@private")
  );
  const response = await ready();
  expect(response.status).toBe(503);
  expect(JSON.stringify(await response.json())).not.toContain("password");
});
it("bounds readiness when the database does not respond", async () => {
  jest.useFakeTimers();
  (db.$queryRaw as jest.Mock).mockReturnValue(new Promise(() => {}));
  const response = ready();
  await jest.advanceTimersByTimeAsync(2001);
  expect((await response).status).toBe(503);
  jest.useRealTimers();
});
it.each([
  { productId: "other", order: { userId: "buyer", status: "DELIVERED" } },
  { productId: "product-1", order: { userId: "other", status: "DELIVERED" } },
  { productId: "product-1", order: { userId: "buyer", status: "PROCESSING" } },
])("denies review spoofing or an undelivered purchase: %#", async item => {
  (db.orderItem.findUnique as jest.Mock).mockResolvedValue(item);
  const response = await review(request());
  expect(response.status).toBe(403);
  expect(db.review.create).not.toHaveBeenCalled();
});
it("accepts only the delivered matching purchase and refreshes public reviews", async () => {
  (db.orderItem.findUnique as jest.Mock).mockResolvedValue({
    productId: "product-1",
    order: { userId: "buyer", status: "DELIVERED" },
  });
  (db.review.findFirst as jest.Mock).mockResolvedValue(null);
  (db.review.create as jest.Mock).mockResolvedValue({
    id: "review-1",
    productId: "product-1",
  });
  expect((await review(request())).status).toBe(201);
});
