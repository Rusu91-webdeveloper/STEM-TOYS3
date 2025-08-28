/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET } from "@/app/api/supplier/stats/route";

jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/db", () => ({
  db: {
    supplier: { findUnique: jest.fn() },
    product: { count: jest.fn() },
    supplierOrder: { count: jest.fn(), aggregate: jest.fn() },
    supplierInvoice: { count: jest.fn() },
  },
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

describe("/api/supplier/stats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 403 for non-supplier", async () => {
    auth.mockResolvedValue({ user: { role: "CUSTOMER" } });

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it("returns 404 when supplier not found", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("returns aggregated stats for supplier", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue({ id: "s1", commissionRate: 15 });

    db.product.count.mockResolvedValueOnce(10); // totalProducts
    db.product.count.mockResolvedValueOnce(8); // activeProducts
    db.supplierOrder.count.mockResolvedValueOnce(25); // totalOrders
    db.supplierOrder.count.mockResolvedValueOnce(3); // pendingOrders
    db.supplierOrder.aggregate.mockResolvedValueOnce({
      _sum: { supplierRevenue: 1200, commission: 180 },
    }); // all time
    db.supplierOrder.aggregate.mockResolvedValueOnce({
      _sum: { supplierRevenue: 300 },
    }); // this month
    db.supplierInvoice.count.mockResolvedValueOnce(2); // pending invoices

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({
      totalProducts: 10,
      activeProducts: 8,
      totalOrders: 25,
      pendingOrders: 3,
      totalRevenue: 1200,
      monthlyRevenue: 300,
      commissionEarned: 180,
      pendingInvoices: 2,
    });
  });
});
