import { isSupplierBuyUrl, toShopperProduct } from "@/lib/products/public-shopper";
import type { Product } from "@/types/product";

const product = {
  id: "p1",
  name: "Kit STEM",
  slug: "kit-stem",
  description: "Descriere",
  price: 99,
  images: ["https://www.boribon.ro/image/cache/kit.jpg"],
  metadata: {
    boribon: { url: "https://www.boribon.ro/cumpara/kit-stem" },
    seo: { faq: [{ question: "Varsta?", answer: "6+" }] },
  },
  tags: [],
  attributes: {
    brand: "Djeco",
    supplierUrl: "https://www.kidstory.ro/produs/kit-stem",
    age: "6+",
  },
  isActive: true,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-02T00:00:00Z"),
  stockQuantity: 2,
  reservedQuantity: 0,
  featured: false,
  supplier: {
    id: "sup-1",
    companyName: "Boribon",
    companySlug: "boribon",
  },
} satisfies Product;

describe("toShopperProduct", () => {
  it("keeps shopper fields and image files", () => {
    const publicProduct = toShopperProduct(product);

    expect(publicProduct.name).toBe("Kit STEM");
    expect(publicProduct.attributes?.brand).toBe("Djeco");
    expect(publicProduct.images[0]).toContain("kit.jpg");
    expect(publicProduct.createdAt).toEqual(product.createdAt);
    expect((publicProduct.metadata as { seo?: { faq?: unknown[] } }).seo?.faq)
      .toHaveLength(1);
  });

  it("strips supplier identity and buy URLs", () => {
    const publicProduct = toShopperProduct(product);
    const serialized = JSON.stringify(publicProduct);

    expect(publicProduct.supplier).toBeUndefined();
    expect(publicProduct.attributes).not.toHaveProperty("supplierUrl");
    expect(serialized).toContain("boribon.ro/image/cache/kit.jpg");
    expect(serialized).not.toMatch(/cumpara|kidstory|companyName|Boribon/);
  });

  it("does not treat supplier image URLs as buy links", () => {
    expect(
      isSupplierBuyUrl("https://cdn.kidstory.ro/products/photo.webp")
    ).toBe(false);
    expect(
      isSupplierBuyUrl("https://www.boribon.ro/cumpara/kit-stem-4406")
    ).toBe(true);
  });
});
