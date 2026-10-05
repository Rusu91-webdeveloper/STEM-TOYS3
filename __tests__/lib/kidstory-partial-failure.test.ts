/**
 * Tests for Kidstory partial failure resilience
 *
 * Context: On 2026-10-05, MP-250 had "notinstock" instead of "outofstock"
 * which caused validation failure. Before this fix, one core product failing
 * validation would throw an error → closeKidstoryStock → all ~28 products zeroed.
 *
 * After fix: Failed products are marked ERROR with stock=0 individually,
 * but the rest of the catalog continues to sync normally.
 */

import { PrismaClient } from "@prisma/client";

import { syncKidstoryPortfolio } from "@/lib/suppliers/kidstory/sync";

jest.mock("@/lib/suppliers/kidstory/feed", () => {
  const actual = jest.requireActual("@/lib/suppliers/kidstory/feed");
  return {
    ...actual,
    fetchKidstoryProducts: jest.fn(),
  };
});

const { fetchKidstoryProducts } = require("@/lib/suppliers/kidstory/feed");

describe("Kidstory Partial Failure Resilience", () => {
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

  it("handles one core product validation failure without closing entire catalog", async () => {
    // Critical fix: On 2026-10-05, MP-250 had "notinstock" instead of "outofstock"
    // Before fix: validation failed → threw error → closeKidstoryStock → all 28 products zeroed
    // After fix: failed product marked ERROR with stock=0, rest of catalog syncs normally

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
          sourceId: "20825",
          sku: "MP-250",
          ean: "750668013040",
          role: "CORE",
        },
        row: {
          id: "20825",
          sku: "MP-250",
          ean: "750668013040",
          name: "MicroFlip",
          description: "Microscope",
          base_price: "invalid-price",
          currency: "RON",
          stock_status: "0",
          stock_status_string: "notinstock",
          file: "https://kidstory.ro/image3.jpg",
        },
        valid: false,
        retailPrice: null,
        available: false,
        quantity: null,
        purchaseCost: null,
        error: "Missing, ambiguous or invalid Kidstory data for MP-250",
      },
      {
        entry: {
          sourceId: "16411",
          sku: "4M-03427",
          ean: "4893156034274",
          role: "HERO",
        },
        row: {
          id: "16411",
          sku: "4M-03427",
          ean: "4893156034274",
          name: "Hydraulic Arm",
          description: "Robotic arm",
          base_price: "250",
          currency: "RON",
          stock_status: "1",
          stock_status_string: "instock",
          file: "https://kidstory.ro/image4.jpg",
        },
        valid: true,
        retailPrice: 250,
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
          return Promise.resolve({
            id: `link-${sku}`,
            productId: `prod-${sku}`,
          });
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

    // Should NOT throw - sync succeeds with partial failure
    const result = await syncKidstoryPortfolio(mockPrisma, feed);

    expect(result.updated).toBe(2); // Two valid products updated
    expect(result.failed).toBe(1); // One failed product
    expect(result.error).toContain("1 products failed validation");

    // Verify the failed product was warned about
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "[Kidstory sync] Product failed validation (stock closed): MP-250 (CORE)"
      )
    );

    consoleWarnSpy.mockRestore();
  });

  it("syncs successfully when all products are valid (no partial failures)", async () => {
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
          sourceId: "16411",
          sku: "4M-03427",
          ean: "4893156034274",
          role: "HERO",
        },
        row: {
          id: "16411",
          sku: "4M-03427",
          ean: "4893156034274",
          name: "Hydraulic Arm",
          description: "Robotic arm",
          base_price: "250",
          currency: "RON",
          stock_status: "1",
          stock_status_string: "instock",
          file: "https://kidstory.ro/image4.jpg",
        },
        valid: true,
        retailPrice: 250,
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
          return Promise.resolve({
            id: `link-${sku}`,
            productId: `prod-${sku}`,
          });
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

    const result = await syncKidstoryPortfolio(mockPrisma, feed);

    expect(result.updated).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.error).toBeNull();
  });
});
