/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET, POST } from "@/app/api/checkout/shipping-quote/route";
import { SESSION_CART_STORAGE } from "@/lib/cart-storage";

jest.mock("@/lib/db", () => ({
  db: {
    product: { findMany: jest.fn() },
    book: { findMany: jest.fn() },
  },
}));

jest.mock("@/lib/utils/store-settings", () => ({
  getShippingSettings: jest.fn(() => Promise.resolve({
    deliveryPrice: { active: true, price: "19.99" },
    couriers: [
      {
        id: "fancourier",
        enabled: true,
        services: [
          {
            id: "standard",
            name: "FanCourier Standard",
            description: "Livrare la adresă",
            estimatedDelivery: "24-48h",
            methodType: "home",
            enabled: true,
            priceOverride: "19.99",
          },
        ],
      },
    ],
  })),
}));

const { db } = require("@/lib/db");

const stemKit = {
  id: "product-1",
  weight: 0.4,
  dimensions: { length: 20, width: 10, height: 5 },
  supplierId: "supplier-1",
  supplier: { id: "supplier-1", name: "TechTots", companyName: "TechTots" },
};

describe("POST /api/checkout/shipping-quote", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SESSION_CART_STORAGE.clear();
    db.book.findMany.mockResolvedValue([]);
    db.product.findMany.mockResolvedValue([stemKit]);
  });

  it("prices the lines the client sends when the server cart is empty", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/checkout/shipping-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "product-1", quantity: 2, price: 1 }],
        }),
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.isDigitalOnly).toBe(false);
    expect(body.methods).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "fancourier:standard",
          price: 19.99,
        }),
      ])
    );
    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ["product-1"] },
          isActive: true,
        }),
      })
    );
  });

  it("does not quote a truncated empty cookie when the client sent items", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/checkout/shipping-quote")
    );
    const emptyCookie = await response.json();
    expect(emptyCookie.isDigitalOnly).toBe(true);

    const quoted = await POST(
      new NextRequest("http://localhost/api/checkout/shipping-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: "product-1", quantity: 1 }],
        }),
      })
    );
    const quotedBody = await quoted.json();
    expect(quotedBody.isDigitalOnly).toBe(false);
    expect(quotedBody.methods[0].price).toBe(19.99);
  });
});
