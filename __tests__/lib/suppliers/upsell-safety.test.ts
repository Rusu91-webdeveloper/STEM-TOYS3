/**
 * Tests for UPSELL safety rules in supplier syncs
 *
 * Ensures that UPSELL products (add-ons) that are not installed or fail validation
 * do NOT trigger stock closure for the entire supplier catalog.
 *
 * This prevents a scenario where:
 * 1. An UPSELL product is added to portfolio.json but not installed in DB
 * 2. Sync runs and encounters the uninstalled UPSELL
 * 3. Without safety: sync throws → closes ALL stock for that supplier
 * 4. With safety: sync skips the UPSELL with a warning → continues normally
 *
 * Context: PR #31 added this safety for Boribon, this PR adds it for Kidstory.
 */

import { PrismaClient } from "@prisma/client";

import { syncBoribonPortfolio } from "@/lib/suppliers/boribon/sync";
import { syncKidstoryPortfolio } from "@/lib/suppliers/kidstory/sync";

// Mock the feed fetch functions
jest.mock("@/lib/suppliers/boribon/feed", () => {
  const actual = jest.requireActual("@/lib/suppliers/boribon/feed");
  return {
    ...actual,
    fetchBoribonProducts: jest.fn(),
  };
});

jest.mock("@/lib/suppliers/kidstory/feed", () => {
  const actual = jest.requireActual("@/lib/suppliers/kidstory/feed");
  return {
    ...actual,
    fetchKidstoryProducts: jest.fn(),
  };
});

const { fetchBoribonProducts } = require("@/lib/suppliers/boribon/feed");
const { fetchKidstoryProducts } = require("@/lib/suppliers/kidstory/feed");

