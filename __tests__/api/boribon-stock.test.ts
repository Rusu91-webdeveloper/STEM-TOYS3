/** @jest-environment node */
jest.mock("@/lib/db", () => ({ db: { product: { findMany: jest.fn() } } }));
import { NextRequest } from "next/server";
import { POST } from "@/app/api/products/stock/route";
import { BORIBON_ID, BORIBON_MAX_AGE_MS } from "@/lib/suppliers/boribon/feed";
const { db } = require("@/lib/db");
const product = (id: string, overrides = {}) => ({
  id,
  supplierId: BORIBON_ID,
  isActive: true,
  metadata: { boribon: {} },
  stockQuantity: 7,
  reservedQuantity: 3,
  supplierProducts: [{ lastSyncAt: new Date(), status: "MAPPED" }],
  ...overrides,
});
it("returns net stock once and closes stale, failed and inactive curated products", async () => {
  const products = [
    product("fresh"),
    product("stale", {
      supplierProducts: [
        {
          lastSyncAt: new Date(Date.now() - BORIBON_MAX_AGE_MS),
          status: "MAPPED",
        },
      ],
    }),
    product("failed", {
      supplierProducts: [{ lastSyncAt: new Date(), status: "ERROR" }],
    }),
    product("inactive", { isActive: false }),
    product("legacy", { metadata: null }),
  ];
  db.product.findMany.mockResolvedValue(products);
  const response = await POST(
    new NextRequest("http://localhost/api/products/stock", {
      method: "POST",
      body: JSON.stringify({ items: products.map(p => ({ productId: p.id })) }),
    })
  );
  expect(await response.json()).toEqual({
    fresh: 7,
    stale: 0,
    failed: 0,
    inactive: 0,
    legacy: 4,
  });
});

it("closes Kidstory availability when its feed is stale", async () => {
  db.product.findMany.mockResolvedValue([
    product("kidstory", { supplierId: "26f5418c-965d-4630-994c-b51947cdec04", metadata: { kidstory: {} }, stockQuantity: 1, reservedQuantity: 0,
      supplierProducts: [{ status: "MAPPED", lastSyncAt: new Date(Date.now() - BORIBON_MAX_AGE_MS) }] }),
  ]);
  const response = await POST(new NextRequest("http://localhost/api/products/stock", { method: "POST", body: JSON.stringify({ items: [{ productId: "kidstory" }] }) }));
  expect(await response.json()).toEqual({ kidstory: 0 });
});
