import { NextRequest } from "next/server";

import {
  GET as paymentsGET,
  POST as paymentsPOST,
} from "@/app/api/admin/payment-rollout/route";
import {
  GET as seoGET,
  POST as seoPOST,
} from "@/app/api/admin/seo/google-search-console/route";
import { POST as collectPOST } from "@/app/api/admin/seo/save-analytics/route";
import { auth } from "@/lib/auth";
import { getRolloutStatistics } from "@/lib/middleware/payment-provider";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/admin/settings-service", () => ({
  SettingsConflict: class extends Error {},
  SettingsMissingBackup: class extends Error {},
}));
jest.mock("@/lib/middleware/payment-provider", () => ({
  getRolloutStatistics: jest.fn(),
}));
const call = (method = "GET") =>
  new NextRequest("http://localhost:3000/api/admin/legacy", { method });

describe("legacy admin boundaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({
      user: { role: "ADMIN", id: "admin" },
    });
  });
  it.each([
    null,
    { user: { role: "VISITOR" } },
    { user: { role: "CUSTOMER" } },
    { user: { role: "SUPPLIER" } },
  ])("denies private configuration/report endpoints for %j", async session => {
    (auth as jest.Mock).mockResolvedValue(session);
    for (const [handler, method] of [
      [seoGET, "GET"],
      [seoPOST, "POST"],
      [collectPOST, "POST"],
      [paymentsGET, "GET"],
      [paymentsPOST, "POST"],
    ] as const) {
      const result = await handler(call(method));
      expect(result.status).toBe(403);
      expect(result.headers.get("cache-control")).toBe("private, no-store");
    }
    expect(getRolloutStatistics).not.toHaveBeenCalled();
  });
  it("does not return generated SEO figures or success for an unpersisted payment edit", async () => {
    for (const [handler, method] of [
      [seoGET, "GET"],
      [seoPOST, "POST"],
      [collectPOST, "POST"],
      [paymentsPOST, "POST"],
    ] as const) {
      const result = await handler(call(method));
      expect(result.status).toBe(503);
      const body = await result.json();
      expect(body.error).toBeTruthy();
      expect(body.data).toBeUndefined();
      expect(body.success).toBeUndefined();
    }
  });
  it("fails closed if authentication lookup fails", async () => {
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    (auth as jest.Mock).mockRejectedValue(new Error("Auth unavailable"));
    for (const handler of [seoGET, paymentsGET]) {
      const result = await handler(call());
      expect(result.status).toBe(500);
      expect((await result.json()).data).toBeUndefined();
    }
    consoleError.mockRestore();
  });
});
