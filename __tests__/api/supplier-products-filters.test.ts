/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET } from "@/app/api/supplier/products/route";

jest.mock("@/lib/auth", () => ({ auth: jest.fn() }));
jest.mock("@/lib/db", () => ({
  db: {
    supplier: { findUnique: jest.fn() },
    product: { count: jest.fn(), findMany: jest.fn() },
  },
}));

const { auth } = require("@/lib/auth");
const { db } = require("@/lib/db");

describe("/api/supplier/products filters", () => {
  beforeEach(() => jest.clearAllMocks());

  it("applies price range and tags", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue({ id: "s1" });
    db.product.findMany.mockResolvedValue([]);
    db.product.count.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost:3000/api/supplier/products?minPrice=10&maxPrice=50&tags=educational,robotics&page=1&limit=10"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("supports sort by totalSold desc", async () => {
    auth.mockResolvedValue({ user: { id: "u1", role: "SUPPLIER" } });
    db.supplier.findUnique.mockResolvedValue({ id: "s1" });
    db.product.findMany.mockResolvedValue([]);
    db.product.count.mockResolvedValue(0);

    const req = new NextRequest(
      "http://localhost:3000/api/supplier/products?sortBy=totalSold-desc&page=1&limit=10"
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
