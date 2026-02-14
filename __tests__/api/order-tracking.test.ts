/**
 * @jest-environment node
 */

import { GET } from "@/app/api/orders/[orderId]/tracking/route";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    order: {
      findUnique: jest.fn(),
    },
    address: {
      findUnique: jest.fn(),
    },
  },
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

describe("GET /api/orders/[orderId]/tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({ user: { id: "u1" } });
    db.address.findUnique.mockResolvedValue(null);
  });

  it("returns trackingAvailable=false and null fields when AWB is missing", async () => {
    db.order.findUnique.mockResolvedValue({
      id: "o1",
      orderNumber: "ORD-1",
      status: "PROCESSING",
      deliveredAt: null,
      createdAt: new Date("2026-02-10T10:00:00.000Z"),
      updatedAt: new Date("2026-02-10T10:00:00.000Z"),
      shippingAddressId: null,
      trackingNumber: null,
      carrier: null,
      estimatedDelivery: null,
      shipments: [],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ orderId: "o1" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.trackingAvailable).toBe(false);
    expect(data.order.trackingNumber).toBeNull();
    expect(data.order.carrier).toBeNull();
    expect(data.order.trackingUrl).toBeNull();
  });

  it("returns real AWB when shipment tracking exists", async () => {
    db.order.findUnique.mockResolvedValue({
      id: "o2",
      orderNumber: "ORD-2",
      status: "SHIPPED",
      deliveredAt: null,
      createdAt: new Date("2026-02-10T10:00:00.000Z"),
      updatedAt: new Date("2026-02-10T10:00:00.000Z"),
      shippingAddressId: null,
      trackingNumber: "AWB123",
      carrier: "FANCOURIER",
      estimatedDelivery: null,
      shipments: [{ awbNumber: "AWB123", courier: "FANCOURIER" }],
    });

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ orderId: "o2" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.order.trackingAvailable).toBe(true);
    expect(data.order.trackingNumber).toBe("AWB123");
    expect(data.order.carrier).toBe("FANCOURIER");
    expect(typeof data.order.trackingUrl).toBe("string");
  });
});
