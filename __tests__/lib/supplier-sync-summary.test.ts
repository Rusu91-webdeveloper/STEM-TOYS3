import { summarizeSupplierSyncResults } from "@/lib/suppliers/sync-summary";

describe("supplier sync summary", () => {
  it("counts feed and item failures while totaling mutations", () => {
    const summary = summarizeSupplierSyncResults([
      {
        feedId: "one",
        supplierId: "supplier",
        status: "SUCCESS",
        imported: 1,
        updated: 2,
        failed: 0,
        zeroed: 3,
      } as never,
      {
        feedId: "two",
        supplierId: "supplier",
        status: "SUCCESS",
        imported: 0,
        updated: 4,
        failed: 1,
        zeroed: 0,
      } as never,
    ]);

    expect(summary).toEqual({
      totals: { imported: 1, updated: 6, failed: 1, zeroed: 3 },
      failedFeeds: 1,
    });
  });
});
