import { getUpsellProducts } from "@/features/products/components/CompleteSetUpsell";
import { prisma } from "@/lib/prisma";
import { BORIBON_ID } from "@/lib/suppliers/boribon/feed";

jest.mock("@/lib/prisma", () => ({
  prisma: { product: { findMany: jest.fn() } },
}));
const findMany = prisma.product.findMany as jest.Mock;
const product = (id: string, overrides = {}) => ({
  id,
  name: id,
  slug: id,
  price: 10,
  images: ["https://example.com/image.jpg"],
  stockQuantity: 2,
  supplierId: BORIBON_ID,
  metadata: { boribon: {} },
  supplierProducts: [{ status: "MAPPED", lastSyncAt: new Date() }],
  ...overrides,
});

describe("available upsell recommendations", () => {
  beforeEach(() => jest.clearAllMocks());
  it("excludes stale, invalid, and imageless products before applying the limit", async () => {
    findMany.mockResolvedValue([
      product("stale", {
        supplierProducts: [{ status: "MAPPED", lastSyncAt: new Date(0) }],
      }),
      product("failed", {
        supplierProducts: [{ status: "ERROR", lastSyncAt: new Date() }],
      }),
      product("no-image", { images: [] }),
      product("invalid-image", { images: [123, "not-a-url"] }),
      ...Array.from({ length: 7 }, (_, i) => product(`fresh-${i}`)),
    ]);
    const rows = await getUpsellProducts("base");
    expect(rows.map(p => p.id)).toEqual(
      Array.from({ length: 6 }, (_, i) => `fresh-${i}`)
    );
    const query = findMany.mock.calls[0][0];
    expect(query.where).toMatchObject({
      isActive: true,
      status: "APPROVED",
      stockQuantity: { gt: 0 },
      sku: { not: "base" },
    });
    expect(query.where.OR).toEqual([
      { metadata: { path: ["upsellFor"], equals: "base" } },
      { metadata: { path: ["upsellFor"], array_contains: ["base"] } },
    ]);
    expect(query.orderBy).toEqual([{ price: "asc" }, { slug: "asc" }]);
  });
});
