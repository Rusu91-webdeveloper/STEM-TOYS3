/** @jest-environment node */
import { PrismaClient } from "@prisma/client";

import {
  fetchKidstoryProducts,
  kidstoryContent,
  KIDSTORY_ID,
  KIDSTORY_SYNC_MODE,
  portfolio,
  selectKidstoryProducts,
} from "@/lib/suppliers/kidstory/feed";
import { syncKidstoryPortfolio } from "@/lib/suppliers/kidstory/sync";
import { installKidstoryHJ018 } from "@/scripts/add-kidstory-hj018";

jest.mock("@/lib/suppliers/kidstory/feed", () => ({
  ...jest.requireActual("@/lib/suppliers/kidstory/feed"),
  fetchKidstoryProducts: jest.fn(),
}));
const fetchProducts = jest.mocked(fetchKidstoryProducts);
const entry = portfolio.find(p => p.sku === "HJ018")!;
const row = {
  id: "31216",
  sku: "HJ018",
  ean: "850044215232",
  name: "Supplier title fixture",
  description: "Supplier description fixture",
  file: "https://example.com/kidstory-fixture.png",
  image2: "https://example.com/kidstory-fixture-2.png",
  varsta: "3-5 ani",
  base_price: "112",
  currency: "RON",
  stock_status: "1",
  stock_status_string: "instock",
  url: "https://example.com/kidstory-fixture",
};
const feed = {
  id: "kidstory-feed",
  supplierId: KIDSTORY_ID,
  sourceUrl: "https://example.com/feed",
  isActive: true,
  mapping: { syncMode: KIDSTORY_SYNC_MODE },
};
const existing = {
  id: "product-id",
  supplierId: KIDSTORY_ID,
  sku: entry.sku,
  barcode: entry.ean,
  categoryId: "category-id",
  reservedQuantity: 1,
  isActive: true,
  isBundle: false,
  status: "APPROVED",
  metadata: { other: "keep", kidstory: { role: "UPSELL", sourceId: "31216" } },
};

function database(products: unknown[] = [], link: unknown = null) {
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    supplierFeed: {
      findMany: jest.fn().mockResolvedValue([feed]),
      findUnique: jest.fn().mockResolvedValue(feed),
    },
    product: {
      findMany: jest.fn().mockResolvedValue(products),
      upsert: jest.fn().mockResolvedValue({ id: "product-id" }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    supplierProduct: {
      findUnique: jest.fn().mockResolvedValue(link),
      count: jest.fn().mockResolvedValue(0),
      upsert: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
    },
    category: {
      findUnique: jest.fn().mockResolvedValue({ id: "category-id" }),
    },
  };
  const db = { $transaction: jest.fn(fn => Promise.resolve(fn(tx))) };
  return { db: db as unknown as PrismaClient, tx };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "log").mockImplementation();
  fetchProducts.mockResolvedValue(selectKidstoryProducts([row], [entry]));
});
afterEach(() => jest.restoreAllMocks());

it("selects HJ018 as an optional UPSELL and scopes the age override to its exact identity", () => {
  expect(entry).toMatchObject({
    sourceId: "31216",
    sku: "HJ018",
    ean: "850044215232",
    role: "UPSELL",
    ageGroupOverride: "ELEMENTARY_6_8",
  });
  expect(kidstoryContent(row)).toMatchObject({
    ageGroup: "ELEMENTARY_6_8",
    attributes: { age: "3-5 ani", ageRange: "3-5 ani" },
  });
  for (const change of [{ id: "other" }, { sku: "other" }, { ean: "other" }])
    expect(kidstoryContent({ ...row, ...change }).ageGroup).toBe(
      "PRESCHOOL_3_5"
    );
});

it("defaults to a complete read-only create plan using only the selected live feed row", async () => {
  const { db, tx } = database();
  const plan = await installKidstoryHJ018(db);
  expect(fetchProducts).toHaveBeenCalledWith(feed.sourceUrl, [entry]);
  expect(plan.mode).toBe("DRY RUN");
  expect(plan.product).toMatchObject({
    action: "create",
    where: { sku: "HJ018" },
    data: {
      name: row.name,
      description: row.description,
      images: [row.file, row.image2],
      price: 112,
      compareAtPrice: null,
      ageGroup: "ELEMENTARY_6_8",
      isActive: true,
      status: "APPROVED",
      metadata: { kidstory: { role: "UPSELL", sourceId: "31216" } },
    },
  });
  expect(plan.stockQuantityRefresh.previewQuantity).toBe(1);
  expect(plan.product.data).not.toHaveProperty("averageRating");
  expect(plan.product.data).not.toHaveProperty("reviewCount");
  expect(plan.supplierProduct.data).toMatchObject({
    raw: row,
    stock: 0,
    attributes: {
      availabilityFlag: true,
      quantityKnown: false,
      retailReferenceRon: 112,
    },
  });
  expect(console.log).toHaveBeenCalledWith(JSON.stringify(plan, null, 2));
  expect(tx.$executeRaw.mock.calls.map(([sql]) => sql.join(""))).toEqual([
    "SET TRANSACTION READ ONLY",
    "SET TRANSACTION READ ONLY",
  ]);
  expect(tx.product.upsert).not.toHaveBeenCalled();
  expect(tx.supplierProduct.upsert).not.toHaveBeenCalled();
  expect(tx.product.updateMany).not.toHaveBeenCalled();
});

