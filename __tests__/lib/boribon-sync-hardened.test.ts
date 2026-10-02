/** @jest-environment node */

import { PrismaClient } from "@prisma/client";
import { syncBoribonPortfolio } from "@/lib/suppliers/boribon/sync";
import { BORIBON_ID } from "@/lib/suppliers/boribon/feed";
import * as feedModule from "@/lib/suppliers/boribon/feed";

// Mock the feed fetch
jest.mock("@/lib/suppliers/boribon/feed", () => ({
  ...jest.requireActual("@/lib/suppliers/boribon/feed"),
  fetchBoribonProducts: jest.fn(),
}));

const mockFetchBoribonProducts = feedModule.fetchBoribonProducts as jest.MockedFunction<typeof feedModule.fetchBoribonProducts>;

describe("hardened Boribon sync", () => {
  let db: any;
  let mockFeed: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database with transaction support
    const mockSupplierProducts = [
      {
        id: "link1",
        supplierSku: "MODEL-001",
        productId: "prod1",
        product: { id: "prod1", stockQuantity: 10, reservedQuantity: 0 },
      },
      {
        id: "link2",
        supplierSku: "MODEL-002",
        productId: "prod2",
        product: { id: "prod2", stockQuantity: 5, reservedQuantity: 0 },
      },
      {
        id: "link3",
        supplierSku: "MODEL-003",
        productId: "prod3",
        product: { id: "prod3", stockQuantity: 8, reservedQuantity: 0 },
      },
    ];

    db = {
      $transaction: jest.fn(async (fn) => {
        const tx = {
          $executeRaw: jest.fn(async () => 1), // Mock successful product update
          supplierProduct: {
            findMany: jest.fn(async () => mockSupplierProducts),
            update: jest.fn(async () => ({})),
          },
        };
        return fn(tx);
      }),
    } as unknown as PrismaClient;

    mockFeed = {
      id: "feed1",
      supplierId: BORIBON_ID,
      sourceUrl: "https://www.boribon.ro/feed/products/test-fixture",
    };
  });

  describe("feed-level failures", () => {
    it("uses the configured private URL before opening a transaction", async () => {
      mockFetchBoribonProducts.mockRejectedValue(
        new Error("Stop before transaction")
      );
      await expect(syncBoribonPortfolio(db, mockFeed)).rejects.toThrow(
        "Feed fetch failed"
      );
      expect(mockFetchBoribonProducts).toHaveBeenCalledWith(mockFeed.sourceUrl);
      expect(db.$transaction).not.toHaveBeenCalled();
    });
    it("should not modify stock on feed timeout", async () => {
      mockFetchBoribonProducts.mockRejectedValue(
        new Error("Boribon feed HTTP timeout")
      );

      await expect(syncBoribonPortfolio(db, mockFeed)).rejects.toThrow(
        "Feed fetch failed"
      );

      // Transaction should never be called
      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("should not modify stock on HTTP error", async () => {
      mockFetchBoribonProducts.mockRejectedValue(
        new Error("Boribon feed HTTP 503")
      );

      await expect(syncBoribonPortfolio(db, mockFeed)).rejects.toThrow(
        "Feed fetch failed"
      );

      expect(db.$transaction).not.toHaveBeenCalled();
    });

    it("should not modify stock on unparseable feed", async () => {
      mockFetchBoribonProducts.mockRejectedValue(
        new Error("Invalid Boribon CSV headers or empty feed")
      );

      await expect(syncBoribonPortfolio(db, mockFeed)).rejects.toThrow(
        "Feed fetch failed"
      );

      expect(db.$transaction).not.toHaveBeenCalled();
    });
  });

  describe("per-item failures", () => {
    it("should keep old stock when one item fails validation among good items", async () => {
      mockFetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "MODEL-001", tier: "CORE", sourceId: "1", ean: "EAN1" },
          row: { id: "1" },
          price: 100,
          stock: 20,
          valid: true,
          error: null,
        },
        {
          entry: { model: "MODEL-002", tier: "CORE", sourceId: "2", ean: "EAN2" },
          row: { id: "2" },
          price: null,
          stock: 0,
          valid: false,
          error: "Missing, ambiguous or invalid supplier data for MODEL-002",
        },
        {
          entry: { model: "MODEL-003", tier: "CORE", sourceId: "3", ean: "EAN3" },
          row: { id: "3" },
          price: 150,
          stock: 15,
          valid: true,
          error: null,
        },
      ]);

      const result = await syncBoribonPortfolio(db, mockFeed);

      // Should succeed with mixed results
      expect(result.updated).toBe(2); // MODEL-001 and MODEL-003
      expect(result.failed).toBeGreaterThan(0); // MODEL-002

      // Transaction was called
      expect(db.$transaction).toHaveBeenCalled();

      // Check that we attempted to update all valid items
      const txCallback = db.$transaction.mock.calls[0][0];
      await expect(txCallback).toBeDefined();
    });

    it("should keep old stock when item is missing from feed", async () => {
      mockFetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "MODEL-001", tier: "CORE", sourceId: "1", ean: "EAN1" },
          row: { id: "1" },
          price: 100,
          stock: 20,
          valid: true,
          error: null,
        },
        // MODEL-002 missing from feed
        {
          entry: { model: "MODEL-003", tier: "CORE", sourceId: "3", ean: "EAN3" },
          row: { id: "3" },
          price: 150,
          stock: 15,
          valid: true,
          error: null,
        },
      ]);

      const result = await syncBoribonPortfolio(db, mockFeed);

      // Should update only the items present in feed
      expect(result.updated).toBe(2);
      expect(db.$transaction).toHaveBeenCalled();
    });

    it("should set stock to 0 only when feed explicitly reports stock=0", async () => {
      mockFetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "MODEL-001", tier: "CORE", sourceId: "1", ean: "EAN1" },
          row: { id: "1" },
          price: 100,
          stock: 0, // Explicit out of stock
          valid: true,
          error: null,
        },
        {
          entry: { model: "MODEL-002", tier: "CORE", sourceId: "2", ean: "EAN2" },
          row: { id: "2" },
          price: 120,
          stock: 10,
          valid: true,
          error: null,
        },
      ]);

      const result = await syncBoribonPortfolio(db, mockFeed);

      expect(result.updated).toBe(2);
      expect(db.$transaction).toHaveBeenCalled();
    });

    it("should handle identity mismatch without throwing", async () => {
      // Setup mock to return 0 changed rows (identity mismatch)
      db.$transaction = jest.fn(async (fn) => {
        const tx = {
          $executeRaw: jest.fn(async () => 0), // Identity mismatch
          supplierProduct: {
            findMany: jest.fn(async () => [
              {
                id: "link1",
                supplierSku: "MODEL-001",
                productId: "prod1",
                product: { id: "prod1", stockQuantity: 10, reservedQuantity: 0 },
              },
            ]),
            update: jest.fn(async () => ({})),
          },
        };
        return fn(tx);
      });

      mockFetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "MODEL-001", tier: "CORE", sourceId: "1", ean: "EAN1" },
          row: { id: "1" },
          price: 100,
          stock: 20,
          valid: true,
          error: null,
        },
      ]);

      // Should not throw, but track failure
      const result = await syncBoribonPortfolio(db, mockFeed);
      
      expect(result.failed).toBeGreaterThan(0);
      expect(db.$transaction).toHaveBeenCalled();
    });

    it("should keep stock for core item with EAN mismatch among valid items (Oct 1 2026 incident)", async () => {
      // Mirrors the actual incident: Boribon rotated EANs on Fischertechnik boxes
      // id 8915 F_579434 Starter-Box (CORE): feed EAN changed, portfolio.json has old EAN
      // Other items remain valid - should update normally
      
      // Track Product UPDATE calls (not savepoints/rollbacks)
      let productUpdateCount = 0;
      
      db.$transaction = jest.fn(async (fn) => {
        const mockExecuteRaw = jest.fn(async (query: any) => {
          // Check if this is a Product UPDATE (contains "Product" and "stockQuantity")
          const queryStr = query?.strings?.[0] || '';
          if (queryStr.includes('"Product"') && queryStr.includes('stockQuantity')) {
            productUpdateCount++;
            if (productUpdateCount === 1) {
              // First Product UPDATE: F_579434 identity mismatch
              return 0;
            }
            // All other Product UPDATEs: success
            return 1;
          }
          // Savepoints, rollbacks, advisory lock, SupplierProduct updates: always succeed
          return 1;
        });
        
        const tx = {
          $executeRaw: mockExecuteRaw,
          supplierProduct: {
            findMany: jest.fn(async () => [
              {
                id: "link1",
                supplierSku: "F_579434",
                productId: "prod1",
                product: { 
                  id: "prod1", 
                  stockQuantity: 5, 
                  reservedQuantity: 0,
                  barcode: "OLD_EAN_4048962577105"
                },
              },
              {
                id: "link2",
                supplierSku: "MODEL-002",
                productId: "prod2",
                product: { 
                  id: "prod2", 
                  stockQuantity: 8, 
                  reservedQuantity: 0,
                  barcode: "EAN2"
                },
              },
              {
                id: "link3",
                supplierSku: "MODEL-003",
                productId: "prod3",
                product: { 
                  id: "prod3", 
                  stockQuantity: 12, 
                  reservedQuantity: 0,
                  barcode: "EAN3"
                },
              },
            ]),
            update: jest.fn(async () => ({})),
          },
        };
        
        return fn(tx);
      });

      mockFetchBoribonProducts.mockResolvedValue([
        {
          // CORE item with EAN mismatch (supplier rotated EAN)
          entry: { model: "F_579434", tier: "CORE", sourceId: "8915", ean: "4048962577099" },
          row: { id: "8915" },
          price: 250,
          stock: 10,
          valid: true,
          error: null,
        },
        {
          // Valid item
          entry: { model: "MODEL-002", tier: "CORE", sourceId: "2", ean: "EAN2" },
          row: { id: "2" },
          price: 120,
          stock: 15,
          valid: true,
          error: null,
        },
        {
          // Valid item
          entry: { model: "MODEL-003", tier: "CORE", sourceId: "3", ean: "EAN3" },
          row: { id: "3" },
          price: 180,
          stock: 20,
          valid: true,
          error: null,
        },
      ]);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await syncBoribonPortfolio(db, mockFeed);

      // Should NOT throw or zero all stock
      // Item with EAN mismatch keeps its stock (5), others update normally
      expect(result.updated).toBe(2); // MODEL-002 and MODEL-003
      expect(result.failed).toBe(1);  // F_579434 EAN mismatch
      expect(result.error).toBeTruthy(); // Should have error summary

      // Should log clear EAN mismatch error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("EAN/identity mismatch")
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("F_579434")
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("UPSELL handling", () => {
    it("should skip uninstalled UPSELL without failing sync", async () => {
      mockFetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "MODEL-001", tier: "CORE", sourceId: "1", ean: "EAN1" },
          row: { id: "1" },
          price: 100,
          stock: 20,
          valid: true,
          error: null,
        },
        {
          entry: { model: "UPSELL-001", tier: "UPSELL", sourceId: "2", ean: "EAN2" },
          row: { id: "2" },
          price: 50,
          stock: 10,
          valid: true,
          error: null,
        },
      ]);

      // Mock supplier products - UPSELL not installed
      db.$transaction = jest.fn(async (fn) => {
        const tx = {
          $executeRaw: jest.fn(async () => 1),
          supplierProduct: {
            findMany: jest.fn(async () => [
              {
                id: "link1",
                supplierSku: "MODEL-001",
                productId: "prod1",
                product: { id: "prod1", stockQuantity: 10, reservedQuantity: 0 },
              },
              // UPSELL-001 has no productId
              {
                id: "link2",
                supplierSku: "UPSELL-001",
                productId: null,
                product: null,
              },
            ]),
            update: jest.fn(async () => ({})),
          },
        };
        return fn(tx);
      });

      const result = await syncBoribonPortfolio(db, mockFeed);

      // Should succeed, updating only installed items
      expect(result.updated).toBe(1);
      expect(db.$transaction).toHaveBeenCalled();
    });

    it("should not fail sync when UPSELL validation fails", async () => {
      mockFetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "MODEL-001", tier: "CORE", sourceId: "1", ean: "EAN1" },
          row: { id: "1" },
          price: 100,
          stock: 20,
          valid: true,
          error: null,
        },
        {
          entry: { model: "UPSELL-001", tier: "UPSELL", sourceId: "2", ean: "EAN2" },
          row: { id: "2" },
          price: null,
          stock: 0,
          valid: false,
          error: "Invalid UPSELL data",
        },
      ]);

      db.$transaction = jest.fn(async (fn) => {
        const tx = {
          $executeRaw: jest.fn(async () => 1),
          supplierProduct: {
            findMany: jest.fn(async () => [
              {
                id: "link1",
                supplierSku: "MODEL-001",
                productId: "prod1",
                product: { id: "prod1", stockQuantity: 10, reservedQuantity: 0 },
              },
              {
                id: "link2",
                supplierSku: "UPSELL-001",
                productId: "prod2",
                product: { id: "prod2", stockQuantity: 5, reservedQuantity: 0 },
              },
            ]),
            update: jest.fn(async () => ({})),
          },
        };
        return fn(tx);
      });

      const result = await syncBoribonPortfolio(db, mockFeed);

      // Should succeed with core item updated
      expect(result.updated).toBe(1);
      expect(result.failed).toBeGreaterThan(0); // UPSELL failed
    });
  });

  describe("logging and monitoring", () => {
    it("should log detailed outcomes for debugging", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      mockFetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "MODEL-001", tier: "CORE", sourceId: "1", ean: "EAN1" },
          row: { id: "1" },
          price: 100,
          stock: 20,
          valid: true,
          error: null,
        },
      ]);

      await syncBoribonPortfolio(db, mockFeed);

      // Should log summary
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[Boribon sync] Summary:")
      );

      // Should log per-item outcomes (second argument is the JSON)
      const calls = consoleSpy.mock.calls;
      const outcomesCall = calls.find(call => 
        call[0]?.includes("[Boribon sync] Per-item outcomes:")
      );
      expect(outcomesCall).toBeDefined();

      consoleSpy.mockRestore();
    });

    it("should log warnings for kept stock on validation failures", async () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      mockFetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "MODEL-001", tier: "CORE", sourceId: "1", ean: "EAN1" },
          row: { id: "1" },
          price: null,
          stock: 0,
          valid: false,
          error: "Invalid price",
        },
      ]);

      await syncBoribonPortfolio(db, mockFeed);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("failed validation, keeping stock")
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
