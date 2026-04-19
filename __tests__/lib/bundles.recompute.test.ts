jest.mock("@/lib/db", () => ({
  db: {
    product: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { recomputeBundles } from "@/lib/bundles/recompute";

describe("recomputeBundles", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("repairs legacy bundle item ids by slug fallback", async () => {
    (db.product.findMany as jest.Mock)
      .mockResolvedValueOnce([
        {
          id: "bundle-1",
          name: "Outdoor Nature Explorer Bundle",
          bundleItems: [
            "db3b31bd-38f8-468d-be17-45f9848452cf",
            "b054f550-18d9-4bce-a2c7-c4332fc7201e",
          ],
          bundleDiscount: 10,
          price: 0,
          compareAtPrice: 0,
          costPrice: 0,
          stockQuantity: 0,
          isActive: false,
          status: "IN_PENDING",
          supplierId: null,
          featured: false,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "current-hu-401",
          slug: "set-pentru-explorarea-naturii-outdoor-adventure-HU-401",
          price: 100,
          costPrice: 80,
          stockQuantity: 5,
          isActive: true,
          supplierId: "supplier-1",
          isBundle: false,
        },
        {
          id: "current-hu-530",
          slug: "binoclu-compact-hawk-HU-530",
          price: 50,
          costPrice: 40,
          stockQuantity: 2,
          isActive: true,
          supplierId: "supplier-1",
          isBundle: false,
        },
      ]);

    (db.product.update as jest.Mock).mockResolvedValue({ id: "bundle-1" });

    const result = await recomputeBundles();

    expect(result).toEqual({
      processed: 1,
      updated: 1,
      disabled: 0,
      skipped: 0,
      failed: 0,
    });

    expect(db.product.update).toHaveBeenCalledWith({
      where: { id: "bundle-1" },
      data: expect.objectContaining({
        bundleItems: ["current-hu-401", "current-hu-530"],
        compareAtPrice: 150,
        costPrice: 120,
        price: 135,
        stockQuantity: 2,
        supplierId: "supplier-1",
        isActive: true,
        status: "APPROVED",
      }),
    });
  });
});
