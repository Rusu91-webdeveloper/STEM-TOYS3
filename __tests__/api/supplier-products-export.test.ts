/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET } from "@/app/api/supplier/products/export/route";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    supplier: { findUnique: jest.fn() },
    product: { findMany: jest.fn() },
  },
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

describe("/api/supplier/products/export", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires supplier auth", async () => {
    auth.mockResolvedValue({ user: { role: "CUSTOMER" } });
    const req = new NextRequest(
      "http://localhost/api/supplier/products/export"
    );
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns CSV with headers and rows", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue({ id: "s1" });
    db.product.findMany.mockResolvedValue([
      {
        name: "Test Product",
        sku: "SKU1",
        category: { name: "Category" },
        price: 10,
        compareAtPrice: null,
        isActive: true,
        stockQuantity: 5,
        reorderPoint: 2,
        totalSold: 12,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      },
    ]);

    const req = new NextRequest(
      "http://localhost/api/supplier/products/export"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/csv");
    const text = await res.text();
    expect(text.split("\n")[0]).toContain("Name,SKU,Category");
    expect(text).toContain("Test Product");
  });
});
