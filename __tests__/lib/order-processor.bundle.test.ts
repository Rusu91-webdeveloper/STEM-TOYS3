jest.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    supplierOrder: {
      create: jest.fn(),
    },
    supplierNotification: {
      create: jest.fn(),
    },
  },
}));

jest.mock("@/lib/order-fulfillment-sync", () => ({
  syncParentOrderFromSupplierOrders: jest.fn(),
}));

import { db } from "@/lib/db";
import { OrderProcessor } from "@/lib/order-processor";

describe("OrderProcessor bundle handling", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates supplier lines for each bundle component", async () => {
    (db.order.findUnique as jest.Mock).mockResolvedValue({
      id: "order-1",
      orderNumber: "ORD-1",
      items: [
        {
          id: "order-item-1",
          name: "Bundle Product",
          quantity: 2,
          productId: "bundle-1",
          product: {
            id: "bundle-1",
            name: "Bundle Product",
            isBundle: true,
            bundleItems: ["comp-1", "comp-2"],
            supplier: {
              id: "supplier-1",
              name: "Boribon",
            },
          },
        },
      ],
    });

    (db.product.findMany as jest.Mock).mockResolvedValue([
      {
        id: "comp-1",
        name: "Component 1",
        costPrice: 10,
        supplier: {
          id: "supplier-1",
          name: "Boribon",
        },
      },
      {
        id: "comp-2",
        name: "Component 2",
        costPrice: 20,
        supplier: {
          id: "supplier-1",
          name: "Boribon",
        },
      },
    ]);

    (db.supplierOrder.create as jest.Mock)
      .mockResolvedValueOnce({
        id: "so-1",
        supplierId: "supplier-1",
        productId: "comp-1",
        quantity: 2,
        status: "PENDING",
        supplier: { name: "Boribon" },
        product: { name: "Component 1" },
      })
      .mockResolvedValueOnce({
        id: "so-2",
        supplierId: "supplier-1",
        productId: "comp-2",
        quantity: 2,
        status: "PENDING",
        supplier: { name: "Boribon" },
        product: { name: "Component 2" },
      });

    (db.supplierNotification.create as jest.Mock).mockResolvedValue({
      id: "notif-1",
    });
    (db.order.update as jest.Mock).mockResolvedValue({ id: "order-1" });

    const result = await OrderProcessor.processNewOrder("order-1");

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.supplierOrders).toHaveLength(2);
    expect(db.supplierOrder.create).toHaveBeenCalledTimes(2);

    const createCalls = (db.supplierOrder.create as jest.Mock).mock.calls.map(
      ([arg]) => arg.data
    );

    expect(createCalls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          orderItemId: "order-item-1",
          supplierId: "supplier-1",
          productId: "comp-1",
          quantity: 2,
          unitCost: 10,
          totalCost: 20,
        }),
        expect.objectContaining({
          orderItemId: "order-item-1",
          supplierId: "supplier-1",
          productId: "comp-2",
          quantity: 2,
          unitCost: 20,
          totalCost: 40,
        }),
      ])
    );
  });
});