describe("UPSELL Safety Rules", () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Boribon UPSELL Safety", () => {
    it("skips uninstalled UPSELL entries without throwing", async () => {
      // Mock feed with mix of core and UPSELL products
      fetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "G_7449", ean: "4716503074498", tier: "HERO" },
          row: {
            id: "8397",
            model: "G_7449",
            sku: "4716503074498",
            price_b2c: "191",
            quantity: "52",
          },
          price: 191,
          stock: 52,
          valid: true,
          error: null,
        },
        {
          entry: { model: "K_550205", ean: "814743017900", tier: "UPSELL" },
          row: {
            id: "4409",
            model: "K_550205",
            sku: "814743017900",
            price_b2c: "103",
            quantity: "6",
          },
          price: 103,
          stock: 6,
          valid: true,
          error: null,
        },
      ]);

      // Mock DB: core product installed, UPSELL not installed
      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        supplierProduct: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: "link-1",
              supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
              supplierSku: "G_7449",
              productId: "prod-1",
            },
            // K_550205 NOT found → uninstalled UPSELL
          ]),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      const mockPrisma = {
        $transaction: jest.fn((fn: any) => fn(mockTx)),
      } as any;

      const feed = {
        id: "feed-1",
        supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
      };

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Should NOT throw, should skip UPSELL with warning
      const result = await syncBoribonPortfolio(mockPrisma, feed);

      expect(result.updated).toBe(1); // Only core product updated
      expect(result.failed).toBe(0); // UPSELL skipped, not failed
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "[Boribon sync] Skipping uninstalled UPSELL: K_550205"
        )
      );

      consoleWarnSpy.mockRestore();
    });

    it("throws when core (non-UPSELL) product is uninstalled", async () => {
      fetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "G_7449", ean: "4716503074498", tier: "HERO" },
          row: {
            id: "8397",
            model: "G_7449",
            sku: "4716503074498",
            price_b2c: "191",
            quantity: "52",
          },
          price: 191,
          stock: 52,
          valid: true,
          error: null,
        },
      ]);

      const mockTx = {
        $executeRaw: jest.fn(),
        supplierProduct: {
          findMany: jest.fn().mockResolvedValue([]),
          // Core product G_7449 NOT found → should throw
        },
      };

      const mockPrisma = {
        $transaction: jest.fn((fn: any) => fn(mockTx)),
      } as any;

      const feed = {
        id: "feed-1",
        supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
      };

      await expect(syncBoribonPortfolio(mockPrisma, feed)).rejects.toThrow(
        "Portfolio is not installed: G_7449"
      );
    });

    it("skips invalid UPSELL entries without closing stock", async () => {
      fetchBoribonProducts.mockResolvedValue([
        {
          entry: { model: "G_7449", ean: "4716503074498", tier: "HERO" },
          row: {
            id: "8397",
            model: "G_7449",
            sku: "4716503074498",
            price_b2c: "191",
            quantity: "52",
          },
          price: 191,
          stock: 52,
          valid: true,
          error: null,
        },
        {
          entry: { model: "K_550205", ean: "814743017900", tier: "UPSELL" },
          row: {
            id: "4409",
            model: "K_550205",
            sku: "814743017900",
            price_b2c: "0",
            quantity: "0",
          },
          price: null,
          stock: 0,
          valid: false,
          error: "Invalid price or out of stock",
        },
      ]);

      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        supplierProduct: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: "link-1",
              supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
              supplierSku: "G_7449",
              productId: "prod-1",
            },
            {
              id: "link-2",
              supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
              supplierSku: "K_550205",
              productId: "prod-2",
            },
          ]),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      const mockPrisma = {
        $transaction: jest.fn((fn: any) => fn(mockTx)),
      } as any;

      const feed = {
        id: "feed-1",
        supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
      };

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Should succeed, with 1 failed UPSELL
      const result = await syncBoribonPortfolio(mockPrisma, feed);

      expect(result.updated).toBe(1); // Core product updated
      expect(result.failed).toBe(1); // UPSELL failed but didn't close stock
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("1 UPSELL items failed validation"),
        expect.any(String)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Kidstory UPSELL Safety", () => {
    it("skips uninstalled UPSELL entries without throwing", async () => {
      fetchKidstoryProducts.mockResolvedValue([
        {
          entry: {
            sourceId: "24630",
            sku: "F4541ML",
            ean: "810074274432",
            role: "HERO",
          },
          row: {
            id: "24630",
            sku: "F4541ML",
            ean: "810074274432",
            name: "Air Toobz Set",
            description: "Air tubes",
            base_price: "300",
            currency: "RON",
            stock_status: "1",
            stock_status_string: "instock",
            file: "https://kidstory.ro/image1.jpg",
          },
          valid: true,
          retailPrice: 300,
          available: true,
          quantity: null,
          purchaseCost: null,
          error: null,
        },
        {
          entry: {
            sourceId: "28478",
            sku: "F5601ML",
            ean: "810074278355",
            role: "UPSELL",
          },
          row: {
            id: "28478",
            sku: "F5601ML",
            ean: "810074278355",
            name: "Air Toobz Accessory",
            description: "Accessory pack",
            base_price: "75",
            currency: "RON",
            stock_status: "1",
            stock_status_string: "instock",
            file: "https://kidstory.ro/image2.jpg",
          },
          valid: true,
          retailPrice: 75,
          available: true,
          quantity: null,
          purchaseCost: null,
          error: null,
        },
      ]);

      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        supplierProduct: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn((args: any) => {
            const sku = args.where.supplierId_supplierSku.supplierSku;
            if (sku === "F4541ML") {
              return Promise.resolve({
                id: "link-1",
                productId: "prod-1",
              });
            }
            // F5601ML NOT found → uninstalled UPSELL
            return Promise.resolve(null);
          }),
        },
        product: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const mockPrisma = {
        $transaction: jest.fn((fn: any) => fn(mockTx)),
      } as any;

      const feed = {
        id: "feed-1",
        supplierId: "26f5418c-965d-4630-994c-b51947cdec04",
        sourceUrl: "https://kidstory.ro/feed.csv",
      };

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Should NOT throw, should skip UPSELL with warning
      const result = await syncKidstoryPortfolio(mockPrisma, feed);

      expect(result.updated).toBe(1); // Only core product updated
      expect(result.failed).toBe(0); // UPSELL skipped, not failed
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "[Kidstory sync] Skipping uninstalled UPSELL: F5601ML"
        )
      );

      consoleWarnSpy.mockRestore();
    });

    it("throws when core (non-UPSELL) product is uninstalled", async () => {
      fetchKidstoryProducts.mockResolvedValue([
        {
          entry: {
            sourceId: "24630",
            sku: "F4541ML",
            ean: "810074274432",
            role: "HERO",
          },
          row: {
            id: "24630",
            sku: "F4541ML",
            ean: "810074274432",
            name: "Air Toobz Set",
            description: "Air tubes",
            base_price: "300",
            currency: "RON",
            stock_status: "1",
            stock_status_string: "instock",
            file: "https://kidstory.ro/image1.jpg",
          },
          valid: true,
          retailPrice: 300,
          available: true,
          quantity: null,
          purchaseCost: null,
          error: null,
        },
      ]);

      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        supplierProduct: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn().mockResolvedValue(null),
          // Core product NOT found → should throw
        },
      };

      const mockPrisma = {
        $transaction: jest.fn((fn: any) => fn(mockTx)),
      } as any;

      const feed = {
        id: "feed-1",
        supplierId: "26f5418c-965d-4630-994c-b51947cdec04",
        sourceUrl: "https://kidstory.ro/feed.csv",
      };

      await expect(syncKidstoryPortfolio(mockPrisma, feed)).rejects.toThrow(
        "Portfolio not installed: F4541ML"
      );
    });

    it("skips invalid UPSELL entries without closing availability", async () => {
      fetchKidstoryProducts.mockResolvedValue([
        {
          entry: {
            sourceId: "24630",
            sku: "F4541ML",
            ean: "810074274432",
            role: "HERO",
          },
          row: {
            id: "24630",
            sku: "F4541ML",
            ean: "810074274432",
            name: "Air Toobz Set",
            description: "Air tubes",
            base_price: "300",
            currency: "RON",
            stock_status: "1",
            stock_status_string: "instock",
            file: "https://kidstory.ro/image1.jpg",
          },
          valid: true,
          retailPrice: 300,
          available: true,
          quantity: null,
          purchaseCost: null,
          error: null,
        },
        {
          entry: {
            sourceId: "28478",
            sku: "F5601ML",
            ean: "810074278355",
            role: "UPSELL",
          },
          row: {
            id: "28478",
            sku: "F5601ML",
            ean: "810074278355",
            name: "Air Toobz Accessory",
            description: "Accessory pack",
            base_price: "invalid",
            currency: "RON",
            stock_status: "0",
            stock_status_string: "outofstock",
            file: "",
          },
          valid: false,
          retailPrice: null,
          available: false,
          quantity: null,
          purchaseCost: null,
          error: "Invalid price or missing data",
        },
      ]);

      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        supplierProduct: {
          update: jest.fn().mockResolvedValue({}),
          findUnique: jest.fn((args: any) => {
            const sku = args.where.supplierId_supplierSku.supplierSku;
            return Promise.resolve({
              id: `link-${sku}`,
              productId: `prod-${sku}`,
            });
          }),
          update: jest.fn().mockResolvedValue({}),
        },
        product: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const mockPrisma = {
        $transaction: jest.fn((fn: any) => fn(mockTx)),
      } as any;

      const feed = {
        id: "feed-1",
        supplierId: "26f5418c-965d-4630-994c-b51947cdec04",
        sourceUrl: "https://kidstory.ro/feed.csv",
      };

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      // Should succeed, with 1 failed UPSELL
      const result = await syncKidstoryPortfolio(mockPrisma, feed);

      expect(result.updated).toBe(1); // Core product updated
      expect(result.failed).toBe(1); // UPSELL failed but didn't close stock
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("1 UPSELL items failed validation"),
        expect.any(String)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Stock Closure Prevention", () => {
    it("prevents cascade failure when multiple UPSELL products are uninstalled", async () => {
      // Scenario: Portfolio has 10 HERO + 5 UPSELL, but 3 UPSELL are not installed yet.
      // Without safety: sync throws → closes ALL stock
      // With safety: sync skips 3 UPSELL → updates 10 HERO successfully

      fetchBoribonProducts.mockResolvedValue([
        // 2 HERO products (installed)
        {
          entry: { model: "G_7449", ean: "4716503074498", tier: "HERO" },
          price: 191,
          stock: 52,
          valid: true,
          error: null,
        },
        {
          entry: { model: "G_7076", ean: "4716503070766", tier: "HERO" },
          price: 150,
          stock: 30,
          valid: true,
          error: null,
        },
        // 3 UPSELL products (not installed)
        {
          entry: { model: "K_550205", ean: "814743017900", tier: "UPSELL" },
          price: 103,
          stock: 6,
          valid: true,
          error: null,
        },
        {
          entry: { model: "CC-1026", ean: "6152121148100", tier: "UPSELL" },
          price: 126,
          stock: 30,
          valid: true,
          error: null,
        },
        {
          entry: { model: "DJ05641", ean: "3070900056411", tier: "UPSELL" },
          price: 212,
          stock: 5,
          valid: true,
          error: null,
        },
      ]);

      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(1),
        supplierProduct: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: "link-1",
              supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
              supplierSku: "G_7449",
              productId: "prod-1",
            },
            {
              id: "link-2",
              supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
              supplierSku: "G_7076",
              productId: "prod-2",
            },
            // UPSELL products NOT found
          ]),
          update: jest.fn().mockResolvedValue({}),
        },
      };

      const mockPrisma = {
        $transaction: jest.fn((fn: any) => fn(mockTx)),
      } as any;

      const feed = {
        id: "feed-1",
        supplierId: "ee75eea8-9f64-4076-96a2-52f5d6926c14",
      };

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await syncBoribonPortfolio(mockPrisma, feed);

      // Sync succeeds, updates core products, skips uninstalled UPSELL
      expect(result.updated).toBe(2); // Both HERO products updated
      expect(result.failed).toBe(0); // UPSELL skipped, not failed
      expect(consoleWarnSpy).toHaveBeenCalledTimes(3); // 3 warnings for 3 uninstalled UPSELL

      consoleWarnSpy.mockRestore();
    });
  });
});
