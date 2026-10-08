import { NextRequest } from "next/server";

import { GET } from "@/app/api/admin/dashboard/route";
import { getOwnerDashboard } from "@/lib/admin/dashboard-service";
import { auth } from "@/lib/auth";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/admin/dashboard-service", () => ({
  getOwnerDashboard: jest.fn(),
}));
jest.mock("@/lib/rate-limit", () => ({
  withRateLimit: (handler: unknown) => handler,
}));

const endpoint = "http://localhost:3000/api/admin/dashboard";
describe("owner dashboard API", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (auth as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
    (getOwnerDashboard as jest.Mock).mockResolvedValue({
      summary: { paidOrderValue: 200 },
    });
  });
  it.each([
    null,
    {},
    { user: {} },
    { user: { role: "CUSTOMER" } },
    { user: { role: "SUPPLIER" } },
    { user: { role: "VISITOR" } },
  ])(
    "denies unauthorized sessions before retrieving data: %j",
    async session => {
      (auth as jest.Mock).mockResolvedValue(session);
      const response = await GET(new NextRequest(endpoint));
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(getOwnerDashboard).not.toHaveBeenCalled();
    }
  );
  it.each(["0", "-1", "91", "1.5", "30oops", "", "Infinity"])(
    "rejects invalid period %s",
    async period => {
      const response = await GET(
        new NextRequest(`${endpoint}?period=${period}`)
      );
      expect(response.status).toBe(400);
      expect(getOwnerDashboard).not.toHaveBeenCalled();
    }
  );
  it.each([1, 7, 30, 90])(
    "loads the selected period %s without caching business data",
    async period => {
      const response = await GET(
        new NextRequest(`${endpoint}?period=${period}`)
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(getOwnerDashboard).toHaveBeenCalledWith(period);
      expect(await response.json()).toEqual({
        summary: { paidOrderValue: 200 },
      });
    }
  );
  it("defaults to 30 days", async () => {
    await GET(new NextRequest(endpoint));
    expect(getOwnerDashboard).toHaveBeenCalledWith(30);
  });
  it("reports a failed database read without returning invented zero metrics", async () => {
    (getOwnerDashboard as jest.Mock).mockRejectedValue(
      new Error("Database unavailable")
    );
    const response = await GET(new NextRequest(endpoint));
    expect(response.status).toBe(500);
    expect(await response.json()).not.toHaveProperty("summary");
  });
  it("fails closed when session lookup throws", async () => {
    (auth as jest.Mock).mockRejectedValue(new Error("Auth unavailable"));
    const response = await GET(new NextRequest(endpoint));
    expect(response.status).toBe(500);
    expect(getOwnerDashboard).not.toHaveBeenCalled();
  });
});
