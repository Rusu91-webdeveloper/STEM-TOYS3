import {
  includeInProductSitemap,
  isVisibleOnProductsListing,
  resolvePdpVisibility,
} from "@/lib/products/catalog-access";

const visible = {
  slug: "kit-vizibil",
  name: "Kit de știință",
  stockQuantity: 6,
  isActive: true,
  status: "APPROVED",
  images: ["a.jpg"],
};

describe("sitemap and PDP visibility", () => {
  it("keeps a normal approved product in the sitemap and indexable", () => {
    expect(includeInProductSitemap(visible)).toBe(true);
    expect(resolvePdpVisibility(visible)).toBe("public");
  });

  it("keeps a standalone product that is also linked as an add-on", () => {
    const standaloneAddOn = {
      ...visible,
      slug: "plus-plus",
      name: "Plus-Plus",
      tags: ["upsell", "add-on"],
      metadata: { upsellFor: "parent-kit" },
    };

    expect(includeInProductSitemap(standaloneAddOn)).toBe(true);
    expect(isVisibleOnProductsListing(standaloneAddOn)).toBe(true);
  });

  it("sitemap product set equals the /products visible set", () => {
    const catalog = [
      visible,
      {
        ...visible,
        slug: "logiblocs",
        name: "Logiblocs",
        tags: ["add-on"],
        metadata: { upsellFor: ["base-a", "base-b"] },
      },
      {
        ...visible,
        slug: "pending-kit",
        status: "IN_PENDING",
      },
      {
        ...visible,
        slug: "hidden-addon",
        name: "Extensie ascunsă",
        tags: ["add-on"],
        metadata: {
          merchandising: { browseHidden: true },
          upsellFor: "parent",
        },
      },
      {
        ...visible,
        slug: "fridge",
        name: "Fridge Rover",
      },
      {
        ...visible,
        slug: "inactive",
        isActive: false,
      },
      {
        ...visible,
        slug: "draft",
        status: "DRAFT",
      },
      {
        ...visible,
        slug: "low-stock",
        stockQuantity: 1,
      },
    ];

    const listingSlugs = catalog
      .filter(isVisibleOnProductsListing)
      .map(product => product.slug)
      .sort();
    const sitemapSlugs = catalog
      .filter(includeInProductSitemap)
      .map(product => product.slug)
      .sort();

    expect(sitemapSlugs).toEqual(listingSlugs);
    expect(sitemapSlugs).toEqual(["kit-vizibil", "logiblocs", "pending-kit"]);
  });

  it("drops hidden, quality-hidden, and inactive products from the sitemap", () => {
    expect(
      includeInProductSitemap({
        ...visible,
        name: "Air Toobz extra",
        metadata: { merchandising: { browseHidden: true }, upsellFor: "parent" },
        tags: ["add-on"],
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        name: "Fridge Rover",
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        name: "Kit păianjen",
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        isActive: false,
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        status: "DRAFT",
      })
    ).toBe(false);
    expect(
      includeInProductSitemap({
        ...visible,
        stockQuantity: 1,
      })
    ).toBe(false);
  });

  it("noindexes hidden add-ons and 404s quality-hidden products", () => {
    expect(
      resolvePdpVisibility({
        ...visible,
        name: "Air Toobz extra",
        metadata: { browseHidden: undefined, upsellFor: "rocket", merchandising: { browseHidden: true } },
        tags: ["upsell"],
        stockQuantity: 4,
      })
    ).toBe("noindex");

    expect(
      resolvePdpVisibility({
        ...visible,
        name: "Fridge Rover",
        metadata: { merchandising: { browseHidden: true } },
        stockQuantity: 8,
      })
    ).toBe("not-found");

    expect(
      resolvePdpVisibility({
        ...visible,
        isActive: false,
      })
    ).toBe("not-found");
  });
});
