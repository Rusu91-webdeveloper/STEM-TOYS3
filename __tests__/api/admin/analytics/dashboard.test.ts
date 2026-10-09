import { GET as advanced } from "@/app/api/admin/analytics/advanced/route";
import { GET } from "@/app/api/admin/analytics/dashboard/route";
import { GET as supplierPerformance } from "@/app/api/admin/analytics/supplier-performance/route";
import { POST as optimizeImages } from "@/app/api/admin/images/optimize/route";
import { POST as sendSupplierInvoice } from "@/app/api/admin/supplier-invoices/[id]/send/route";
import { auth } from "@/lib/auth";
jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
beforeEach(() => jest.clearAllMocks());
it.each([null, { user: { role: "CUSTOMER" } }, { user: { role: "VISITOR" } }])(
  "denies simulated legacy report reads for %j",
  async session => {
    (auth as jest.Mock).mockResolvedValue(session);
    for (const handler of [
      GET,
      advanced,
      supplierPerformance,
      optimizeImages,
      sendSupplierInvoice,
    ]) {
      const response = await handler();
      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
  }
);
it("does not manufacture figures for an admin when no verified source exists", async () => {
  (auth as jest.Mock).mockResolvedValue({ user: { role: "ADMIN" } });
  for (const handler of [
    GET,
    advanced,
    supplierPerformance,
    optimizeImages,
    sendSupplierInvoice,
  ]) {
    const response = await handler();
    expect(response.status).toBe(503);
    const result = await response.json();
    expect(result.error).toBeTruthy();
    expect(result.salesData).toBeUndefined();
    expect(result.metrics).toBeUndefined();
    expect(result.success).not.toBe(true);
  }
});
