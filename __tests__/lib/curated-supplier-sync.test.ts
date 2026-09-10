/** @jest-environment node */
jest.mock("@/lib/db", () => ({
  db: {
    supplierFeed: { findMany: jest.fn(), update: jest.fn() },
    supplierSyncJob: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));
jest.mock("@/lib/cache-smart-invalidation", () => ({
  invalidateProductCaches: jest.fn(),
}));
jest.mock("@/lib/bundles/recompute", () => ({
  recomputeBundles: jest.fn(async () => ({})),
}));
jest.mock("@/lib/suppliers/adapters", () => ({
  createBaseLinkerCsvAdapter: jest.fn(() => ({ fetchProducts: jest.fn() })),
}));
jest.mock("@/lib/suppliers/boribon/sync", () => ({
  syncBoribonPortfolio: jest.fn(),
  closeBoribonStock: jest.fn(),
}));
jest.mock("@/lib/suppliers/kidstory/sync", () => ({
  syncKidstoryPortfolio: jest.fn(),
  closeKidstoryStock: jest.fn(),
}));
import { runSupplierFeedSync } from "@/lib/suppliers/sync";
import { BORIBON_ID, BORIBON_SYNC_MODE } from "@/lib/suppliers/boribon/feed";
import { KIDSTORY_ID, KIDSTORY_SYNC_MODE } from "@/lib/suppliers/kidstory/feed";
const { db } = require("@/lib/db");
const boribon = require("@/lib/suppliers/boribon/sync");
const kidstory = require("@/lib/suppliers/kidstory/sync");
beforeEach(() => {
  jest.clearAllMocks();
  db.supplierFeed.findMany.mockResolvedValue([
    {
      id: "boribon",
      supplierId: BORIBON_ID,
      type: "CSV",
      mapping: { syncMode: BORIBON_SYNC_MODE },
    },
    {
      id: "kidstory",
      supplierId: KIDSTORY_ID,
      type: "CSV",
      mapping: { syncMode: KIDSTORY_SYNC_MODE },
    },
  ]);
  db.supplierSyncJob.findFirst.mockResolvedValue(null);
  db.supplierSyncJob.create.mockResolvedValue({ id: "job" });
  boribon.syncBoribonPortfolio.mockResolvedValue({
    imported: 0,
    updated: 63,
    failed: 0,
  });
  kidstory.syncKidstoryPortfolio.mockResolvedValue({
    imported: 0,
    updated: 25,
    failed: 0,
  });
});
it("refreshes both active suppliers in the same invocation", async () => {
  const result = await runSupplierFeedSync();
  expect(result.map(p => [p.supplierId, p.status, p.updated])).toEqual([
    [BORIBON_ID, "SUCCESS", 63],
    [KIDSTORY_ID, "SUCCESS", 25],
  ]);
  expect(db.supplierFeed.findMany).toHaveBeenCalledWith({
    where: { isActive: true },
  });
});
it("still refreshes Kidstory when Boribon fails", async () => {
  boribon.syncBoribonPortfolio.mockRejectedValueOnce(new Error("HTTP 503"));
  const result = await runSupplierFeedSync();
  expect(result.map(p => p.status)).toEqual(["FAILED", "SUCCESS"]);
  expect(boribon.closeBoribonStock).toHaveBeenCalled();
  expect(kidstory.syncKidstoryPortfolio).toHaveBeenCalled();
});
it("closes Kidstory availability on a failed refresh", async () => {
  kidstory.syncKidstoryPortfolio.mockRejectedValueOnce(new Error("HTTP 503"));
  const result = await runSupplierFeedSync();
  expect(result.map(p => p.status)).toEqual(["SUCCESS", "FAILED"]);
  expect(kidstory.closeKidstoryStock).toHaveBeenCalled();
});