it("plans an update without replacing metadata or spending reserved stock", async () => {
  const { db, tx } = database([existing], {
    id: "link-id",
    productId: existing.id,
  });
  const plan = await installKidstoryHJ018(db);
  expect(plan.product).toMatchObject({
    action: "update",
    data: {
      metadata: { other: "keep", kidstory: { role: "UPSELL" } },
    },
  });
  expect(plan.stockQuantityRefresh.previewQuantity).toBe(0);
  expect(plan.supplierProduct.data.productId).toBe(existing.id);
  expect(tx.product.upsert).not.toHaveBeenCalled();
});

it("writes only one product and supplier link when apply is explicitly requested (mock database)", async () => {
  const { db, tx } = database([existing], {
    id: "link-id",
    productId: existing.id,
  });
  await installKidstoryHJ018(db, true);
  expect(tx.product.upsert).toHaveBeenCalledTimes(1);
  expect(tx.product.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ where: { sku: "HJ018" } })
  );
  expect(tx.supplierProduct.upsert).toHaveBeenCalledTimes(1);
  expect(tx.supplierProduct.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: {
        supplierId_supplierSku: {
          supplierId: KIDSTORY_ID,
          supplierSku: "HJ018",
        },
      },
      update: expect.objectContaining({ productId: existing.id }),
    })
  );
  expect(tx.$executeRaw.mock.calls[1][0].join("")).toBe(
    "SELECT pg_advisory_xact_lock(74261025)"
  );
  expect(tx.$executeRaw.mock.calls[2]).toEqual([
    expect.any(Array),
    1,
    existing.id,
  ]);
  expect(tx.$executeRaw.mock.calls[2][0].join("")).toContain(
    ' - "reservedQuantity")'
  );
  expect(tx.product.updateMany).not.toHaveBeenCalled();
});

it.each(["111", "113", "invalid"])(
  "rejects unreviewed retail price %s without writes",
  async base_price => {
    fetchProducts.mockResolvedValue(
      selectKidstoryProducts([{ ...row, base_price }], [entry])
    );
    const { db, tx } = database();
    await expect(installKidstoryHJ018(db)).rejects.toThrow("exactly 112 RON");
    expect(tx.product.upsert).not.toHaveBeenCalled();
  }
);

it.each([
  { products: [{ ...existing, supplierId: "another-supplier" }] },
  { products: [{ ...existing, barcode: "different" }] },
  {
    products: [
      { ...existing, metadata: { kidstory: { sourceId: "different" } } },
    ],
  },
  { products: [existing, { ...existing, id: "duplicate" }] },
])("rejects SKU/EAN/source collisions", async ({ products }) => {
  const { db, tx } = database(products);
  await expect(installKidstoryHJ018(db)).rejects.toThrow(/identity/);
  expect(tx.product.upsert).not.toHaveBeenCalled();
});

it("rejects conflicting supplier links and a changed feed", async () => {
  const conflict = database([], { id: "link", productId: "other-product" });
  await expect(installKidstoryHJ018(conflict.db)).rejects.toThrow(
    "mapping conflict"
  );
  const stale = database();
  stale.tx.supplierFeed.findUnique.mockResolvedValue({
    ...feed,
    isActive: false,
  });
  await expect(installKidstoryHJ018(stale.db)).rejects.toThrow("feed changed");
});

it("uses the source's out-of-stock flag without deactivating the product", async () => {
  fetchProducts.mockResolvedValue(
    selectKidstoryProducts(
      [{ ...row, stock_status: "0", stock_status_string: "outofstock" }],
      [entry]
    )
  );
  const { db } = database();
  const plan = await installKidstoryHJ018(db);
  expect(plan.product.data).toMatchObject({ stockQuantity: 0, isActive: true });
  expect(plan.stockQuantityRefresh.previewQuantity).toBe(0);
  expect(plan.supplierProduct.data.attributes.availabilityFlag).toBe(false);
});

it("nightly refresh follows exact retail and retains the age override, role and visibility", async () => {
  const { db, tx } = database([existing], {
    id: "link-id",
    productId: existing.id,
  });
  const product = {
    ...existing,
    reservedQuantity: 0,
    price: 112,
    ageGroup: "ELEMENTARY_6_8",
  };
  tx.product.updateMany.mockImplementation(({ data }) => {
    Object.assign(product, data);
    return Promise.resolve({ count: 1 });
  });
  for (const base_price of ["111", "112"]) {
    fetchProducts.mockResolvedValue(
      selectKidstoryProducts([{ ...row, base_price }], [entry])
    );
    await syncKidstoryPortfolio(db, feed);
    expect(product).toMatchObject({
      price: Number(base_price),
      ageGroup: "ELEMENTARY_6_8",
      isActive: true,
      status: "APPROVED",
      metadata: { other: "keep", kidstory: { role: "UPSELL" } },
    });
  }
  for (const [args] of tx.product.updateMany.mock.calls) {
    expect(args.data).not.toHaveProperty("isActive");
    expect(args.data).not.toHaveProperty("metadata");
  }
});
