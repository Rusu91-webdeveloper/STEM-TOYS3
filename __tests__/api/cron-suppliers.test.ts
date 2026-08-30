/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET } from "@/app/api/cron/suppliers/route";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { runSupplierFeedSync } from "@/lib/suppliers/sync";

jest.mock("@/lib/cron-auth", () => ({
  isAuthorizedCronRequest: jest.fn(),
}));

jest.mock("@/lib/suppliers/sync", () => ({
  runSupplierFeedSync: jest.fn(),
}));

const mockAuthorized = isAuthorizedCronRequest as jest.MockedFunction<
  typeof isAuthorizedCronRequest
>;
const mockRunSync = runSupplierFeedSync as jest.MockedFunction<
  typeof runSupplierFeedSync
>;

function request() {
  return new NextRequest("http://localhost/api/cron/suppliers", {
    headers: { authorization: "Bearer test" },
  });
}

function result(overrides: Record<string, unknown> = {}) {
  return {
    feedId: "feed_1",
    supplierId: "supplier_1",
    status: "SUCCESS",
    imported: 0,
    updated: 1,
    failed: 0,
    zeroed: 0,
    ...overrides,
  } as never;
}

describe("GET /api/cron/suppliers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthorized.mockReturnValue(true);
  });

  it("rejects unauthorized requests", async () => {
    mockAuthorized.mockReturnValue(false);

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(mockRunSync).not.toHaveBeenCalled();
  });

  it("returns 503 when no active feeds match", async () => {
    mockRunSync.mockResolvedValue([]);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.success).toBe(false);
  });

  it("returns 500 when a feed fails", async () => {
    mockRunSync.mockResolvedValue([
      result({ status: "FAILED", updated: 0, error: "source unavailable" }),
    ]);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.success).toBe(false);
  });

  it("returns 500 when any item fails", async () => {
    mockRunSync.mockResolvedValue([result({ failed: 1 })]);

    const response = await GET(request());

    expect(response.status).toBe(500);
  });

  it("returns a bounded success summary", async () => {
    mockRunSync.mockResolvedValue([
      result({ imported: 1, updated: 2, zeroed: 3 }),
    ]);

    const response = await GET(request());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.summary).toEqual({
      imported: 1,
      updated: 2,
      failed: 0,
      zeroed: 3,
    });
  });
});
