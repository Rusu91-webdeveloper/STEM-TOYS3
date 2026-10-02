/** @jest-environment node */

import { NextRequest } from "next/server";

import { GET, POST } from "@/app/api/admin/analytics/route";
import { auth } from "@/lib/auth";
import {
  generateAnalyticsReport,
  getAnalyticsData,
  getRealTimeAnalytics,
} from "@/lib/utils/analytics";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/utils/analytics", () => ({
  generateAnalyticsReport: jest.fn(),
  getAnalyticsData: jest.fn(),
  getRealTimeAnalytics: jest.fn(),
}));

const mockAuth = auth as jest.Mock;
const mockReport = generateAnalyticsReport as jest.Mock;
const mockAnalytics = getAnalyticsData as jest.Mock;
const mockRealtime = getRealTimeAnalytics as jest.Mock;
const endpoint = "http://localhost:3000/api/admin/analytics";

function expectNoAnalyticsAccess() {
  expect(mockAnalytics).not.toHaveBeenCalled();
  expect(mockRealtime).not.toHaveBeenCalled();
  expect(mockReport).not.toHaveBeenCalled();
}

describe("/api/admin/analytics authorization", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockAnalytics.mockResolvedValue({ overview: { totalOrders: 3 } });
    mockRealtime.mockResolvedValue({ activeUsers: 2 });
    mockReport.mockResolvedValue({ title: "Sales report" });
  });

  const deniedSessions = [
    ["anonymous", null],
    ["session without user", {}],
    ["user without role", { user: { id: "user-1" } }],
    ["customer", { user: { id: "user-1", role: "CUSTOMER" } }],
    ["supplier", { user: { id: "user-1", role: "SUPPLIER" } }],
    ["visitor", { user: { id: "user-1", role: "VISITOR" } }],
  ] as const;

  describe.each(deniedSessions)("denies %s", (_label, session) => {
    it.each(["full", "realtime", "report"])(
      "denies GET type=%s before retrieving analytics",
      async type => {
        mockAuth.mockResolvedValue(session);
        const response = await GET(
          new NextRequest(`${endpoint}?type=${type}&reportType=sales`)
        );

        expect(response.status).toBe(403);
        expect(mockAuth).toHaveBeenCalledTimes(1);
        expect(response.headers.get("cache-control")).toBe("private, no-store");
        expect(await response.json()).toEqual({
          error: "Unauthorized. Admin access required.",
        });
        expectNoAnalyticsAccess();
      }
    );

    it("denies POST before parsing the body or generating a report", async () => {
      mockAuth.mockResolvedValue(session);
      const request = new NextRequest(endpoint, {
        method: "POST",
        body: "invalid JSON",
      });
      const parseBody = jest.spyOn(request, "json");

      const response = await POST(request);

      expect(response.status).toBe(403);
      expect(mockAuth).toHaveBeenCalledTimes(1);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(await response.json()).toEqual({
        error: "Unauthorized. Admin access required.",
      });
      expect(parseBody).not.toHaveBeenCalled();
      expectNoAnalyticsAccess();
    });
  });

  describe("authenticated ADMIN", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "admin-1", role: "ADMIN" } });
    });

    it("preserves the default full analytics response", async () => {
      const response = await GET(new NextRequest(endpoint));

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(await response.json()).toEqual({
        success: true,
        data: { overview: { totalOrders: 3 } },
        timeRange: "30d",
        type: "full",
        generatedAt: expect.any(String),
      });
      expect(mockAnalytics).toHaveBeenCalledWith("30d");
      expect(mockRealtime).not.toHaveBeenCalled();
      expect(mockReport).not.toHaveBeenCalled();
    });

    it("preserves realtime analytics", async () => {
      const response = await GET(
        new NextRequest(`${endpoint}?type=realtime&timeRange=7d`)
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        success: true,
        data: { activeUsers: 2 },
        timeRange: "7d",
        type: "realtime",
      });
      expect(mockRealtime).toHaveBeenCalledTimes(1);
      expect(mockAnalytics).not.toHaveBeenCalled();
      expect(mockReport).not.toHaveBeenCalled();
    });

    it("preserves GET report generation and its arguments", async () => {
      const response = await GET(
        new NextRequest(`${endpoint}?type=report&timeRange=7d&reportType=sales`)
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({
        success: true,
        data: { title: "Sales report" },
        timeRange: "7d",
        type: "report",
      });
      expect(mockReport).toHaveBeenCalledWith("7d", "sales");
      expect(mockAnalytics).not.toHaveBeenCalled();
      expect(mockRealtime).not.toHaveBeenCalled();
    });

    it("preserves POST report generation and its default time range", async () => {
      const response = await POST(
        new NextRequest(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reportType: "sales" }),
        })
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(await response.json()).toEqual({
        success: true,
        report: { title: "Sales report" },
        generatedAt: expect.any(String),
      });
      expect(mockReport).toHaveBeenCalledWith("30d", "sales");
      expect(mockAnalytics).not.toHaveBeenCalled();
      expect(mockRealtime).not.toHaveBeenCalled();
    });

    it.each(["GET", "POST"])(
      "preserves missing report-type validation for %s",
      async method => {
        const response =
          method === "GET"
            ? await GET(new NextRequest(`${endpoint}?type=report`))
            : await POST(
                new NextRequest(endpoint, { method: "POST", body: "{}" })
              );

        expect(response.status).toBe(400);
        expectNoAnalyticsAccess();
      }
    );
  });

  it.each(["GET", "POST"])(
    "does not retrieve analytics when authentication fails for %s",
    async method => {
      mockAuth.mockRejectedValue(new Error("Session lookup failed"));
      const logError = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      try {
        const request = new NextRequest(endpoint, { method });
        const response = await (method === "GET"
          ? GET(request)
          : POST(request));

        expect(response.status).toBe(500);
        expect(mockAuth).toHaveBeenCalledTimes(1);
        expectNoAnalyticsAccess();
      } finally {
        logError.mockRestore();
      }
    }
  );
});
